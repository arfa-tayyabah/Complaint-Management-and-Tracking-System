require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { stringify } = require('csv-stringify/sync');

const app = express();
app.use(cors());
app.use(express.json());

const UPLOAD_DIR = path.join(__dirname, 'uploads', 'complaints');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `c_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png'].includes(file.mimetype))
      return cb(new Error('Only JPG and PNG files are allowed'));
    cb(null, true);
  },
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

function enrichUser(user) {
  return {
    ...user,
    is_senior_handler: user.role === 'senior_handler',
    is_sub_handler: user.role === 'junior_handler',
    is_administrator: user.role === 'software_operator',
  };
}

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(
      `SELECT user_id, full_name, email, role, account_status, department_id
       FROM User WHERE user_id = ?`,
      [decoded.userId]
    );
    if (rows.length === 0 || rows[0].account_status !== 'Active')
      return res.status(401).json({ error: 'Invalid or inactive user' });
    req.user = enrichUser(rows[0]);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

async function logAudit(conn, userId, complaintId, actionType, description, ip) {
  try {
    await conn.query(
      `INSERT INTO Audit_Log (user_id, complaint_id, action_type, description, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [userId || null, complaintId || null, actionType, description || null, ip || null]
    );
  } catch {}
}

function getIP(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
}

app.get('/api/test', (req, res) => res.json({ ok: true }));

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const ip = getIP(req);
  try {
    const [rows] = await pool.query(
      `SELECT user_id, full_name, email, password_hash, role, account_status, department_id, failed_login_count
       FROM User WHERE email = ?`,
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];
    if (user.account_status !== 'Active') {
      return res.status(401).json({ error: 'Account is locked or inactive. Contact the Software Operator.' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const newCount = (user.failed_login_count || 0) + 1;
      await pool.query(`UPDATE User SET failed_login_count = ? WHERE user_id = ?`, [newCount, user.user_id]);
      await logAudit(pool, user.user_id, null, 'Login_Failed', `Failed login attempt for ${email}`, ip);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    await pool.query(`UPDATE User SET failed_login_count = 0 WHERE user_id = ?`, [user.user_id]);
    const token = jwt.sign({ userId: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    const enrichedUser = enrichUser(user);
    delete enrichedUser.password_hash;
    delete enrichedUser.failed_login_count;
    await logAudit(pool, user.user_id, null, 'Login', `User logged in: ${email}`, ip);
    res.json({ token, user: enrichedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/me', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.full_name, u.email, u.role, u.account_status, u.department_id, u.created_at,
              d.name as department_name,
              s.reg_number, s.program, s.semester,
              f.designation, f.office_number,
              st.position, st.staff_type
       FROM User u
       LEFT JOIN Department d ON u.department_id = d.department_id
       LEFT JOIN Student s ON u.user_id = s.user_id
       LEFT JOIN Faculty f ON u.user_id = f.user_id
       LEFT JOIN Staff st ON u.user_id = st.user_id
       WHERE u.user_id = ?`,
      [req.user.user_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const u = rows[0];
    res.json(enrichUser(u));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/api/me', authenticate, async (req, res) => {
  const { full_name, current_password, new_password } = req.body;
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(`SELECT password_hash FROM User WHERE user_id = ?`, [req.user.user_id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    if (full_name) {
      await conn.query(`UPDATE User SET full_name = ? WHERE user_id = ?`, [full_name.trim(), req.user.user_id]);
    }
    if (new_password) {
      if (!current_password) return res.status(400).json({ error: 'Current password required' });
      const valid = await bcrypt.compare(current_password, rows[0].password_hash);
      if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
      if (new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
      const hash = await bcrypt.hash(new_password, 10);
      await conn.query(`UPDATE User SET password_hash = ? WHERE user_id = ?`, [hash, req.user.user_id]);
    }
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

async function buildComplaintsQuery(user, extra_conditions = [], extra_params = []) {
  let query = `
    SELECT c.*,
           d.department_id,
           d.name AS department_name,
           t.name AS tracker_name,
           u.full_name AS complainant_name,
           h.full_name AS handler_name
    FROM Complaint c
    JOIN Tracker t ON c.tracker_id = t.tracker_id
    JOIN Department d ON t.department_id = d.department_id
    JOIN User u ON c.complainant_id = u.user_id
    LEFT JOIN User h ON c.handler_id = h.user_id
  `;
  let conditions = [...extra_conditions];
  let params = [...extra_params];
  if (user.is_administrator || user.is_senior_handler) {
  } else if (user.is_sub_handler) {
    conditions.push('c.handler_id = ?');
    params.push(user.user_id);
  } else {
    conditions.push('c.complainant_id = ?');
    params.push(user.user_id);
  }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY c.complaint_id DESC';
  return { query, params };
}

app.get('/api/complaints', authenticate, async (req, res) => {
  try {
    const { query, params } = await buildComplaintsQuery(req.user);
    const [complaints] = await pool.query(query, params);
    const ids = complaints.map(c => c.complaint_id);
    if (!ids.length) return res.json([]);

    const [attachments] = await pool.query(
      `SELECT * FROM Attachment WHERE complaint_id IN (?)`, [ids]
    );
    const [history] = await pool.query(
      `SELECT sh.*, u.full_name AS changed_by_name
       FROM Status_History sh
       LEFT JOIN User u ON sh.changed_by = u.user_id
       WHERE sh.complaint_id IN (?)
       ORDER BY sh.changed_at ASC`,
      [ids]
    );
    const [feedbacks] = await pool.query(
      `SELECT * FROM Feedback WHERE complaint_id IN (?)`, [ids]
    );

    const attMap = {}, histMap = {}, fbMap = {};
    attachments.forEach(a => { (attMap[a.complaint_id] = attMap[a.complaint_id] || []).push(a); });
    history.forEach(h => { (histMap[h.complaint_id] = histMap[h.complaint_id] || []).push(h); });
    feedbacks.forEach(f => { fbMap[f.complaint_id] = f; });

    const result = complaints.map(c => ({
      ...c,
      attachments: attMap[c.complaint_id] || [],
      history: histMap[c.complaint_id] || [],
      feedback: fbMap[c.complaint_id] || null,
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

app.get('/api/complaints/:id', authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const [rows] = await pool.query(
      `SELECT c.*, d.department_id, d.name AS department_name, t.name AS tracker_name,
              u.full_name AS complainant_name, h.full_name AS handler_name
       FROM Complaint c
       JOIN Tracker t ON c.tracker_id = t.tracker_id
       JOIN Department d ON t.department_id = d.department_id
       JOIN User u ON c.complainant_id = u.user_id
       LEFT JOIN User h ON c.handler_id = h.user_id
       WHERE c.complaint_id = ?`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const c = rows[0];
    const user = req.user;
    if (!user.is_administrator && !user.is_senior_handler) {
      if (user.is_sub_handler && c.handler_id !== user.user_id)
        return res.status(403).json({ error: 'Access denied' });
      if (!user.is_sub_handler && c.complainant_id !== user.user_id)
        return res.status(403).json({ error: 'Access denied' });
    }
    const [[attachments], [history], [feedbacks]] = await Promise.all([
      pool.query(`SELECT * FROM Attachment WHERE complaint_id = ?`, [id]),
      pool.query(`SELECT sh.*, u.full_name AS changed_by_name FROM Status_History sh LEFT JOIN User u ON sh.changed_by = u.user_id WHERE sh.complaint_id = ? ORDER BY sh.changed_at ASC`, [id]),
      pool.query(`SELECT * FROM Feedback WHERE complaint_id = ?`, [id]),
    ]);
    res.json({ ...c, attachments, history, feedback: feedbacks[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/complaints', authenticate, upload.array('attachments', 5), async (req, res) => {
  const user = req.user;
  if (user.is_administrator || user.is_senior_handler || user.is_sub_handler)
    return res.status(403).json({ error: 'Only complainants can submit complaints' });

  const { tracker_id, subject, description, priority, location } = req.body;
  if (!tracker_id || !subject || !description || !priority)
    return res.status(400).json({ error: 'tracker_id, subject, description, and priority are required' });
  if (!['Low', 'Medium', 'High', 'Critical'].includes(priority))
    return res.status(400).json({ error: 'Invalid priority' });
  if (subject.length > 200) return res.status(400).json({ error: 'Subject too long (max 200 chars)' });
  if (description.length > 2000) return res.status(400).json({ error: 'Description too long (max 2000 chars)' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO Complaint (complainant_id, tracker_id, status, priority, subject, description, location)
       VALUES (?, ?, 'New', ?, ?, ?, ?)`,
      [user.user_id, tracker_id, priority, subject.trim(), description.trim(), (location || '').trim() || null]
    );
    const complaintId = result.insertId;

    if (req.files && req.files.length) {
      for (const file of req.files) {
        const ext = path.extname(file.originalname).toLowerCase().replace('.', '').toUpperCase();
        const sizeKb = Math.round(file.size / 1024) || 1;
        const storagePath = `/uploads/complaints/${file.filename}`;
        await conn.query(
          `INSERT INTO Attachment (complaint_id, file_name, file_type, file_size_kb, storage_path)
           VALUES (?, ?, ?, ?, ?)`,
          [complaintId, file.originalname, ext === 'JPG' ? 'JPG' : 'PNG', sizeKb, storagePath]
        );
      }
    }
    await conn.commit();
    res.status(201).json({ message: 'Complaint submitted successfully', complaint_id: complaintId });
  } catch (err) {
    await conn.rollback();
    if (req.files) req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to submit complaint' });
  } finally {
    conn.release();
  }
});

app.patch('/api/complaints/:id/status', authenticate, async (req, res) => {
  const user = req.user;
  const complaintId = parseInt(req.params.id);
  const { status, remarks } = req.body;
  const VALID = ['New', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected', 'Closed'];
  if (!status || !VALID.includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  if (!user.is_senior_handler && !user.is_sub_handler)
    return res.status(403).json({ error: 'Only complaint handlers can change status' });
  try {
    const [rows] = await pool.query(`SELECT * FROM Complaint WHERE complaint_id = ?`, [complaintId]);
    if (!rows.length) return res.status(404).json({ error: 'Complaint not found' });
    const c = rows[0];
    if (user.is_sub_handler && c.handler_id !== user.user_id)
      return res.status(403).json({ error: 'Junior handlers can only update their own assigned complaints' });
    await pool.query(
      `UPDATE Complaint SET status = ? WHERE complaint_id = ?`,
      [status, complaintId]
    );
    res.json({ message: 'Status updated', status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to update status' });
  }
});

app.post('/api/complaints/:id/assign', authenticate, async (req, res) => {
  if (!req.user.is_senior_handler)
    return res.status(403).json({ error: 'Only senior handlers can assign complaints' });
  const complaintId = parseInt(req.params.id);
  const { handler_id, remarks } = req.body;
  if (!handler_id) return res.status(400).json({ error: 'handler_id required' });
  try {
    const [handlerRows] = await pool.query(
      `SELECT user_id FROM User WHERE user_id = ? AND role = 'junior_handler' AND account_status = 'Active'`,
      [handler_id]
    );
    if (!handlerRows.length) return res.status(400).json({ error: 'Invalid or inactive junior handler' });

    await pool.query(
      `UPDATE Complaint SET handler_id = ?, status = 'Assigned' WHERE complaint_id = ?`,
      [handler_id, complaintId]
    );
    await logAudit(pool, req.user.user_id, complaintId, 'Complaint_Assigned',
      `Complaint #${complaintId} assigned to handler #${handler_id}. ${remarks || ''}`, getIP(req));
    res.json({ message: 'Complaint assigned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to assign complaint' });
  }
});

app.post('/api/complaints/:id/feedback', authenticate, async (req, res) => {
  const user = req.user;
  const complaintId = parseInt(req.params.id);
  if (user.is_administrator || user.is_senior_handler || user.is_sub_handler)
    return res.status(403).json({ error: 'Only complainants can submit feedback' });
  const { overall_rating, response_time_rating, communication_rating, resolution_rating, text_comment } = req.body;
  if (!overall_rating || overall_rating < 1 || overall_rating > 5)
    return res.status(400).json({ error: 'overall_rating must be between 1 and 5' });
  try {
    const [rows] = await pool.query(
      `SELECT * FROM Complaint WHERE complaint_id = ?`, [complaintId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Complaint not found' });
    const c = rows[0];
    if (c.complainant_id !== user.user_id)
      return res.status(403).json({ error: 'You can only submit feedback on your own complaints' });
    if (c.status !== 'Resolved')
      return res.status(400).json({ error: 'Feedback can only be submitted on resolved complaints' });
    const [existing] = await pool.query(`SELECT feedback_id FROM Feedback WHERE complaint_id = ?`, [complaintId]);
    if (existing.length) return res.status(409).json({ error: 'Feedback already submitted for this complaint' });

    await pool.query(
      `INSERT INTO Feedback (complaint_id, overall_rating, response_time_rating, communication_rating, resolution_rating, text_comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [complaintId, overall_rating, response_time_rating || null, communication_rating || null, resolution_rating || null, text_comment || null]
    );
    const newStatus = overall_rating > 3 ? 'Closed' : 'Under Review';
    res.json({ message: 'Feedback submitted', new_status: newStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to submit feedback' });
  }
});

app.get('/api/admin/users', authenticate, async (req, res) => {
  if (!req.user.is_administrator && !req.user.is_senior_handler)
    return res.status(403).json({ error: 'Access denied' });
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.full_name, u.email, u.role, u.account_status, u.department_id,
              d.name AS department_name,
              s.reg_number, s.program, s.semester,
              f.designation, f.office_number,
              st.position, st.staff_type
       FROM User u
       LEFT JOIN Department d ON u.department_id = d.department_id
       LEFT JOIN Student s ON u.user_id = s.user_id
       LEFT JOIN Faculty f ON u.user_id = f.user_id
       LEFT JOIN Staff st ON u.user_id = st.user_id
       ORDER BY u.user_id`
    );
    res.json(rows.map(enrichUser));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/admin/users', authenticate, async (req, res) => {
  if (!req.user.is_administrator)
    return res.status(403).json({ error: 'Only the Software Operator can create users' });
  const {
    full_name, email, password, role, department_id,
    is_student, is_faculty, is_staff,
    reg_number, program, semester, enrollment_date,
    designation, office_number,
    position, staff_type
  } = req.body;
  if (!full_name || !email || !password || !role)
    return res.status(400).json({ error: 'full_name, email, password, role are required' });
  const VALID_ROLES = ['complainant', 'junior_handler', 'senior_handler', 'software_operator'];
  if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const hash = await bcrypt.hash(password, 10);
    const flagStudent = !!is_student;
    const flagFaculty = !!is_faculty;
    const flagStaff = !!is_staff;

    const [result] = await conn.query(
      `INSERT INTO User (full_name, email, password_hash, role, department_id, is_student, is_faculty, is_staff, account_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [full_name.trim(), email.trim().toLowerCase(), hash, role, department_id || null, flagStudent, flagFaculty, flagStaff]
    );
    const userId = result.insertId;

    if (flagStudent && reg_number && program) {
      await conn.query(
        `INSERT INTO Student (user_id, reg_number, program, semester, enrollment_date) VALUES (?, ?, ?, ?, ?)`,
        [userId, reg_number, program, semester || null, enrollment_date || new Date().toISOString().split('T')[0]]
      );
    }
    if (flagFaculty && designation) {
      await conn.query(
        `INSERT INTO Faculty (user_id, designation, office_number) VALUES (?, ?, ?)`,
        [userId, designation, office_number || null]
      );
    }
    if (flagStaff && position) {
      await conn.query(
        `INSERT INTO Staff (user_id, position, staff_type) VALUES (?, ?, ?)`,
        [userId, position, staff_type || 'Technical']
      );
    }
    if (role === 'junior_handler' || role === 'senior_handler') {
      const [senior] = await conn.query(`SELECT user_id FROM User WHERE role = 'senior_handler' LIMIT 1`);
      const managerId = role === 'junior_handler' && senior.length ? senior[0].user_id : null;
      await conn.query(
        `INSERT INTO Complaint_Handler (user_id, handler_level, manager_id) VALUES (?, ?, ?)`,
        [userId, role === 'senior_handler' ? 'senior' : 'junior', managerId]
      );
    }
    await logAudit(conn, req.user.user_id, null, 'User_Created', `Created user: ${email} (${role})`, getIP(req));
    await conn.commit();
    res.status(201).json({ message: 'User created successfully', user_id: userId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message || 'Failed to create user' });
  } finally {
    conn.release();
  }
});

app.put('/api/admin/users/:id', authenticate, async (req, res) => {
  if (!req.user.is_administrator)
    return res.status(403).json({ error: 'Only the Software Operator can edit users' });
  const userId = parseInt(req.params.id);
  const { full_name, email, department_id, role } = req.body;
  try {
    const updates = [];
    const params = [];
    if (full_name) { updates.push('full_name = ?'); params.push(full_name.trim()); }
    if (email) { updates.push('email = ?'); params.push(email.trim().toLowerCase()); }
    if (department_id !== undefined) { updates.push('department_id = ?'); params.push(department_id || null); }
    if (role) {
      const VALID = ['complainant', 'junior_handler', 'senior_handler', 'software_operator'];
      if (!VALID.includes(role)) return res.status(400).json({ error: 'Invalid role' });
      updates.push('role = ?'); params.push(role);
    }
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
    params.push(userId);
    await pool.query(`UPDATE User SET ${updates.join(', ')} WHERE user_id = ?`, params);
    await logAudit(pool, req.user.user_id, null, 'User_Updated', `Updated user #${userId}`, getIP(req));
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already in use' });
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.patch('/api/admin/users/:id/lock', authenticate, async (req, res) => {
  if (!req.user.is_administrator)
    return res.status(403).json({ error: 'Only the Software Operator can change account status' });
  const userId = parseInt(req.params.id);
  const { status } = req.body;
  if (!['Active', 'Locked', 'Inactive'].includes(status))
    return res.status(400).json({ error: 'Invalid status. Use Active, Locked, or Inactive' });
  try {
    await pool.query(
      `UPDATE User SET account_status = ?, failed_login_count = 0 WHERE user_id = ?`,
      [status, userId]
    );
    await logAudit(pool, req.user.user_id, null, 'User_Updated', `Account #${userId} status set to ${status}`, getIP(req));
    res.json({ message: `Account status set to ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update account status' });
  }
});

app.patch('/api/admin/users/:id/reset-password', authenticate, async (req, res) => {
  if (!req.user.is_administrator)
    return res.status(403).json({ error: 'Only the Software Operator can reset passwords' });
  const userId = parseInt(req.params.id);
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const hash = await bcrypt.hash(new_password, 10);
    await pool.query(`UPDATE User SET password_hash = ? WHERE user_id = ?`, [hash, userId]);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

app.get('/api/departments', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM Department ORDER BY name`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

app.post('/api/departments', authenticate, async (req, res) => {
  if (!req.user.is_administrator)
    return res.status(403).json({ error: 'Only the Software Operator can manage departments' });
  const { name, description, is_active } = req.body;
  if (!name) return res.status(400).json({ error: 'Department name is required' });
  try {
    const [result] = await pool.query(
      `INSERT INTO Department (name, description, is_active) VALUES (?, ?, ?)`,
      [name.trim(), description || null, is_active !== false]
    );
    res.status(201).json({ message: 'Department created', department_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Department name already exists' });
    res.status(500).json({ error: 'Failed to create department' });
  }
});

app.put('/api/departments/:id', authenticate, async (req, res) => {
  if (!req.user.is_administrator)
    return res.status(403).json({ error: 'Only the Software Operator can manage departments' });
  const id = parseInt(req.params.id);
  const { name, description, is_active } = req.body;
  try {
    const updates = [], params = [];
    if (name) { updates.push('name = ?'); params.push(name.trim()); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description || null); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(!!is_active); }
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
    params.push(id);
    await pool.query(`UPDATE Department SET ${updates.join(', ')} WHERE department_id = ?`, params);
    res.json({ message: 'Department updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Name already in use' });
    res.status(500).json({ error: 'Failed to update department' });
  }
});

app.get('/api/trackers', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, d.name AS department_name FROM Tracker t JOIN Department d ON t.department_id = d.department_id ORDER BY d.name, t.name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trackers' });
  }
});

app.post('/api/trackers', authenticate, async (req, res) => {
  if (!req.user.is_administrator)
    return res.status(403).json({ error: 'Only the Software Operator can manage trackers' });
  const { department_id, name, description, is_active } = req.body;
  if (!department_id || !name) return res.status(400).json({ error: 'department_id and name are required' });
  try {
    const [result] = await pool.query(
      `INSERT INTO Tracker (department_id, name, description, is_active) VALUES (?, ?, ?, ?)`,
      [department_id, name.trim(), description || null, is_active !== false]
    );
    res.status(201).json({ message: 'Tracker created', tracker_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create tracker' });
  }
});

app.put('/api/trackers/:id', authenticate, async (req, res) => {
  if (!req.user.is_administrator)
    return res.status(403).json({ error: 'Only the Software Operator can manage trackers' });
  const id = parseInt(req.params.id);
  const { name, description, is_active, department_id } = req.body;
  try {
    const updates = [], params = [];
    if (name) { updates.push('name = ?'); params.push(name.trim()); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description || null); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(!!is_active); }
    if (department_id) { updates.push('department_id = ?'); params.push(department_id); }
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
    params.push(id);
    await pool.query(`UPDATE Tracker SET ${updates.join(', ')} WHERE tracker_id = ?`, params);
    res.json({ message: 'Tracker updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update tracker' });
  }
});

app.get('/api/audit', authenticate, async (req, res) => {
  if (!req.user.is_administrator && !req.user.is_senior_handler)
    return res.status(403).json({ error: 'Access denied' });
  try {
    const [rows] = await pool.query(
      `SELECT a.*, u.full_name FROM Audit_Log a
       LEFT JOIN User u ON a.user_id = u.user_id
       ORDER BY a.occurred_at DESC LIMIT 500`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

app.get('/api/reports/complaints', authenticate, async (req, res) => {
  if (!req.user.is_senior_handler && !req.user.is_administrator)
    return res.status(403).json({ error: 'Access denied' });
  try {
    const { from, to, status, departmentId, format } = req.query;
    let conditions = [];
    let params = [];
    if (from) { conditions.push('c.created_at >= ?'); params.push(from + ' 00:00:00'); }
    if (to) { conditions.push('c.created_at <= ?'); params.push(to + ' 23:59:59'); }
    if (status) { conditions.push('c.status = ?'); params.push(status); }
    if (departmentId) { conditions.push('t.department_id = ?'); params.push(departmentId); }

    let sql = `
      SELECT c.complaint_id, c.subject, c.description, c.priority, c.status,
             c.location, c.created_at, c.updated_at,
             d.name AS department, t.name AS tracker,
             u.full_name AS complainant, u.email AS complainant_email,
             h.full_name AS handler,
             f.overall_rating, f.response_time_rating, f.communication_rating,
             f.resolution_rating, f.text_comment AS feedback_comment,
             f.submitted_at AS feedback_submitted_at,
             TIMESTAMPDIFF(DAY, c.created_at, COALESCE(f.submitted_at, c.updated_at)) AS resolution_days
      FROM Complaint c
      JOIN Tracker t ON c.tracker_id = t.tracker_id
      JOIN Department d ON t.department_id = d.department_id
      JOIN User u ON c.complainant_id = u.user_id
      LEFT JOIN User h ON c.handler_id = h.user_id
      LEFT JOIN Feedback f ON c.complaint_id = f.complaint_id
    `;
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY c.complaint_id DESC';

    const [rows] = await pool.query(sql, params);

    const csvData = stringify(rows, {
      header: true,
      columns: [
        { key: 'complaint_id', header: 'ID' },
        { key: 'subject', header: 'Subject' },
        { key: 'department', header: 'Department' },
        { key: 'tracker', header: 'Tracker' },
        { key: 'priority', header: 'Priority' },
        { key: 'status', header: 'Status' },
        { key: 'location', header: 'Location' },
        { key: 'complainant', header: 'Complainant' },
        { key: 'complainant_email', header: 'Email' },
        { key: 'handler', header: 'Assigned To' },
        { key: 'created_at', header: 'Created At' },
        { key: 'updated_at', header: 'Last Updated' },
        { key: 'resolution_days', header: 'Resolution Days' },
        { key: 'overall_rating', header: 'Overall Rating' },
        { key: 'response_time_rating', header: 'Response Time Rating' },
        { key: 'communication_rating', header: 'Communication Rating' },
        { key: 'resolution_rating', header: 'Resolution Rating' },
        { key: 'feedback_comment', header: 'Feedback Comment' },
        { key: 'feedback_submitted_at', header: 'Feedback Date' },
      ],
    });

    if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', 'attachment; filename="cmts-report.xls"');
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="cmts-report.csv"');
    }
    res.send(csvData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large. Max 2MB per image.' });
    if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: 'Too many files. Max 5 images.' });
  }
  if (err && err.message) return res.status(400).json({ error: err.message });
  next(err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`CMTS Backend running on port ${PORT}`);
  console.log('Endpoints:');
  console.log('  POST   /api/auth/login');
  console.log('  GET    /api/me');
  console.log('  PATCH  /api/me');
  console.log('  GET    /api/complaints');
  console.log('  GET    /api/complaints/:id');
  console.log('  POST   /api/complaints  (multipart)');
  console.log('  PATCH  /api/complaints/:id/status');
  console.log('  POST   /api/complaints/:id/assign');
  console.log('  POST   /api/complaints/:id/feedback');
  console.log('  GET    /api/admin/users');
  console.log('  POST   /api/admin/users');
  console.log('  PUT    /api/admin/users/:id');
  console.log('  PATCH  /api/admin/users/:id/lock');
  console.log('  PATCH  /api/admin/users/:id/reset-password');
  console.log('  GET    /api/departments');
  console.log('  POST   /api/departments');
  console.log('  PUT    /api/departments/:id');
  console.log('  GET    /api/trackers');
  console.log('  POST   /api/trackers');
  console.log('  PUT    /api/trackers/:id');
  console.log('  GET    /api/audit');
  console.log('  GET    /api/reports/complaints');
});
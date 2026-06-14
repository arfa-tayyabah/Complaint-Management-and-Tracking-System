/* ============================================================
   CMTS — App controller (full functionality, API-driven)
   ============================================================ */

(function () {
  const APP = { user: null, route: null };
  window.APP = APP;

  /* ---------- navigation ---------- */
  function navFor(u) {
    if (u.is_administrator) {
      return [
        { sec: 'Operations' },
        { id: 'operator-dashboard', label: 'Dashboard', icon: 'home' },
        { id: 'analytics', label: 'Analytics & Reports', icon: 'activity' },
        { id: 'users', label: 'User Management', icon: 'users' },
        { id: 'departments', label: 'Departments & Trackers', icon: 'building' },
        { sec: 'Monitoring' },
        { id: 'audit', label: 'Audit Log', icon: 'activity' },
        { sec: 'Account' },
        { id: 'profile', label: 'My Profile', icon: 'user' },
      ];
    }
    if (u.is_senior_handler) {
      return [
        { sec: 'Console' },
        { id: 'senior-dashboard', label: 'Dashboard', icon: 'home' },
        { id: 'all-complaints', label: 'All Complaints', icon: 'inbox', count: () => CMTS.state.complaints.filter(c => ['New', 'Under Review'].includes(c.status)).length },
        { id: 'analytics', label: 'Analytics & Reports', icon: 'activity' },
        { sec: 'Account' },
        { id: 'profile', label: 'My Profile', icon: 'user' },
      ];
    }
    if (u.is_sub_handler) {
      return [
        { sec: 'My Work' },
        { id: 'junior-dashboard', label: 'Dashboard', icon: 'home' },
        { id: 'assigned', label: 'Assigned to Me', icon: 'inbox', count: () => CMTS.complaintsFor(u).filter(c => !['Closed', 'Rejected', 'Resolved'].includes(c.status)).length },
        { sec: 'Account' },
        { id: 'profile', label: 'My Profile', icon: 'user' },
      ];
    }
    return [
      { sec: 'Complaints' },
      { id: 'dashboard', label: 'Dashboard', icon: 'home' },
      { id: 'my-complaints', label: 'My Complaints', icon: 'inbox', count: () => CMTS.complaintsFor(u).length },
      { sec: 'Account' },
      { id: 'profile', label: 'My Profile', icon: 'user' },
    ];
  }

  function defaultRoute(u) {
    if (u.is_administrator) return 'operator-dashboard';
    if (u.is_senior_handler) return 'senior-dashboard';
    if (u.is_sub_handler) return 'junior-dashboard';
    return 'dashboard';
  }

  /* ---------- routing & rendering ---------- */
  async function render() {
    const u = APP.user;
    const v = document.getElementById('view');
    let html = '';
    switch (APP.route) {
      case 'dashboard':          html = Views.complainantDashboard(u); break;
      case 'my-complaints':      html = Views.myComplaints(u); break;
      case 'junior-dashboard':   html = Views.juniorDashboard(u); break;
      case 'assigned':           html = Views.juniorDashboard(u); break;
      case 'senior-dashboard':   html = Views.seniorDashboard(u); break;
      case 'all-complaints':     html = Views.allComplaints(u); break;
      case 'analytics':          html = Views.analyticsPage(u); break;
      case 'operator-dashboard': html = Views.operatorDashboard(u); break;
      case 'users':              html = Views.manageUsers(); break;
      case 'departments':        html = Views.manageDepartments(); break;
      case 'audit':              html = Views.auditLog(); break;
      case 'profile':            html = Views.profileView(u); break;
      default:                   html = Views.complainantDashboard(u);
    }
    v.innerHTML = html;
    v.scrollTop = 0;
    window.scrollTo(0, 0);
    updateCrumb();
    highlightNav();
    if (APP.route === 'analytics') {
      Views.initAnalyticsCharts();
    }
    bindFilters();
    bindUserSearch();
    bindProfileEvents();
  }

  function navigate(route) {
    APP.route = route;
    closeSidebar();
    render();
  }

  function updateCrumb() {
    const labels = {
      dashboard: 'Dashboard', 'my-complaints': 'My Complaints',
      'junior-dashboard': 'Dashboard', assigned: 'Assigned to Me',
      'senior-dashboard': 'Dashboard', 'all-complaints': 'All Complaints',
      analytics: 'Analytics & Reports',
      'operator-dashboard': 'Dashboard', users: 'User Management',
      departments: 'Departments & Trackers', audit: 'Audit Log', profile: 'My Profile',
    };
    document.getElementById('crumb').innerHTML = 'CMTS / <b>' + (labels[APP.route] || '') + '</b>';
  }

  function highlightNav() {
    document.querySelectorAll('.s-link').forEach(a => {
      a.classList.toggle('active', a.dataset.route === APP.route);
    });
  }

  function bindFilters() {
    const search = document.getElementById('flt-search');
    if (search) {
      search.addEventListener('input', refilter);
      ['flt-status', 'flt-priority', 'flt-range'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', refilter);
      });
    }
  }

  function refilter() {
    const list = Views.applyFilters(CMTS.state.complaints);
    const opts = APP.user.is_senior_handler ? { showComplainant: true, showAssignee: true }
               : APP.user.is_sub_handler ? { showComplainant: true } : {};
    const container = document.getElementById('complaint-list');
    if (container) container.innerHTML = Views.complaintTable(list, opts);
  }

  function bindUserSearch() {
    const s = document.getElementById('u-search');
    if (s) s.addEventListener('input', refilterUsers);
    const r = document.getElementById('u-role');
    if (r) r.addEventListener('change', refilterUsers);
    const st = document.getElementById('u-status');
    if (st) st.addEventListener('change', refilterUsers);
  }

  function refilterUsers() {
    const q = (document.getElementById('u-search')?.value || '').toLowerCase();
    const role = document.getElementById('u-role')?.value || '';
    const status = document.getElementById('u-status')?.value || '';
    const list = CMTS.state.users.filter(u => {
      if (role && u.role !== role) return false;
      if (status && u.account_status !== status) return false;
      if (q) {
        const hay = (u.full_name + ' ' + u.email).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const el = document.getElementById('users-list');
    if (el) el.innerHTML = Views.usersTable(list);
  }

  function bindProfileEvents() {
    const saveName = document.getElementById('prof-save-name');
    if (saveName) {
      saveName.addEventListener('click', async () => {
        const name = document.getElementById('prof-name')?.value.trim();
        if (!name) { toast('Error', 'Name cannot be empty', 'error'); return; }
        try {
          saveName.disabled = true;
          await CMTS.updateProfile({ full_name: name });
          APP.user.full_name = name;
          buildSidebar();
          toast('Saved', 'Your name has been updated', 'success');
        } catch (err) {
          toast('Error', err.message, 'error');
        } finally {
          saveName.disabled = false;
        }
      });
    }
    const savePass = document.getElementById('prof-save-pass');
    if (savePass) {
      savePass.addEventListener('click', async () => {
        const cur = document.getElementById('prof-cur-pass')?.value;
        const nw = document.getElementById('prof-new-pass')?.value;
        const conf = document.getElementById('prof-confirm-pass')?.value;
        if (!cur || !nw) { toast('Error', 'All password fields are required', 'error'); return; }
        if (nw !== conf) { toast('Error', 'New passwords do not match', 'error'); return; }
        if (nw.length < 6) { toast('Error', 'Password must be at least 6 characters', 'error'); return; }
        try {
          savePass.disabled = true;
          await CMTS.updateProfile({ current_password: cur, new_password: nw });
          document.getElementById('prof-cur-pass').value = '';
          document.getElementById('prof-new-pass').value = '';
          document.getElementById('prof-confirm-pass').value = '';
          toast('Password changed', 'Your password has been updated successfully', 'success');
        } catch (err) {
          toast('Error', err.message, 'error');
        } finally {
          savePass.disabled = false;
        }
      });
    }
  }

  function buildSidebar() {
    const u = APP.user;
    const nav = navFor(u);
    const navEl = document.getElementById('s-nav');
    navEl.innerHTML = nav.map(item => {
      if (item.sec) return '<div class="sec">' + item.sec + '</div>';
      const cnt = item.count ? item.count() : null;
      return '<a class="s-link" data-route="' + item.id + '" href="#">' + icon(item.icon) +
        '<span>' + item.label + '</span>' + (cnt ? '<span class="count">' + cnt + '</span>' : '') + '</a>';
    }).join('');
    document.getElementById('s-user').innerHTML =
      '<div><div class="nm">' + escapeHtml(u.full_name) + '</div><div class="rl">' + escapeHtml(roleLabel(u)) + '</div></div>';
    navEl.querySelectorAll('.s-link').forEach(a => {
      a.addEventListener('click', e => { e.preventDefault(); navigate(a.dataset.route); });
    });
  }

  function roleLabel(u) {
    if (u.is_administrator) return 'Software Operator';
    if (u.is_senior_handler) return 'Senior Complaint Handler';
    if (u.is_sub_handler) return 'Junior Complaint Handler';
    return u.role === 'complainant' ? 'Complainant' : u.role;
  }

  /* ---------- Login & app entry ---------- */
  async function login(email, password) {
    const btn = document.querySelector('#login-form button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Signing in...'; }
    try {
      const user = await CMTS.login(email, password);
      APP.user = user;
      await CMTS.loadAll();
      enterApp();
    } catch (err) {
      toast('Login failed', err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
    }
  }

  function enterApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-shell').classList.add('active');
    APP.route = defaultRoute(APP.user);
    buildSidebar();
    render();
  }

  function logout() {
    CMTS.logout();
    APP.user = null;
    document.getElementById('app-shell').classList.remove('active');
    document.getElementById('login-screen').style.display = 'grid';
    document.getElementById('login-form').reset();
  }

  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-backdrop').classList.remove('show');
  }

  /* ---------- Complaint Detail Modal ---------- */
  async function openComplaint(id) {
    const c = CMTS.state.complaints.find(x => x.complaint_id === id);
    if (!c) return;
    const u = APP.user;
    const deptName = c.department_name || (CMTS.dept(c.department_id) ? CMTS.dept(c.department_id).name : '—');
    const trackerName = c.tracker_name || (CMTS.tracker(c.tracker_id) ? CMTS.tracker(c.tracker_id).name : '—');
    const complainantName = c.complainant_name || (CMTS.user(c.complainant_id) ? CMTS.user(c.complainant_id).full_name : '—');
    const assigneeName = c.handler_name || (c.handler_id && CMTS.user(c.handler_id) ? CMTS.user(c.handler_id).full_name : null);

    let gallery = '<div class="tcell-meta">No attachments.</div>';
    if (c.attachments && c.attachments.length) {
      const apiBase = window.__API_BASE__ ? window.__API_BASE__.replace('/api', '') : 'http://localhost:5000';
      gallery = '<div class="gallery">' + c.attachments.map(a => {
        const src = a.storage_path.startsWith('http') ? a.storage_path : apiBase + a.storage_path;
        return `<img src="${src}" alt="${escapeHtml(a.file_name)}" data-zoom="${src}" style="cursor:zoom-in" />`;
      }).join('') + '</div>';
    }

    let timeline = '<div class="timeline">';
    if (c.history && c.history.length) {
      timeline += c.history.map(h => {
        const byName = h.changed_by_name || (CMTS.user(h.changed_by) ? CMTS.user(h.changed_by).full_name : 'System');
        return `<div class="tl-item done">
          <span class="tl-dot"></span>
          <div class="tl-title">${escapeHtml(h.old_status || '—')} → ${escapeHtml(h.new_status)}</div>
          <div class="tl-meta">${escapeHtml(byName)} · ${fmtDate(h.changed_at)}</div>
          ${h.remarks ? `<div class="tl-remark">${escapeHtml(h.remarks)}</div>` : ''}
        </div>`;
      }).join('');
    } else {
      timeline += '<div class="tcell-meta">No status history.</div>';
    }
    timeline += '</div>';

    let actions = '';
    if (u.is_senior_handler) {
      if (['New', 'Under Review'].includes(c.status)) {
        actions += `<button class="btn btn-primary" data-assign="${c.complaint_id}">${icon('users')} Assign</button>`;
        if (c.status === 'New') actions += `<button class="btn btn-outline" data-status="${c.complaint_id}" data-new-status="Under Review">Mark Under Review</button>`;
      } else if (['Assigned', 'In Progress'].includes(c.status)) {
        actions += `<button class="btn btn-outline" data-assign="${c.complaint_id}">${icon('users')} Reassign</button>`;
      }
      if (!['Closed', 'Rejected'].includes(c.status)) {
        actions += `<button class="btn btn-danger" data-reject="${c.complaint_id}">Reject</button>`;
      }
      if (c.status === 'Assigned') {
        actions += `<button class="btn btn-primary" data-status="${c.complaint_id}" data-new-status="In Progress">Mark In Progress</button>`;
      }
      if (c.status === 'In Progress') {
        actions += `<button class="btn btn-primary" data-status="${c.complaint_id}" data-new-status="Resolved">Mark Resolved</button>`;
      }
    }
    if (u.is_sub_handler && c.handler_id === u.user_id) {
      if (c.status === 'Assigned') actions += `<button class="btn btn-primary" data-status="${c.complaint_id}" data-new-status="In Progress">${icon('activity')} Start Working</button>`;
      if (c.status === 'In Progress') actions += `<button class="btn btn-primary" data-status="${c.complaint_id}" data-new-status="Resolved">${icon('checkCircle')} Mark Resolved</button>`;
    }
    if (c.complainant_id === u.user_id && c.status === 'Resolved' && !c.feedback) {
      actions += `<button class="btn btn-primary" data-feedback="${c.complaint_id}">${icon('star')} Give Feedback</button>`;
    }

    const feedbackHtml = c.feedback ? `
      <div class="section-lbl">Feedback</div>
      <div class="card card-pad" style="background:var(--surface-2)">
        <div style="font-size:20px;margin-bottom:6px">${'★'.repeat(c.feedback.overall_rating)}${'☆'.repeat(5 - c.feedback.overall_rating)}</div>
        ${c.feedback.text_comment ? `<p>${escapeHtml(c.feedback.text_comment)}</p>` : ''}
        <div class="tcell-meta">Submitted ${timeAgo(c.feedback.submitted_at)}</div>
      </div>
    ` : '';

    openModal(`
      <div class="modal-head">
        <div>
          <h3>${escapeHtml(c.subject)}</h3>
          <div class="sub"><span class="cid">#${c.complaint_id}</span> · ${statusBadge(c.status)} · ${prioBadge(c.priority)}</div>
        </div>
        <button class="icon-btn" data-close>${icon('x')}</button>
      </div>
      <div class="modal-body">
        <div class="detail-grid">
          <div>
            <div class="section-lbl">Description</div>
            <p>${escapeHtml(c.description)}</p>
            <div class="section-lbl">Attachments (${c.attachments ? c.attachments.length : 0})</div>
            ${gallery}
            ${feedbackHtml}
          </div>
          <div>
            <div class="section-lbl">Details</div>
            <dl class="kv">
              <dt>Department</dt><dd>${escapeHtml(deptName)}</dd>
              <dt>Tracker</dt><dd>${escapeHtml(trackerName)}</dd>
              <dt>Location</dt><dd>${escapeHtml(c.location || '—')}</dd>
              <dt>Complainant</dt><dd>${escapeHtml(complainantName)}</dd>
              <dt>Assigned to</dt><dd>${assigneeName ? escapeHtml(assigneeName) : '<span class="tcell-meta">Unassigned</span>'}</dd>
              <dt>Submitted</dt><dd>${fmtDate(c.created_at)}</dd>
            </dl>
            <div class="section-lbl">Status History</div>
            ${timeline}
          </div>
        </div>
      </div>
      ${actions ? `<div class="modal-foot">${actions}</div>` : ''}
    `, 'lg');

    document.getElementById('modal-overlay').querySelectorAll('img[data-zoom]').forEach(img => {
      img.addEventListener('click', () => openLightbox(img.dataset.zoom));
    });
  }

  function openLightbox(src) {
    const lb = document.getElementById('lightbox');
    lb.querySelector('img').src = src;
    lb.classList.add('show');
  }

  /* ---------- Status change ---------- */
  async function doStatus(complaintId, newStatus) {
    let remarks = '';
    if (newStatus === 'Rejected') {
      openModal(`
        <div class="modal-head"><div><h3>Reject Complaint #${complaintId}</h3><div class="sub">Please provide a reason</div></div><button class="icon-btn" data-close>${icon('x')}</button></div>
        <div class="modal-body">
          <div class="field"><label>Reason for rejection *</label><textarea id="reject-reason" rows="3" placeholder="Explain why this complaint is being rejected..."></textarea></div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-outline" data-close>Cancel</button>
          <button class="btn btn-danger" id="confirm-reject">Reject Complaint</button>
        </div>
      `);
      document.getElementById('confirm-reject').addEventListener('click', async () => {
        const reason = document.getElementById('reject-reason')?.value.trim();
        if (!reason) { toast('Required', 'Please provide a rejection reason', 'error'); return; }
        await executeStatus(complaintId, 'Rejected', reason);
      });
      return;
    }
    await executeStatus(complaintId, newStatus, remarks);
  }

  async function executeStatus(complaintId, newStatus, remarks) {
    try {
      await CMTS.changeStatus(complaintId, newStatus, remarks);
      closeModal();
      toast('Status updated', `Complaint #${complaintId} is now ${newStatus}`, 'success');
      await CMTS.loadAll();
      render();
      refreshCounts();
    } catch (err) {
      toast('Error', err.message, 'error');
    }
  }

  /* ---------- Assign complaint ---------- */
  async function openAssign(complaintId) {
    const c = CMTS.state.complaints.find(x => x.complaint_id === complaintId);
    const handlers = CMTS.subHandlers();
    const sameDept = handlers.filter(h => h.department_id === c.department_id);
    const other = handlers.filter(h => h.department_id !== c.department_id);
    const ordered = [...sameDept, ...other];
    openModal(`
      <div class="modal-head"><div><h3>Assign Complaint #${complaintId}</h3><div class="sub">Select a Junior Handler</div></div><button class="icon-btn" data-close>${icon('x')}</button></div>
      <div class="modal-body">
        ${!ordered.length ? '<div class="empty">' + icon('users') + '<div>No junior handlers available</div></div>' : ''}
        <div class="choice-grid" id="assign-handlers">
          ${ordered.map(h => {
            const dept = h.department_name || (CMTS.dept(h.department_id) ? CMTS.dept(h.department_id).name : '');
            const isSame = h.department_id === c.department_id;
            return `<button class="choice${isSame ? ' same-dept' : ''}" data-handler="${h.user_id}">
              <div class="t">${escapeHtml(h.full_name)}${isSame ? ' <span class="tag" style="font-size:10px;padding:1px 5px">Same dept</span>' : ''}</div>
              <div class="d">${escapeHtml(dept || 'General')}</div>
            </button>`;
          }).join('')}
        </div>
        <div class="field" style="margin-top:12px"><label>Remarks (optional)</label><input type="text" id="assign-remark" placeholder="e.g., Urgent, please prioritise" /></div>
      </div>
      <div class="modal-foot"><button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="assign-confirm" disabled>Assign</button></div>
    `);
    let selected = null;
    const ov = document.getElementById('modal-overlay');
    ov.querySelectorAll('[data-handler]').forEach(btn => btn.addEventListener('click', () => {
      ov.querySelectorAll('.choice').forEach(c => c.classList.remove('sel'));
      btn.classList.add('sel');
      selected = +btn.dataset.handler;
      document.getElementById('assign-confirm').disabled = false;
    }));
    document.getElementById('assign-confirm').addEventListener('click', async () => {
      if (!selected) return;
      const remark = document.getElementById('assign-remark').value;
      const btn = document.getElementById('assign-confirm');
      btn.disabled = true;
      try {
        await CMTS.assignComplaint(complaintId, selected, remark);
        closeModal();
        toast('Assigned', `Complaint #${complaintId} assigned successfully`, 'success');
        await CMTS.loadAll();
        render();
        refreshCounts();
      } catch (err) {
        toast('Error', err.message, 'error');
        btn.disabled = false;
      }
    });
  }

  /* ---------- Feedback modal ---------- */
  async function openFeedback(complaintId) {
    openModal(`
      <div class="modal-head"><div><h3>Rate Resolution</h3><div class="sub">Complaint #${complaintId}</div></div><button class="icon-btn" data-close>${icon('x')}</button></div>
      <div class="modal-body">
        <div class="field"><label>Overall satisfaction *</label><div class="stars" data-key="overall"></div><div class="err" id="fb-err" style="display:none">Please provide an overall rating</div></div>
        <div class="grid-cols-2">
          <div class="field"><label>Response time</label><div class="stars" data-key="responseTime"></div></div>
          <div class="field"><label>Communication</label><div class="stars" data-key="communication"></div></div>
        </div>
        <div class="field"><label>Resolution quality</label><div class="stars" data-key="resolution"></div></div>
        <div class="field"><label>Comments (optional)</label><textarea id="fb-comment" rows="3" maxlength="500" placeholder="Share any additional feedback..."></textarea></div>
        <div style="padding:10px 0;color:var(--muted);font-size:13px">Note: Rating > 3 stars will close the complaint. Rating ≤ 3 will reopen it for review.</div>
      </div>
      <div class="modal-foot"><button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="fb-submit">Submit Feedback</button></div>
    `);
    const ratings = { overall: 0, responseTime: 0, communication: 0, resolution: 0 };
    document.querySelectorAll('#modal-overlay .stars').forEach(row => {
      const key = row.dataset.key;
      for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.dataset.v = i;
        star.innerHTML = icon('star');
        star.onclick = () => {
          ratings[key] = i;
          row.querySelectorAll('.star').forEach(s => s.classList.toggle('on', +s.dataset.v <= i));
        };
        row.appendChild(star);
      }
    });
    document.getElementById('fb-submit').addEventListener('click', async () => {
      if (!ratings.overall) { document.getElementById('fb-err').style.display = 'block'; return; }
      const btn = document.getElementById('fb-submit');
      btn.disabled = true;
      try {
        const res = await CMTS.submitFeedback(complaintId, {
          overall: ratings.overall, responseTime: ratings.responseTime,
          communication: ratings.communication, resolution: ratings.resolution,
          comment: document.getElementById('fb-comment').value,
        });
        closeModal();
        const willClose = ratings.overall > 3;
        toast('Feedback submitted', willClose ? 'Complaint closed. Thank you!' : 'Complaint reopened for further review.', 'success');
        await CMTS.loadAll();
        render();
        refreshCounts();
      } catch (err) {
        toast('Error', err.message, 'error');
        btn.disabled = false;
      }
    });
  }

  /* ---------- New Complaint Wizard ---------- */
  async function openNewComplaint() {
    const depts = CMTS.state.departments.filter(d => d.is_active);
    let step = 1, selectedDept = null, selectedTracker = null;
    let subject = '', description = '', priority = 'Medium', location = '';
    let attachments = [];

    const renderWizard = () => {
      const stepIcons = ['Category', 'Details', 'Attachments'];
      const steps = stepIcons.map((lbl, i) => {
        const num = i + 1;
        const cls = num < step ? 'done' : num === step ? 'active' : '';
        return `<div class="step ${cls}"><div class="num">${num < step ? '✓' : num}</div><div class="lbl">${lbl}</div></div>`;
      }).join('');
      const stepsHtml = `<div class="steps">${steps}</div>`;

      let body = stepsHtml;
      if (step === 1) {
        body += `<div class="field"><label>Department *</label><div class="choice-grid">
          ${depts.map(d => `<button type="button" class="choice ${selectedDept === d.department_id ? 'sel' : ''}" data-dept="${d.department_id}"><div class="t">${escapeHtml(d.name)}</div><div class="d">${escapeHtml(d.description || '')}</div></button>`).join('')}
        </div></div>`;
        if (selectedDept) {
          const trackers = CMTS.trackersForDept(selectedDept).filter(t => t.is_active);
          body += `<div class="field"><label>Tracker / Issue Type *</label><div class="choice-grid">
            ${trackers.map(t => `<button type="button" class="choice ${selectedTracker === t.tracker_id ? 'sel' : ''}" data-tracker="${t.tracker_id}"><div class="t">${escapeHtml(t.name)}</div><div class="d">${escapeHtml(t.description || '')}</div></button>`).join('')}
          </div></div>`;
        }
      } else if (step === 2) {
        body += `
          <div class="field"><label>Subject *</label><input id="w-subject" value="${escapeHtml(subject)}" maxlength="200" placeholder="Brief summary of the issue" /></div>
          <div class="field"><label>Description *</label><textarea id="w-desc" rows="4" maxlength="2000" placeholder="Describe the issue in detail...">${escapeHtml(description)}</textarea></div>
          <div class="grid-cols-2">
            <div class="field"><label>Priority</label><select id="w-priority">${CMTS.PRIORITIES.map(p => `<option ${priority === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
            <div class="field"><label>Location</label><input id="w-location" value="${escapeHtml(location)}" placeholder="e.g., Block A, Room 101" /></div>
          </div>`;
      } else {
        const tName = selectedTracker ? (CMTS.tracker(selectedTracker)?.name || '') : '';
        const dName = selectedDept ? (CMTS.dept(selectedDept)?.name || '') : '';
        body += `
          <div class="field">
            <label>Attachments (up to 5 images, max 2MB each — JPG/PNG only)</label>
            <div class="dropzone" id="dropzone">${icon('upload')}<div>Click or drag &amp; drop images here</div></div>
            <input type="file" id="file-input" accept="image/jpeg,image/png" multiple hidden />
            <div class="preview-list" id="preview-list">${attachments.map((a, i) => `<div class="preview-item"><img src="${a.url}"><button class="rm" data-rm="${i}">&times;</button><div class="preview-name">${escapeHtml(a.name)}</div></div>`).join('')}</div>
          </div>
          <div class="card card-pad" style="background:var(--surface-2)">
            <div class="tcell-meta">Review your complaint</div>
            <div style="margin-top:8px"><strong>${escapeHtml(subject)}</strong></div>
            <div class="tcell-meta" style="margin-top:4px">${escapeHtml(dName)} → ${escapeHtml(tName)} · ${escapeHtml(priority)}</div>
            ${location ? `<div class="tcell-meta">📍 ${escapeHtml(location)}</div>` : ''}
          </div>`;
      }

      const footer = `<div class="modal-foot">
        ${step > 1 ? '<button class="btn btn-outline" id="w-back">← Back</button>' : '<button class="btn btn-outline" data-close>Cancel</button>'}
        ${step < 3 ? '<button class="btn btn-primary" id="w-next">Next →</button>' : '<button class="btn btn-primary" id="w-submit">' + icon('check') + ' Submit Complaint</button>'}
      </div>`;

      openModal(`<div class="modal-head"><h3>New Complaint</h3><button class="icon-btn" data-close>${icon('x')}</button></div><div class="modal-body" id="w-body">${body}</div>${footer}`, 'lg');
      attachWizardEvents();
    };

    const attachWizardEvents = () => {
      const ov = document.getElementById('modal-overlay');
      if (step === 1) {
        ov.querySelectorAll('[data-dept]').forEach(btn => btn.addEventListener('click', () => {
          selectedDept = +btn.dataset.dept; selectedTracker = null; renderWizard();
        }));
        ov.querySelectorAll('[data-tracker]').forEach(btn => btn.addEventListener('click', () => {
          selectedTracker = +btn.dataset.tracker;
          ov.querySelectorAll('[data-tracker]').forEach(b => b.classList.toggle('sel', +b.dataset.tracker === selectedTracker));
        }));
        const next = ov.querySelector('#w-next');
        if (next) next.addEventListener('click', () => {
          if (!selectedDept || !selectedTracker) { toast('Required', 'Please select a department and tracker', 'error'); return; }
          step = 2; renderWizard();
        });
      } else if (step === 2) {
        const next = ov.querySelector('#w-next');
        if (next) next.addEventListener('click', () => {
          subject = ov.querySelector('#w-subject')?.value.trim();
          description = ov.querySelector('#w-desc')?.value.trim();
          priority = ov.querySelector('#w-priority')?.value;
          location = ov.querySelector('#w-location')?.value.trim();
          if (!subject) { toast('Required', 'Subject is required', 'error'); return; }
          if (!description) { toast('Required', 'Description is required', 'error'); return; }
          step = 3; renderWizard();
        });
        const back = ov.querySelector('#w-back');
        if (back) back.addEventListener('click', () => { step = 1; renderWizard(); });
      } else {
        const back = ov.querySelector('#w-back');
        if (back) back.addEventListener('click', () => { step = 2; renderWizard(); });

        const dz = ov.querySelector('#dropzone');
        const fileInput = ov.querySelector('#file-input');
        const preview = ov.querySelector('#preview-list');

        const renderPreviews = () => {
          if (!preview) return;
          preview.innerHTML = attachments.map((a, i) =>
            `<div class="preview-item"><img src="${a.url}"><button class="rm" data-rm="${i}">&times;</button><div class="preview-name">${escapeHtml(a.name)}</div></div>`
          ).join('');
          preview.querySelectorAll('.rm').forEach(btn => btn.addEventListener('click', () => {
            const idx = +btn.dataset.rm;
            URL.revokeObjectURL(attachments[idx].url);
            attachments.splice(idx, 1);
            renderPreviews();
          }));
        };

        if (dz && fileInput) {
          dz.addEventListener('click', () => fileInput.click());
          dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
          dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
          dz.addEventListener('drop', e => {
            e.preventDefault(); dz.classList.remove('drag-over');
            processFiles(Array.from(e.dataTransfer.files));
          });
          fileInput.addEventListener('change', () => processFiles(Array.from(fileInput.files)));
        }

        const processFiles = (files) => {
          files.forEach(f => {
            if (attachments.length >= 5) { toast('Limit reached', 'Maximum 5 images per complaint', 'warning'); return; }
            if (!['image/jpeg', 'image/png'].includes(f.type)) { toast('Invalid type', `${f.name}: only JPG and PNG allowed`, 'error'); return; }
            if (f.size > 2 * 1024 * 1024) { toast('Too large', `${f.name}: max 2MB per image`, 'error'); return; }
            attachments.push({ file: f, name: f.name, url: URL.createObjectURL(f) });
          });
          renderPreviews();
        };

        const submitBtn = ov.querySelector('#w-submit');
        if (submitBtn) submitBtn.addEventListener('click', async () => {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Submitting...';
          const fd = new FormData();
          fd.append('tracker_id', selectedTracker);
          fd.append('subject', subject);
          fd.append('description', description);
          fd.append('priority', priority);
          if (location) fd.append('location', location);
          attachments.forEach(a => fd.append('attachments', a.file));
          try {
            const resp = await CMTS.createComplaint(fd);
            attachments.forEach(a => URL.revokeObjectURL(a.url));
            closeModal();
            toast('Submitted!', `Complaint #${resp.complaint_id} submitted successfully`, 'success');
            await CMTS.loadAll();
            navigate('my-complaints');
            refreshCounts();
          } catch (err) {
            toast('Submission failed', err.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = icon('check') + ' Submit Complaint';
          }
        });
      }
    };
    renderWizard();
  }

  /* ---------- Add/Edit User Modal ---------- */
  async function openAddUser() {
    const depts = CMTS.state.departments.filter(d => d.is_active);
    openModal(`
      <div class="modal-head"><div><h3>Add New User</h3><div class="sub">Create a user account</div></div><button class="icon-btn" data-close>${icon('x')}</button></div>
      <div class="modal-body">
        <div class="grid-cols-2">
          <div class="field"><label>Full Name *</label><input id="nu-name" placeholder="Full name" /></div>
          <div class="field"><label>Email *</label><input id="nu-email" type="email" placeholder="user@namal.edu" /></div>
        </div>
        <div class="grid-cols-2">
          <div class="field"><label>Password *</label><input id="nu-pass" type="password" placeholder="Min 6 characters" /></div>
          <div class="field"><label>Role *</label>
            <select id="nu-role">
              <option value="complainant">Complainant</option>
              <option value="junior_handler">Junior Handler</option>
              <option value="senior_handler">Senior Handler</option>
              <option value="software_operator">Software Operator</option>
            </select>
          </div>
        </div>
        <div class="field"><label>Department</label>
          <select id="nu-dept"><option value="">— None —</option>${depts.map(d => `<option value="${d.department_id}">${escapeHtml(d.name)}</option>`).join('')}</select>
        </div>
        <div class="field"><label>User Type (for complainants)</label>
          <div style="display:flex;gap:16px;margin-top:6px">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="radio" name="nu-type" value="student" checked /> Student</label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="radio" name="nu-type" value="faculty" /> Faculty</label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="radio" name="nu-type" value="staff" /> Staff</label>
          </div>
        </div>
        <div id="nu-subfields"></div>
      </div>
      <div class="modal-foot"><button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="nu-save">${icon('plus')} Create User</button></div>
    `);

    const ov = document.getElementById('modal-overlay');
    const renderSubFields = () => {
      const type = ov.querySelector('[name="nu-type"]:checked')?.value;
      const sf = ov.querySelector('#nu-subfields');
      if (!sf) return;
      if (type === 'student') {
        sf.innerHTML = `<div class="grid-cols-2"><div class="field"><label>Reg. Number *</label><input id="nu-reg" placeholder="2024-001" /></div><div class="field"><label>Program *</label><input id="nu-prog" placeholder="BS Computer Science" /></div></div><div class="grid-cols-2"><div class="field"><label>Semester</label><input id="nu-sem" type="number" min="1" max="8" placeholder="1–8" /></div></div>`;
      } else if (type === 'faculty') {
        sf.innerHTML = `<div class="grid-cols-2"><div class="field"><label>Designation *</label><input id="nu-desig" placeholder="Assistant Professor" /></div><div class="field"><label>Office Number</label><input id="nu-office" placeholder="Block A-201" /></div></div>`;
      } else if (type === 'staff') {
        sf.innerHTML = `<div class="grid-cols-2"><div class="field"><label>Position *</label><input id="nu-pos" placeholder="Technical Staff" /></div><div class="field"><label>Staff Type</label><select id="nu-staff-type"><option value="Technical">Technical</option><option value="Administrative">Administrative</option></select></div></div>`;
      } else {
        sf.innerHTML = '';
      }
    };

    ov.querySelectorAll('[name="nu-type"]').forEach(r => r.addEventListener('change', renderSubFields));
    renderSubFields();

    ov.querySelector('#nu-save').addEventListener('click', async () => {
      const name = ov.querySelector('#nu-name')?.value.trim();
      const email = ov.querySelector('#nu-email')?.value.trim();
      const pass = ov.querySelector('#nu-pass')?.value;
      const role = ov.querySelector('#nu-role')?.value;
      const dept = ov.querySelector('#nu-dept')?.value;
      const type = ov.querySelector('[name="nu-type"]:checked')?.value;
      if (!name || !email || !pass || !role) { toast('Required', 'Name, email, password and role are required', 'error'); return; }

      const data = {
        full_name: name, email, password: pass, role,
        department_id: dept || null,
        is_student: type === 'student',
        is_faculty: type === 'faculty',
        is_staff: type === 'staff',
      };
      if (type === 'student') {
        data.reg_number = ov.querySelector('#nu-reg')?.value.trim();
        data.program = ov.querySelector('#nu-prog')?.value.trim();
        data.semester = ov.querySelector('#nu-sem')?.value || null;
      } else if (type === 'faculty') {
        data.designation = ov.querySelector('#nu-desig')?.value.trim();
        data.office_number = ov.querySelector('#nu-office')?.value.trim();
      } else if (type === 'staff') {
        data.position = ov.querySelector('#nu-pos')?.value.trim();
        data.staff_type = ov.querySelector('#nu-staff-type')?.value;
      }

      const btn = ov.querySelector('#nu-save');
      btn.disabled = true;
      try {
        await CMTS.createUser(data);
        closeModal();
        toast('User created', `${name} has been added to the system`, 'success');
        await CMTS.loadAll();
        render();
      } catch (err) {
        toast('Error', err.message, 'error');
        btn.disabled = false;
      }
    });
  }

  async function openEditUser(userId) {
    const u = CMTS.state.users.find(x => x.user_id === userId);
    if (!u) return;
    const depts = CMTS.state.departments;
    openModal(`
      <div class="modal-head"><div><h3>Edit User</h3><div class="sub">${escapeHtml(u.full_name)}</div></div><button class="icon-btn" data-close>${icon('x')}</button></div>
      <div class="modal-body">
        <div class="grid-cols-2">
          <div class="field"><label>Full Name</label><input id="eu-name" value="${escapeHtml(u.full_name)}" /></div>
          <div class="field"><label>Email</label><input id="eu-email" type="email" value="${escapeHtml(u.email)}" /></div>
        </div>
        <div class="grid-cols-2">
          <div class="field"><label>Role</label>
            <select id="eu-role">
              <option value="complainant" ${u.role === 'complainant' ? 'selected' : ''}>Complainant</option>
              <option value="junior_handler" ${u.role === 'junior_handler' ? 'selected' : ''}>Junior Handler</option>
              <option value="senior_handler" ${u.role === 'senior_handler' ? 'selected' : ''}>Senior Handler</option>
              <option value="software_operator" ${u.role === 'software_operator' ? 'selected' : ''}>Software Operator</option>
            </select>
          </div>
          <div class="field"><label>Department</label>
            <select id="eu-dept">
              <option value="">— None —</option>
              ${depts.map(d => `<option value="${d.department_id}" ${d.department_id === u.department_id ? 'selected' : ''}>${escapeHtml(d.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="field"><label>Account Status</label>
          <select id="eu-status">
            <option ${u.account_status === 'Active' ? 'selected' : ''}>Active</option>
            <option ${u.account_status === 'Locked' ? 'selected' : ''}>Locked</option>
            <option ${u.account_status === 'Inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
        <div class="field"><label>Reset Password (leave blank to keep current)</label><input id="eu-pass" type="password" placeholder="New password (min 6 chars)" /></div>
      </div>
      <div class="modal-foot"><button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="eu-save">${icon('check')} Save Changes</button></div>
    `);
    const ov = document.getElementById('modal-overlay');
    ov.querySelector('#eu-save').addEventListener('click', async () => {
      const name = ov.querySelector('#eu-name')?.value.trim();
      const email = ov.querySelector('#eu-email')?.value.trim();
      const role = ov.querySelector('#eu-role')?.value;
      const dept = ov.querySelector('#eu-dept')?.value;
      const status = ov.querySelector('#eu-status')?.value;
      const pass = ov.querySelector('#eu-pass')?.value;
      const btn = ov.querySelector('#eu-save');
      btn.disabled = true;
      try {
        await CMTS.updateUser(userId, { full_name: name, email, role, department_id: dept || null });
        if (status !== u.account_status) await CMTS.setUserStatus(userId, status);
        if (pass) await CMTS.resetUserPassword(userId, pass);
        closeModal();
        toast('Updated', `${name}'s account has been updated`, 'success');
        await CMTS.loadAll();
        render();
      } catch (err) {
        toast('Error', err.message, 'error');
        btn.disabled = false;
      }
    });
  }

  /* ---------- Department Modal ---------- */
  async function openDeptModal(deptId) {
    const dept = deptId ? CMTS.state.departments.find(d => d.department_id === deptId) : null;
    openModal(`
      <div class="modal-head"><div><h3>${dept ? 'Edit Department' : 'New Department'}</h3></div><button class="icon-btn" data-close>${icon('x')}</button></div>
      <div class="modal-body">
        <div class="field"><label>Department Name *</label><input id="dept-name" value="${escapeHtml(dept ? dept.name : '')}" placeholder="e.g., Computer Science" /></div>
        <div class="field"><label>Description</label><textarea id="dept-desc" rows="3" placeholder="Brief description...">${escapeHtml(dept ? dept.description || '' : '')}</textarea></div>
        <div class="field"><label>Status</label>
          <select id="dept-active">
            <option value="1" ${!dept || dept.is_active ? 'selected' : ''}>Active</option>
            <option value="0" ${dept && !dept.is_active ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
      </div>
      <div class="modal-foot"><button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="dept-save">${icon('check')} ${dept ? 'Save Changes' : 'Create Department'}</button></div>
    `);
    const ov = document.getElementById('modal-overlay');
    ov.querySelector('#dept-save').addEventListener('click', async () => {
      const name = ov.querySelector('#dept-name')?.value.trim();
      const desc = ov.querySelector('#dept-desc')?.value.trim();
      const active = ov.querySelector('#dept-active')?.value === '1';
      if (!name) { toast('Required', 'Department name is required', 'error'); return; }
      const btn = ov.querySelector('#dept-save');
      btn.disabled = true;
      try {
        if (dept) {
          await CMTS.updateDepartment(deptId, { name, description: desc, is_active: active });
          toast('Updated', 'Department updated successfully', 'success');
        } else {
          await CMTS.createDepartment({ name, description: desc, is_active: active });
          toast('Created', 'Department created successfully', 'success');
        }
        closeModal();
        await CMTS.loadAll();
        render();
      } catch (err) {
        toast('Error', err.message, 'error');
        btn.disabled = false;
      }
    });
  }

  /* ---------- Tracker Modal ---------- */
  async function openTrackerModal(trackerId) {
    const tracker = trackerId ? CMTS.state.trackers.find(t => t.tracker_id === trackerId) : null;
    const depts = CMTS.state.departments.filter(d => d.is_active);
    openModal(`
      <div class="modal-head"><div><h3>${tracker ? 'Edit Tracker' : 'New Tracker'}</h3></div><button class="icon-btn" data-close>${icon('x')}</button></div>
      <div class="modal-body">
        <div class="field"><label>Department *</label>
          <select id="tr-dept">
            <option value="">— Select department —</option>
            ${depts.map(d => `<option value="${d.department_id}" ${tracker && d.department_id === tracker.department_id ? 'selected' : ''}>${escapeHtml(d.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Tracker Name *</label><input id="tr-name" value="${escapeHtml(tracker ? tracker.name : '')}" placeholder="e.g., Network Issues" /></div>
        <div class="field"><label>Description</label><textarea id="tr-desc" rows="2">${escapeHtml(tracker ? tracker.description || '' : '')}</textarea></div>
        <div class="field"><label>Status</label>
          <select id="tr-active">
            <option value="1" ${!tracker || tracker.is_active ? 'selected' : ''}>Active</option>
            <option value="0" ${tracker && !tracker.is_active ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
      </div>
      <div class="modal-foot"><button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="tr-save">${icon('check')} ${tracker ? 'Save Changes' : 'Create Tracker'}</button></div>
    `);
    const ov = document.getElementById('modal-overlay');
    ov.querySelector('#tr-save').addEventListener('click', async () => {
      const deptId = ov.querySelector('#tr-dept')?.value;
      const name = ov.querySelector('#tr-name')?.value.trim();
      const desc = ov.querySelector('#tr-desc')?.value.trim();
      const active = ov.querySelector('#tr-active')?.value === '1';
      if (!deptId || !name) { toast('Required', 'Department and tracker name are required', 'error'); return; }
      const btn = ov.querySelector('#tr-save');
      btn.disabled = true;
      try {
        if (tracker) {
          await CMTS.updateTracker(trackerId, { department_id: deptId, name, description: desc, is_active: active });
          toast('Updated', 'Tracker updated successfully', 'success');
        } else {
          await CMTS.createTracker({ department_id: deptId, name, description: desc, is_active: active });
          toast('Created', 'Tracker created successfully', 'success');
        }
        closeModal();
        await CMTS.loadAll();
        render();
      } catch (err) {
        toast('Error', err.message, 'error');
        btn.disabled = false;
      }
    });
  }

  /* ---------- Reports export ---------- */
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  async function exportReport(format) {
    try {
      const from = document.getElementById('rpt-from')?.value || '';
      const to = document.getElementById('rpt-to')?.value || '';
      const status = document.getElementById('rpt-status')?.value || '';
      const departmentId = document.getElementById('rpt-dept')?.value || '';
      toast('Export', 'Preparing report…', 'info');
      const res = await CMTS.getReport({ format, from, to, status, departmentId });
      if (!res || !res.blob) { toast('Error', 'Report generation failed', 'error'); return; }
      if (format === 'excel') {
        downloadBlob(new Blob([await res.blob.arrayBuffer()], { type: 'application/vnd.ms-excel' }), 'cmts-report.xls');
      } else {
        downloadBlob(res.blob, 'cmts-report.csv');
      }
      toast('Export ready', 'Download started', 'success');
    } catch (err) {
      toast('Export error', err.message, 'error');
    }
  }

  /* ---------- Global event delegation ---------- */
  function initGlobalEvents() {
    document.body.addEventListener('click', async e => {
      if (e.target.closest('[data-close]')) { closeModal(); return; }

      const rptBtn = e.target.closest('[data-report]');
      if (rptBtn) { await exportReport(rptBtn.dataset.report); return; }

      const navLink = e.target.closest('[data-nav]');
      if (navLink) { navigate(navLink.dataset.nav); return; }

      if (e.target.closest('[data-action="new-complaint"]')) { openNewComplaint(); return; }
      if (e.target.closest('[data-action="new-user"]')) { openAddUser(); return; }
      if (e.target.closest('[data-action="new-dept"]')) { openDeptModal(null); return; }
      if (e.target.closest('[data-action="new-tracker"]')) { openTrackerModal(null); return; }

      const editDept = e.target.closest('[data-edit-dept]');
      if (editDept) { openDeptModal(+editDept.dataset.editDept); return; }

      const editTracker = e.target.closest('[data-edit-tracker]');
      if (editTracker) { openTrackerModal(+editTracker.dataset.editTracker); return; }

      const editUser = e.target.closest('[data-edit-user]');
      if (editUser) { openEditUser(+editUser.dataset.editUser); return; }

      const lockUser = e.target.closest('[data-lock-user]');
      if (lockUser) {
        const targetStatus = lockUser.dataset.to;
        const userId = +lockUser.dataset.lockUser;
        try {
          await CMTS.setUserStatus(userId, targetStatus);
          toast('Updated', `Account status set to ${targetStatus}`, 'success');
          await CMTS.loadAll();
          render();
        } catch (err) {
          toast('Error', err.message, 'error');
        }
        return;
      }

      const row = e.target.closest('[data-cid]');
      if (row && !e.target.closest('button')) { openComplaint(+row.dataset.cid); return; }

      const assignBtn = e.target.closest('[data-assign]');
      if (assignBtn) { openAssign(+assignBtn.dataset.assign); return; }

      const rejectBtn = e.target.closest('[data-reject]');
      if (rejectBtn) { doStatus(+rejectBtn.dataset.reject, 'Rejected'); return; }

      const fbBtn = e.target.closest('[data-feedback]');
      if (fbBtn) { openFeedback(+fbBtn.dataset.feedback); return; }

      const statusBtn = e.target.closest('[data-status]');
      if (statusBtn && statusBtn.dataset.newStatus) {
        doStatus(+statusBtn.dataset.status, statusBtn.dataset.newStatus);
        return;
      }
    });

    document.getElementById('modal-overlay').addEventListener('click', e => {
      if (e.target.id === 'modal-overlay') closeModal();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeModal();
        document.getElementById('lightbox').classList.remove('show');
      }
    });

    document.getElementById('menu-btn').addEventListener('click', () => {
      if (window.innerWidth > 768) {
        document.body.classList.toggle('sidebar-collapsed');
      } else {
        document.getElementById('sidebar').classList.toggle('open');
        document.getElementById('sidebar-backdrop').classList.toggle('show');
      }
    });
    document.getElementById('sidebar-backdrop').addEventListener('click', closeSidebar);
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('bell-btn').addEventListener('click', () => toast('Notifications', 'You are all caught up!', 'success'));

    const lb = document.getElementById('lightbox');
    lb.querySelector('.close').addEventListener('click', () => lb.classList.remove('show'));
    lb.addEventListener('click', e => { if (e.target === lb) lb.classList.remove('show'); });

    // theme.js manages the theme toggle icon
  }

  /* ---------- Login screen ---------- */
  function initLoginScreen() {
    // Hero content is static HTML — just hydrate demo chips and form
    const demoAccounts = [
      { email: 'ahmed.raza@students.namal.edu', role: 'Student' },
      { email: 'hina.akram@namal.edu', role: 'Faculty' },
      { email: 'adeel.riaz@namal.edu', role: 'Junior Handler' },
      { email: 'senior.handler@namal.edu', role: 'Senior Handler' },
      { email: 'admin@namal.edu', role: 'Software Operator' },
    ];
    const demoGrid = document.getElementById('demo-grid');
    if (demoGrid) {
      demoGrid.innerHTML = demoAccounts.map(a =>
        `<button type="button" class="demo-chip" data-demo="${a.email}"><div class="r">${a.role}</div><div class="e">${a.email}</div></button>`
      ).join('');
      demoGrid.querySelectorAll('[data-demo]').forEach(b => b.addEventListener('click', () => {
        document.getElementById('login-email').value = b.dataset.demo;
        document.getElementById('login-pass').value = 'demo1234';
      }));
    }

    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-pass').value;
      let ok = true;
      const fe = document.getElementById('f-email'), fp = document.getElementById('f-pass');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { fe.classList.add('invalid'); ok = false; } else fe.classList.remove('invalid');
      if (!password) { fp.classList.add('invalid'); ok = false; } else fp.classList.remove('invalid');
      if (!ok) return;
      await login(email, password);
    });
  }

  function openModal(html, size) {
    const ov = document.getElementById('modal-overlay');
    ov.innerHTML = `<div class="modal ${size || ''}" role="dialog" aria-modal="true">${html}</div>`;
    ov.classList.add('show');
  }
  function closeModal() {
    const ov = document.getElementById('modal-overlay');
    ov.classList.remove('show');
    ov.innerHTML = '';
  }
  function refreshCounts() { buildSidebar(); highlightNav(); }

  document.addEventListener('DOMContentLoaded', () => {
    initLoginScreen();
    initGlobalEvents();
  });

})();
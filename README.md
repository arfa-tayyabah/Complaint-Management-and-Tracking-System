<div align="center">

# 📋 CMTS — Complaint Management & Tracking System

### A full-stack platform that digitizes how campus complaints get filed, tracked, and resolved.

<img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
<img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
<img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
<img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />

</div>

---

## 📖 Overview

Built for Namal University, CMTS replaces the manual, paper-trail process of filing and resolving campus complaints with a transparent, role-based web platform. Students, faculty, and staff submit complaints — with photo evidence if needed — and follow them from submission to resolution in real time. Senior handlers triage and assign work, junior handlers resolve it, and everyone stays accountable through a full status history and a closing feedback loop.

---

## ✨ Key Features

| Feature | Description |
|:---|:---|
| 🔐 **Role-based dashboards** | Tailored views for Complainant, Junior Handler, Senior Handler, and Software Operator |
| 📝 **Complaint submission** | Department & tracker selection, priority levels, description, up to 5 images (2MB max each) |
| 🕓 **Tracking & history** | Full status timeline with comments and attachments on every complaint |
| 🔀 **Assignment workflow** | Senior handlers route complaints to the right junior handler |
| ⭐ **Feedback & rating** | 1–5 star ratings on resolution — high ratings close the complaint, low ratings reopen it |
| 📊 **Analytics reports** | Export complaint data as CSV or Excel (Senior Handler only) |
| 🔎 **Filtering & sorting** | By status, priority, date range, department, or assigned handler |
| 🌗 **Dark / light mode** | Theme toggle that persists across sessions |
| 📡 **Offline detection** | Graceful handling of network failures |

---

## 🏗️ Project Structure

```
cmts/
├── frontend/
│   ├── css/
│   ├── js/
│   ├── img/
│   └── index.html
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env
├── database/
│   ├── dbDDL.sql
│   └── dbDML.sql
└── README.md
```

---

## 🧰 Tech Stack

<p align="left">
  <img src="https://img.shields.io/badge/Node.js%20v18%2B-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js v18+" />
  <img src="https://img.shields.io/badge/MySQL%20v8%2B-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL v8+" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/bcryptjs-338033?style=for-the-badge&logoColor=white" alt="bcryptjs" />
</p>

**Backend packages:** `express` · `mysql2` · `jsonwebtoken` · `bcryptjs` · `cors` · `dotenv` · `multer` · `json2csv` · `xlsx`

**System requirements:**
- **Server:** 2+ CPU cores, 4+ GB RAM, 20 GB free disk space
- **Client:** Any modern browser (Chrome, Firefox, Edge, Safari)
- **OS:** Windows 10/11, macOS, or Linux (Ubuntu 20.04+)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/arfa-tayyabah/Complaint-Management-and-Tracking-System.git
cd Complaint-Management-and-Tracking-System
```

### 2. Set up the database

Start your MySQL server, then create and populate the schema:

```bash
mysql -u root -p < database/dbDDL.sql
mysql -u root -p < database/dbDML.sql
```

Set all demo users to the same password (`demo1234`):

```sql
UPDATE User SET password_hash = '$2a$10$JFbQrbCzqX.pHAXLbwhNmO5oMWAtcOIB1g.K1spu1JlbQFFNkPrVW';
```

Or generate a fresh hash yourself:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('demo1234', 10).then(h => console.log(h));"
```

### 3. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=complaint_db
JWT_SECRET=your_super_secret_key_change_me
```

### 4. Start the backend

```bash
node server.js
```
You should see: `CMTS Backend running on port 5000`

### 5. Serve the frontend

In a second terminal:

```bash
cd ../frontend
npx serve . -p 3000
```
Or use VS Code's **Live Server**: right-click `index.html` → *Open with Live Server*.

### 6. Log in

Open `http://localhost:3000` and sign in with any demo account (password: `demo1234` for all):

| Role | Email |
|:---|:---|
| Student | `ahmed.raza@students.namal.edu` |
| Junior Handler | `adeel.riaz@namal.edu` |
| Senior Handler | `senior.handler@namal.edu` |
| Software Operator | `admin@namal.edu` |

---

## 🧑‍💻 Usage by Role

**Complainants** (students, faculty, staff)
- Submit a complaint: *New Complaint* → select department & tracker → fill details → attach images → submit
- Track it: *My Complaints* → open any complaint for its full timeline
- Close the loop: once *Resolved*, leave a 1–5 star rating — high ratings close it, low ratings reopen it

**Senior Handlers**
- Monitor everything from a metrics dashboard (needs assignment, active, resolved, critical)
- Filter and sort the full complaint list by status, priority, date, department, or handler
- Assign new/under-review complaints to a junior handler
- Export CSV or Excel reports straight from the dashboard

**Junior Handlers**
- Work exclusively from their assigned queue, moving complaints from *In Progress* to *Resolved*

**Software Operators**
- Manage user accounts (add, edit, lock/unlock)
- Maintain departments and trackers
- Review a full audit log of system actions

---

## 📄 License

See [LICENSE](./LICENSE) for details.

<div align="center">

**Built by [Arfa Tayyabah](https://github.com/arfa-tayyabah)**

</div>

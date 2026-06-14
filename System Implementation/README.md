CMTS – Complaint Management & Tracking System
==============================================

A full‑stack web application for Namal University that digitizes the submission, tracking, and resolution of campus complaints.
Students, faculty, and staff can file complaints with photo evidence, follow real‑time status updates, and provide feedback.
Senior handlers assign complaints to junior handlers, generate analytics reports, and maintain transparency throughout the process.

Features
--------
- Role‑based dashboards – Complainant, Junior Handler, Senior Handler, Software Operator.
- Complaint submission – Department & tracker selection, priority, description, up to 5 images (max 2MB each).
- Tracking & history – Full status timeline, comments, attachments.
- Assignment workflow – Senior handlers assign complaints to junior handlers.
- Feedback & rating – 1‑5 star rating; ratings ≥3 close the complaint, lower ratings reopen it.
- Analytics reports – Export complaint data as CSV or Excel (Senior Handler only).
- Filtering & sorting – By status, priority, date range, department, assigned handler (Senior Handler only).
- Dark / light mode – Toggle theme, persists across sessions.
- Offline detection – Graceful network failure handling.

System Requirements
-------------------
Hardware:
  - Server: 2+ CPU cores, 4+ GB RAM, 20 GB free disk space.
  - Client: Modern smartphone or desktop with a browser (Chrome, Firefox, Edge, Safari).

Software:
  - Operating System: Windows 10/11, macOS, or Linux (Ubuntu 20.04+).
  - Node.js: v18 or higher (includes npm).
  - MySQL: v8.0 or higher (MariaDB 10.5+ also works).
  - Git: (optional, for cloning the repository).
  - Browser: any modern browser with JavaScript enabled.

Required Node.js packages (automatically installed via npm):
  - express
  - mysql2
  - jsonwebtoken
  - bcryptjs
  - cors
  - dotenv
  - multer (for file uploads)
  - json2csv (for CSV reports)
  - xlsx (for Excel reports)

Installation & Setup
--------------------
1. Clone or download the project
   git clone https://github.com/your-repo/cmts.git
   cd cmts

   Expected folder structure:
   cmts/
   ├── frontend/
   │   ├── css/
   │   ├── js/
   │   ├── img/
   │   ├── index.html
   ├── backend/
   │   ├── server.js
   │   ├── package.json
   │   ├── .env
   ├── database/
   │   ├── dbDDL.sql
   │   └── dbDML.sql
   └── README.md

2. Set up the database
   - Start your MySQL server.
   - Create the database and tables:
        mysql -u root -p < database/dbDDL.sql
   - Populate with sample data:
        mysql -u root -p < database/dbDML.sql
   - Important: Set all users to the same password (demo1234) by running:
        UPDATE User SET password_hash = '$2a$10$JFbQrbCzqX.pHAXLbwhNmO5oMWAtcOIB1g.K1spu1JlbQFFNkPrVW';
     (You can generate a fresh bcrypt hash with:
        node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('demo1234', 10).then(h => console.log(h));")

3. Configure the backend
   cd backend
   npm install
   Create a .env file in the backend folder with:
        PORT=5000
        DB_HOST=localhost
        DB_USER=root
        DB_PASSWORD=your_mysql_password
        DB_NAME=complaint_db
        JWT_SECRET=your_super_secret_key_change_me

4. Start the backend server
   node server.js
   Expected output: "CMTS Backend running on port 5000"

5. Serve the frontend
   Open a second terminal:
   cd ../frontend
   npx serve . -p 3000
   OR use VS Code Live Server: open the frontend folder, right‑click index.html, "Open with Live Server".

6. Log in to the application
   Open your browser at http://localhost:3000 (or the Live Server URL).
   Use any of the demo accounts (password is demo1234 for all):
        Role               | Email
        -------------------|---------------------------------
        Student            | ahmed.raza@students.namal.edu
        Junior Handler     | adeel.riaz@namal.edu
        Senior Handler     | senior.handler@namal.edu
        Software Operator  | admin@namal.edu
   Click the corresponding demo button on the login screen or enter credentials manually.

Usage Instructions
------------------
For Complainants (Students, Faculty, Staff):
  - Submit a complaint: Click "New Complaint", select department & tracker, fill details, attach images (optional), submit.
  - Track complaints: Go to "My Complaints", click any complaint to see full timeline and history.
  - Give feedback: When complaint is "Resolved", click "Give Feedback", rate 1‑5 stars. Ratings ≥4 close the complaint; lower ratings reopen it.

For Senior Handlers:
  - Dashboard: View metrics (needs assignment, active, resolved, critical).
  - All complaints: Filter & sort by status, priority, date, department, assigned handler.
  - Assign complaints: Open a complaint (status "New" or "Under Review"), click "Assign", choose a junior handler.
  - Export reports: On the senior dashboard, click "Export Report" to download CSV or Excel of complaints.

For Junior Handlers:
  - Assigned complaints: See only complaints assigned to you. Update status ("In Progress" → "Resolved").

For Software Operators:
  - User management: Add, edit, lock/unlock user accounts.
  - Departments & trackers: Manage complaint categories.
  - Audit log: View a complete log of system actions.


Notes
-----
- The sample passwords in dbDML.sql are placeholders. The bcrypt hash provided above sets all passwords to "demo1234".
- For production, change JWT_SECRET to a strong, unpredictable value.
- File uploads (images) are stored in the backend/uploads folder (you may need to create it).
- The application uses JWT for authentication; tokens expire after 8 hours.
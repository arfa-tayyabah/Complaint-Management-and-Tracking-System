/* ============================================================
   CMTS — Views (render functions for every screen)
   ============================================================ */

const Views = (function () {

  /* ---------------- Shared building blocks ---------------- */

  function statCard(lbl, val, iconName, tone, meta) {
    return `
      <div class="stat">
        <div class="top">
          <span class="lbl">${escapeHtml(lbl)}</span>
          <span class="ic-box ${tone}">${icon(iconName)}</span>
        </div>
        <div class="val">${val}</div>
        ${meta ? `<div class="meta">${escapeHtml(meta)}</div>` : ''}
      </div>
    `;
  }

  function complaintRow(c, opts) {
    opts = opts || {};
    const t = CMTS.tracker(c.tracker_id);
    const d = c.department_name ? { name: c.department_name } : CMTS.dept(c.department_id);
    const assigneeName = c.handler_name || (c.handler_id ? (CMTS.user(c.handler_id) ? CMTS.user(c.handler_id).full_name : '?') : null);

    let cols =
      '<td><span class="cid">#' + c.complaint_id + '</span></td>' +
      '<td><div class="tcell-sub">' + escapeHtml(c.subject) + '</div>' +
        '<div class="tcell-meta">' + escapeHtml(d ? d.name : '') + ' · ' + escapeHtml(t ? t.name : (c.tracker_name || '')) + '</div></td>' +
      '<td>' + prioBadge(c.priority) + '</td>' +
      '<td>' + statusBadge(c.status) + '</td>';

    if (opts.showComplainant) {
      const cName = c.complainant_name || (CMTS.user(c.complainant_id) ? CMTS.user(c.complainant_id).full_name : '?');
      cols += '<td>' + escapeHtml(cName) + '</td>';
    }
    if (opts.showAssignee) {
      cols += '<td>' + (assigneeName
        ? escapeHtml(assigneeName)
        : '<span class="tcell-meta">Unassigned</span>') + '</td>';
    }
    cols += '<td class="tcell-meta">' + timeAgo(c.created_at) + '</td>';
    return '<tr data-cid="' + c.complaint_id + '">' + cols + '</tr>';
  }

  function complaintTable(list, opts) {
    opts = opts || {};
    if (!list || !list.length) {
      return '<div class="empty">' + icon('inbox') + '<div>No complaints found.</div></div>';
    }
    let head = '<th>ID</th><th>Subject</th><th>Priority</th><th>Status</th>';
    if (opts.showComplainant) head += '<th>Complainant</th>';
    if (opts.showAssignee) head += '<th>Assigned To</th>';
    head += '<th>Created</th>';
    return (
      '<div class="table-wrap"><table class="tbl"><thead><tr>' + head + '</tr></thead><tbody>' +
      list.map(c => complaintRow(c, opts)).join('') +
      '</tbody></table></div>'
    );
  }

  function filtersBar() {
    return (
      '<div class="filters">' +
        '<div class="search">' + icon('search') + '<input type="search" id="flt-search" placeholder="Search by ID, subject or location..." /></div>' +
        '<select id="flt-status"><option value="">All statuses</option>' + CMTS.STATUSES.map(s => '<option>' + s + '</option>').join('') + '</select>' +
        '<select id="flt-priority"><option value="">All priorities</option>' + CMTS.PRIORITIES.map(p => '<option>' + p + '</option>').join('') + '</select>' +
        '<select id="flt-range"><option value="">Any time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select>' +
      '</div>'
    );
  }

  function applyFilters(list) {
    const q = (document.getElementById('flt-search')?.value || '').toLowerCase().trim();
    const st = document.getElementById('flt-status')?.value || '';
    const pr = document.getElementById('flt-priority')?.value || '';
    const rg = document.getElementById('flt-range')?.value || '';
    return list.filter(c => {
      if (st && c.status !== st) return false;
      if (pr && c.priority !== pr) return false;
      if (rg) { const days = (Date.now() - new Date(c.created_at)) / 86400000; if (days > +rg) return false; }
      if (q) {
        const hay = ('#' + c.complaint_id + ' ' + c.subject + ' ' + (c.location || '') + ' ' + (c.department_name || '') + ' ' + (c.tracker_name || '')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  /* ---------------- COMPLAINANT ---------------- */

  function complainantDashboard(u) {
    const list = CMTS.complaintsFor(u);
    const total = list.length;
    const pending = list.filter(c => !['Closed', 'Rejected'].includes(c.status)).length;
    const resolved = list.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;
    const awaiting = list.filter(c => c.status === 'Resolved' && !c.feedback).length;
    const recent = list.slice(0, 5);

    return (
      pageHead('My Dashboard', 'Overview of the complaints you have submitted.',
        '<button class="btn btn-primary" data-action="new-complaint">' + icon('plus') + 'New Complaint</button>') +
      '<div class="stat-grid">' +
        statCard('Total Complaints', total, 'inbox', 'ic-blue') +
        statCard('Open / Pending', pending, 'clock', 'ic-amber') +
        statCard('Resolved', resolved, 'checkCircle', 'ic-green') +
        statCard('Awaiting Feedback', awaiting, 'star', 'ic-red', awaiting ? 'Action needed' : 'All caught up') +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="card"><div class="card-head"><h3>Recent Complaints</h3>' +
          '<button class="btn btn-ghost btn-sm" data-nav="my-complaints">View all' + icon('chevronRight') + '</button></div>' +
          '<div class="card-body" style="padding:6px 20px 12px">' + recentList(recent) + '</div></div>' +
        '<div class="card"><div class="card-head"><h3>How it works</h3></div><div class="card-body">' +
          helpPanel() + '</div></div>' +
      '</div>'
    );
  }

  function recentList(list) {
    if (!list.length) return '<div class="empty">' + icon('inbox') + '<div>No complaints yet.</div></div>';
    return list.map(c => {
      const d = c.department_name || (CMTS.dept(c.department_id) ? CMTS.dept(c.department_id).name : '');
      return (
        '<div class="list-row" data-cid="' + c.complaint_id + '" style="cursor:pointer">' +
          '<span class="av-sm">' + icon('file') + '</span>' +
          '<div class="grow"><div class="ttl">' + escapeHtml(c.subject) + '</div>' +
            '<div class="sub"><span class="cid">#' + c.complaint_id + '</span> · ' + escapeHtml(d) + ' · ' + timeAgo(c.created_at) + '</div></div>' +
          statusBadge(c.status) +
        '</div>'
      );
    }).join('');
  }

  function helpPanel() {
    const items = [
      ['plus', 'Submit a complaint', 'Pick a department, choose a tracker, describe the issue and attach up to 5 photos.'],
      ['activity', 'Track progress', 'Every status change is logged with a timestamped timeline.'],
      ['star', 'Give feedback', 'When resolved, rate it. Rating > 3 closes it; lower reopens for review.'],
    ];
    return items.map(i =>
      '<div class="list-row"><span class="av-sm">' + icon(i[0]) + '</span><div class="grow"><div class="ttl">' + i[1] + '</div><div class="sub">' + i[2] + '</div></div></div>'
    ).join('');
  }

  function myComplaints(u) {
    const list = CMTS.complaintsFor(u);
    return (
      pageHead('My Complaints', 'All complaints you have submitted, with live status.',
        '<button class="btn btn-primary" data-action="new-complaint">' + icon('plus') + 'New Complaint</button>') +
      filtersBar() +
      '<div class="card"><div id="complaint-list">' + complaintTable(list) + '</div></div>'
    );
  }

  /* ---------------- HANDLER DASHBOARDS ---------------- */

  function juniorDashboard(u) {
    const list = CMTS.complaintsFor(u);
    
    const openList = list.filter(c => ['Assigned', 'New', 'Under Review'].includes(c.status));
    const progressList = list.filter(c => c.status === 'In Progress');
    const doneList = list.filter(c => ['Resolved', 'Closed', 'Rejected'].includes(c.status));

    const renderKanbanCol = (title, count, cardsList) => {
      const cardsHtml = cardsList.map(c => {
        const tracker = CMTS.tracker(c.tracker_id);
        const dept = c.department_name ? { name: c.department_name } : CMTS.dept(c.department_id);
        const trackerName = tracker ? tracker.name : (c.tracker_name || '');
        const deptName = dept ? dept.name : '';
        
        return `
          <div class="kanban-card" data-cid="${c.complaint_id}">
            <div class="kanban-card-title">${escapeHtml(c.subject)}</div>
            <div class="kanban-card-info">${escapeHtml(deptName)} · ${escapeHtml(trackerName)}</div>
            <div style="margin-bottom:8px;">${prioBadge(c.priority)}</div>
            <div class="kanban-card-meta">
              <span class="cid">#${c.complaint_id}</span>
              <span class="time">${timeAgo(c.created_at)}</span>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="kanban-col">
          <div class="kanban-col-head">
            <span>${title}</span>
            <span class="kanban-col-count">${count}</span>
          </div>
          <div class="kanban-list">
            ${cardsHtml || '<div class="tcell-meta" style="text-align:center;padding:20px 0;">No items</div>'}
          </div>
        </div>
      `;
    };

    return `
      ${pageHead('Junior Handler Kanban', 'Track and progress complaints assigned to you.')}
      <div class="stat-grid">
        ${statCard('Awaiting Start', openList.length, 'clock', 'ic-amber')}
        ${statCard('In Progress', progressList.length, 'activity', 'ic-blue')}
        ${statCard('Resolved / Done', doneList.length, 'checkCircle', 'ic-green')}
      </div>
      <div class="kanban-board">
        ${renderKanbanCol('Open / Assigned', openList.length, openList)}
        ${renderKanbanCol('In Progress', progressList.length, progressList)}
        ${renderKanbanCol('Done / Resolved', doneList.length, doneList)}
      </div>
    `;
  }

  function seniorDashboard(u) {
    const list = CMTS.state.complaints;
    const unassigned = list.filter(c => ['New', 'Under Review'].includes(c.status)).length;
    const active = list.filter(c => ['Assigned', 'In Progress'].includes(c.status)).length;
    const resolved = list.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;
    const critical = list.filter(c => c.priority === 'Critical' && !['Closed', 'Rejected'].includes(c.status)).length;

    const queue = list.filter(c => ['New', 'Under Review'].includes(c.status)).slice(0, 10);

    return `
      ${pageHead('Senior Handler Console', 'University-wide view of all complaints. Review, prioritise and assign.')}
      <div class="stat-grid">
        ${statCard('Needs Assignment', unassigned, 'alert', 'ic-amber', unassigned ? 'Review & assign' : 'Queue clear')}
        ${statCard('Active', active, 'activity', 'ic-blue')}
        ${statCard('Resolved / Closed', resolved, 'checkCircle', 'ic-green')}
        ${statCard('Critical Open', critical, 'trending', 'ic-red')}
      </div>
      
      <div class="card">
        <div class="card-head">
          <h3>Assignment Queue</h3>
          <button class="btn btn-ghost btn-sm" data-nav="all-complaints">All complaints ${icon('chevronRight')}</button>
        </div>
        <div id="complaint-list">
          ${complaintTable(queue, { showComplainant: true })}
        </div>
      </div>
    `;
  }

  function allComplaints(u) {
    const list = CMTS.state.complaints;
    return (
      pageHead('All Complaints', 'Every complaint across all departments.') +
      filtersBar() +
      '<div class="card"><div id="complaint-list">' + complaintTable(list, { showComplainant: true, showAssignee: true }) + '</div></div>'
    );
  }

  /* ---------------- ANALYTICS & REPORTS ---------------- */

  function analyticsPage(u) {
    const list = CMTS.state.complaints;
    const closedComplaints = list.filter(c => c.status === 'Closed');
    let avgResolutionDays = 0;
    if (closedComplaints.length) {
      const total = closedComplaints.reduce((sum, c) => {
        const created = new Date(c.created_at);
        const end = c.feedback?.submitted_at ? new Date(c.feedback.submitted_at) : new Date(c.updated_at || c.created_at);
        return sum + Math.max(0, (end - created) / 86400000);
      }, 0);
      avgResolutionDays = (total / closedComplaints.length).toFixed(1);
    }

    let avgRating = 0;
    const feedbacks = list.filter(c => c.feedback?.overall_rating);
    if (feedbacks.length) {
      const sum = feedbacks.reduce((s, c) => s + c.feedback.overall_rating, 0);
      avgRating = (sum / feedbacks.length).toFixed(1);
    }

    const total = list.length;
    const critical = list.filter(c => c.priority === 'Critical' && !['Closed', 'Rejected'].includes(c.status)).length;

    return `
      ${pageHead('Analytics & Reports', 'University-wide operational analytics and report exports.')}
      
      <div class="stat-grid">
        ${statCard('Total Complaints', total, 'inbox', 'ic-blue')}
        ${statCard('Avg. Resolution', avgResolutionDays + ' days', 'clock', 'ic-info')}
        ${statCard('Avg. Rating', avgRating + ' / 5 ★', 'star', 'ic-yellow')}
        ${statCard('Critical Open', critical, 'trending', 'ic-red')}
      </div>

      <div class="grid-2" style="margin-bottom: 26px;">
        <div class="card">
          <div class="card-head"><h3>Complaints by Department</h3></div>
          <div class="card-body">
            <div style="position: relative; height: 320px; width: 100%;">
              <canvas id="chart-dept"></canvas>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Status Distribution</h3></div>
          <div class="card-body">
            <div style="position: relative; height: 320px; width: 100%;">
              <canvas id="chart-status"></canvas>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Reports &amp; Exports</h3><div class="sub">Export complaint data for analysis</div></div>
        <div class="card-body">
          <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
            <div class="field"><label>From</label><input type="date" id="rpt-from" /></div>
            <div class="field"><label>To</label><input type="date" id="rpt-to" /></div>
            <div class="field"><label>Status</label><select id="rpt-status"><option value="">Any</option>${CMTS.STATUSES.map(s => `<option>${s}</option>`).join('')}</select></div>
            <div class="field"><label>Department</label><select id="rpt-dept"><option value="">All</option>${CMTS.state.departments.map(d => `<option value="${d.department_id}">${escapeHtml(d.name)}</option>`).join('')}</select></div>
            <div style="display:flex;gap:8px;padding-bottom:4px">
              <button class="btn btn-outline" data-report="csv">${icon('download')} CSV</button>
              <button class="btn btn-primary" data-report="excel">${icon('download')} Excel</button>
            </div>
          </div>
          <div style="margin-top:12px;color:var(--muted);font-size:13px">Report includes complaint details, resolution times, assigned handlers, and overall satisfaction ratings.</div>
        </div>
      </div>
    `;
  }

  function initAnalyticsCharts() {
    const list = CMTS.state.complaints;
    
    // Status distribution
    const statusCounts = {};
    CMTS.STATUSES.forEach(s => { statusCounts[s] = 0; });
    list.forEach(c => {
      if (statusCounts[c.status] !== undefined) statusCounts[c.status]++;
    });

    const statusCtx = document.getElementById('chart-status');
    if (statusCtx) {
      new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(statusCounts),
          datasets: [{
            data: Object.values(statusCounts),
            backgroundColor: [
              '#60a5fa', // New -> light blue
              '#fbbf24', // Under Review -> amber
              '#a78bfa', // Assigned -> purple
              '#2563eb', // In Progress -> brand blue
              '#4ade80', // Resolved -> green
              '#f87171', // Rejected -> red
              '#64748b'  // Closed -> gray
            ],
            borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#111a2e' : '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#e6edf7' : '#0f172a',
                font: { family: 'Plus Jakarta Sans', size: 11 }
              }
            }
          }
        }
      });
    }

    // Department breakdown
    const deptCounts = {};
    list.forEach(c => {
      const dName = c.department_name || 'Other';
      deptCounts[dName] = (deptCounts[dName] || 0) + 1;
    });

    const deptCtx = document.getElementById('chart-dept');
    if (deptCtx) {
      new Chart(deptCtx, {
        type: 'bar',
        data: {
          labels: Object.keys(deptCounts),
          datasets: [{
            data: Object.values(deptCounts),
            backgroundColor: '#2563eb',
            borderRadius: 6,
            maxBarThickness: 32
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#94a3b8' : '#64748b',
                font: { family: 'Plus Jakarta Sans', size: 11 }
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1e2c47' : '#e2e8f0'
              },
              ticks: {
                color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#94a3b8' : '#64748b',
                font: { family: 'Plus Jakarta Sans', size: 11 },
                stepSize: 1
              }
            }
          }
        }
      });
    }
  }

  /* ---------------- SOFTWARE OPERATOR ---------------- */

  function operatorDashboard(u) {
    const users = CMTS.state.users;
    const activeU = users.filter(x => x.account_status === 'Active').length;
    const locked = users.filter(x => x.account_status === 'Locked').length;
    const depts = CMTS.state.departments.length;
    const trackers = CMTS.state.trackers.length;
    const recentAudit = CMTS.state.audit.slice(0, 8);
    return (
      pageHead('System Administration', 'Manage users, departments, trackers and monitor system activity.') +
      '<div class="stat-grid">' +
        statCard('Total Users', users.length, 'users', 'ic-blue', activeU + ' active') +
        statCard('Locked Accounts', locked, 'lock', 'ic-red', locked ? 'Needs review' : 'None') +
        statCard('Departments', depts, 'building', 'ic-green') +
        statCard('Trackers', trackers, 'tag', 'ic-slate') +
      '</div>' +
      '<div class="card"><div class="card-head"><h3>Recent System Activity</h3>' +
        '<button class="btn btn-ghost btn-sm" data-nav="audit">Full audit log' + icon('chevronRight') + '</button></div>' +
        '<div class="card-body" style="padding:6px 20px 14px">' + auditList(recentAudit) + '</div></div>'
    );
  }

  function auditList(list) {
    if (!list.length) return '<div class="empty">' + icon('activity') + '<div>No activity recorded.</div></div>';
    const tone = { Login: 'ic-green', Login_Failed: 'ic-red', Account_Locked: 'ic-red', Complaint_Submitted: 'ic-blue', Status_Changed: 'ic-amber', Complaint_Assigned: 'ic-blue', Feedback_Submitted: 'ic-green', Attachment_Uploaded: 'ic-slate', User_Created: 'ic-green', User_Updated: 'ic-amber' };
    return list.map(a => {
      const usr = a.full_name || (CMTS.user(a.user_id) ? CMTS.user(a.user_id).full_name : 'System');
      return '<div class="list-row"><span class="ic-box ' + (tone[a.action_type] || 'ic-slate') + '" style="width:34px;height:34px;border-radius:9px">' + icon('activity') + '</span>' +
        '<div class="grow"><div class="ttl">' + escapeHtml(a.description || a.action_type) + '</div>' +
        '<div class="sub">' + escapeHtml(a.action_type.replace(/_/g, ' ')) + ' · ' + escapeHtml(usr) + (a.ip_address ? ' · ' + escapeHtml(a.ip_address) : '') + '</div></div>' +
        '<span class="tcell-meta">' + timeAgo(a.occurred_at) + '</span></div>';
    }).join('');
  }

  function manageUsers() {
    const users = CMTS.state.users;
    return (
      pageHead('User Management', 'Add, edit, activate or deactivate user accounts.',
        '<button class="btn btn-primary" data-action="new-user">' + icon('plus') + 'Add User</button>') +
      '<div class="filters"><div class="search">' + icon('search') + '<input type="search" id="u-search" placeholder="Search by name or email..." /></div>' +
        '<select id="u-role"><option value="">All roles</option>' +
        ['complainant','junior_handler','senior_handler','software_operator'].map(r => '<option value="' + r + '">' + roleDisplayName(r) + '</option>').join('') +
        '</select>' +
        '<select id="u-status"><option value="">All statuses</option><option value="Active">Active</option><option value="Locked">Locked</option><option value="Inactive">Inactive</option></select>' +
      '</div>' +
      '<div class="card"><div id="users-list">' + usersTable(users) + '</div></div>'
    );
  }

  function roleDisplayName(role) {
    const map = { complainant: 'Complainant', junior_handler: 'Junior Handler', senior_handler: 'Senior Handler', software_operator: 'Software Operator' };
    return map[role] || role;
  }

  function usersTable(list) {
    if (!list.length) return '<div class="empty">' + icon('users') + '<div>No users found.</div></div>';
    return '<div class="table-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead><tbody>' +
      list.map(u =>
        '<tr>' +
          '<td><div class="tcell-sub">' + escapeHtml(u.full_name) + '</div></td>' +
          '<td class="tcell-meta">' + escapeHtml(u.email) + '</td>' +
          '<td><span class="tag">' + escapeHtml(roleDisplayName(u.role)) + '</span></td>' +
          '<td class="tcell-meta">' + escapeHtml(u.department_name || '—') + '</td>' +
          '<td>' + accountBadge(u.account_status) + '</td>' +
          '<td style="text-align:right;white-space:nowrap">' +
            '<button class="btn btn-ghost btn-sm" data-edit-user="' + u.user_id + '" title="Edit">' + icon('edit') + '</button>' +
            (u.account_status === 'Active'
              ? '<button class="btn btn-ghost btn-sm" data-lock-user="' + u.user_id + '" data-to="Locked" title="Lock account">' + icon('lock') + '</button>'
              : '<button class="btn btn-ghost btn-sm" data-lock-user="' + u.user_id + '" data-to="Active" title="Unlock account">' + icon('unlock') + '</button>') +
          '</td></tr>'
      ).join('') + '</tbody></table></div>';
  }

  function accountBadge(s) {
    const map = { Active: 'badge-resolved', Locked: 'badge-rejected', Inactive: 'badge-closed' };
    return '<span class="badge ' + (map[s] || '') + '"><span class="dot"></span>' + s + '</span>';
  }

  function manageDepartments() {
    const depts = CMTS.state.departments;
    return (
      pageHead('Departments & Trackers', 'Configure complaint routing. Inactive items are hidden from submission but keep history.',
        '<div style="display:flex;gap:10px"><button class="btn btn-outline" data-action="new-tracker">' + icon('plus') + 'Tracker</button>' +
        '<button class="btn btn-primary" data-action="new-dept">' + icon('plus') + 'Department</button></div>') +
      depts.map(d => deptCard(d)).join('')
    );
  }

  function deptCard(d) {
    const trackers = CMTS.trackersForDept(d.department_id);
    return (
      '<div class="card" style="margin-bottom:16px"><div class="card-head">' +
        '<div style="display:flex;align-items:center;gap:12px"><span class="ic-box ic-blue" style="width:40px;height:40px;border-radius:10px">' + icon('building') + '</span>' +
        '<div><h3>' + escapeHtml(d.name) + (d.is_active ? '' : ' <span class="badge badge-closed" style="margin-left:6px">Inactive</span>') + '</h3>' +
        '<div class="tcell-meta">' + escapeHtml(d.description || '') + '</div></div></div>' +
        '<button class="btn btn-ghost btn-sm" data-edit-dept="' + d.department_id + '">' + icon('edit') + 'Edit</button></div>' +
      '<div class="card-body">' +
        (trackers.length
          ? '<div class="choice-grid">' + trackers.map(t =>
              '<div class="choice" style="cursor:default"><div class="t">' + escapeHtml(t.name) +
              (t.is_active ? '' : ' <span class="badge badge-closed">Inactive</span>') + '</div>' +
              '<div class="d">' + escapeHtml(t.description || '') + '</div>' +
              '<button class="btn btn-ghost btn-sm" data-edit-tracker="' + t.tracker_id + '" style="margin-top:8px;padding:4px 8px">' + icon('edit') + 'Edit</button></div>'
            ).join('') + '</div>'
          : '<div class="tcell-meta">No trackers yet.</div>') +
      '</div></div>'
    );
  }

  function auditLog() {
    const list = CMTS.state.audit;
    return (
      pageHead('Audit Log', 'Insert-only record of all critical system actions.') +
      '<div class="filters"><div class="search">' + icon('search') + '<input type="search" id="a-search" placeholder="Search audit log..." /></div>' +
        '<select id="a-type"><option value="">All actions</option>' +
        ['Login', 'Login_Failed', 'Complaint_Submitted', 'Status_Changed', 'Complaint_Assigned', 'Account_Locked', 'Feedback_Submitted', 'User_Created', 'User_Updated', 'Attachment_Uploaded'].map(x => '<option>' + x + '</option>').join('') +
        '</select></div>' +
      '<div class="card"><div class="card-body" id="audit-list">' + auditList(list) + '</div></div>'
    );
  }

  /* ---------------- PROFILE ---------------- */

  function profileView(u) {
    const deptName = u.department_name || (CMTS.dept(u.department_id) ? CMTS.dept(u.department_id).name : '—');
    const roleMap = { complainant: 'Complainant', junior_handler: 'Junior Handler', senior_handler: 'Senior Handler', software_operator: 'Software Operator' };
    let subInfo = '';
    if (u.reg_number) subInfo = `<div class="kv-row"><span>Reg #</span><span>${escapeHtml(u.reg_number)}</span></div><div class="kv-row"><span>Program</span><span>${escapeHtml(u.program || '—')}</span></div><div class="kv-row"><span>Semester</span><span>${escapeHtml(u.semester || '—')}</span></div>`;
    else if (u.designation) subInfo = `<div class="kv-row"><span>Designation</span><span>${escapeHtml(u.designation)}</span></div><div class="kv-row"><span>Office</span><span>${escapeHtml(u.office_number || '—')}</span></div>`;
    else if (u.position) subInfo = `<div class="kv-row"><span>Position</span><span>${escapeHtml(u.position)}</span></div><div class="kv-row"><span>Staff Type</span><span>${escapeHtml(u.staff_type || '—')}</span></div>`;

    return pageHead('My Profile', 'Manage your account details and security settings.') +
    `<div class="grid-2">
      <div class="card card-pad">
        <div style="display:flex;align-items:center;gap:18px;margin-bottom:24px">
          <div>
            <div style="font-size:20px;font-weight:700">${escapeHtml(u.full_name)}</div>
            <div class="tcell-meta">${escapeHtml(u.email)}</div>
            <div style="margin-top:6px"><span class="tag">${escapeHtml(roleMap[u.role] || u.role)}</span></div>
          </div>
        </div>
        <div class="section-lbl">Account Details</div>
        <div class="kv-list">
          <div class="kv-row"><span>Email</span><span>${escapeHtml(u.email)}</span></div>
          <div class="kv-row"><span>Department</span><span>${escapeHtml(deptName)}</span></div>
          <div class="kv-row"><span>Role</span><span>${escapeHtml(roleMap[u.role] || u.role)}</span></div>
          <div class="kv-row"><span>Account Status</span><span>${accountBadge(u.account_status)}</span></div>
          <div class="kv-row"><span>Member Since</span><span>${fmtDate(u.created_at)}</span></div>
          ${subInfo}
        </div>
      </div>
      <div>
        <div class="card card-pad" style="margin-bottom:16px">
          <div class="section-lbl">Update Display Name</div>
          <div class="field"><label>Full Name</label><input type="text" id="prof-name" value="${escapeHtml(u.full_name)}" maxlength="150" /></div>
          <button class="btn btn-primary" id="prof-save-name">${icon('check')} Save Name</button>
        </div>
        <div class="card card-pad">
          <div class="section-lbl">Change Password</div>
          <div class="field"><label>Current Password</label><input type="password" id="prof-cur-pass" placeholder="Enter current password" /></div>
          <div class="field"><label>New Password</label><input type="password" id="prof-new-pass" placeholder="Min. 6 characters" /></div>
          <div class="field"><label>Confirm New Password</label><input type="password" id="prof-confirm-pass" placeholder="Repeat new password" /></div>
          <button class="btn btn-primary" id="prof-save-pass">${icon('lock')} Update Password</button>
        </div>
      </div>
    </div>`;
  }

  /* ---------------- Shared helpers ---------------- */
  function pageHead(title, desc, actions) {
    return '<div class="page-head"><div><h1>' + escapeHtml(title) + '</h1>' +
      (desc ? '<div class="desc">' + desc + '</div>' : '') + '</div>' +
      (actions ? '<div>' + actions + '</div>' : '') + '</div>';
  }

  return {
    complainantDashboard, myComplaints,
    juniorDashboard, seniorDashboard, allComplaints,
    analyticsPage, initAnalyticsCharts,
    operatorDashboard, manageUsers, usersTable, manageDepartments, auditLog, auditList,
    complaintTable, applyFilters, accountBadge, pageHead, recentList, profileView,
    roleDisplayName,
  };
})();

const API_BASE = window.__API_BASE__ || '/api';
let authToken = null;
let currentUser = null;

function setAuthToken(token) {
  authToken = token;
  if (token) sessionStorage.setItem('cmts_token', token);
  else sessionStorage.removeItem('cmts_token');
}

function getAuthHeader() {
  const token = authToken || sessionStorage.getItem('cmts_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function apiCall(endpoint, method, body) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

async function apiUpload(endpoint, formData) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { ...getAuthHeader() },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload failed (${res.status})`);
  }
  return res.json();
}

const CMTS = {
  async login(email, password) {
    const data = await apiCall('/auth/login', 'POST', { email, password });
    setAuthToken(data.token);
    currentUser = data.user;
    return currentUser;
  },
  logout() {
    setAuthToken(null);
    currentUser = null;
    this.state = { complaints: [], users: [], departments: [], trackers: [], audit: [] };
  },
  getCurrentUser() { return currentUser; },

  async getComplaints() { return apiCall('/complaints', 'GET'); },
  async getComplaint(id) { return apiCall(`/complaints/${id}`, 'GET'); },
  async createComplaint(formData) { return apiUpload('/complaints', formData); },
  async changeStatus(complaintId, newStatus, remarks) {
    return apiCall(`/complaints/${complaintId}/status`, 'PATCH', { status: newStatus, remarks: remarks || '' });
  },
  async assignComplaint(complaintId, handlerId, remarks) {
    return apiCall(`/complaints/${complaintId}/assign`, 'POST', { handler_id: handlerId, remarks: remarks || '' });
  },
  async submitFeedback(complaintId, fb) {
    return apiCall(`/complaints/${complaintId}/feedback`, 'POST', {
      overall_rating: fb.overall,
      response_time_rating: fb.responseTime || null,
      communication_rating: fb.communication || null,
      resolution_rating: fb.resolution || null,
      text_comment: fb.comment || null,
    });
  },

  async getUsers() { return apiCall('/admin/users', 'GET'); },
  async createUser(data) { return apiCall('/admin/users', 'POST', data); },
  async updateUser(id, data) { return apiCall(`/admin/users/${id}`, 'PUT', data); },
  async setUserStatus(userId, status) { return apiCall(`/admin/users/${userId}/lock`, 'PATCH', { status }); },
  async resetUserPassword(userId, newPassword) {
    return apiCall(`/admin/users/${userId}/reset-password`, 'PATCH', { new_password: newPassword });
  },

  async getDepartments() { return apiCall('/departments', 'GET'); },
  async createDepartment(data) { return apiCall('/departments', 'POST', data); },
  async updateDepartment(id, data) { return apiCall(`/departments/${id}`, 'PUT', data); },

  async getTrackers() { return apiCall('/trackers', 'GET'); },
  async createTracker(data) { return apiCall('/trackers', 'POST', data); },
  async updateTracker(id, data) { return apiCall(`/trackers/${id}`, 'PUT', data); },

  async getAuditLog() { return apiCall('/audit', 'GET'); },
  async getProfile() { return apiCall('/me', 'GET'); },
  async updateProfile(data) { return apiCall('/me', 'PATCH', data); },

  async getReport(params = {}) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
      .join('&');
    const url = `${API_BASE}/reports/complaints${qs ? ('?' + qs) : ''}`;
    const res = await fetch(url, { method: 'GET', headers: { ...getAuthHeader() } });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/csv') || contentType.includes('application/octet-stream') || contentType.includes('ms-excel')) {
      const blob = await res.blob();
      return { blob, contentType };
    }
    return res.json();
  },

  state: { complaints: [], users: [], departments: [], trackers: [], audit: [] },

  async loadAll() {
    const user = this.getCurrentUser();
    this.state.complaints = await this.getComplaints();
    this.state.departments = await this.getDepartments();
    this.state.trackers = await this.getTrackers();
    if (user && (user.is_administrator || user.is_senior_handler)) {
      this.state.users = await this.getUsers();
    }
    if (user && user.is_senior_handler) {
      this.state.audit = [];
    }
    if (user && user.is_administrator) {
      this.state.audit = await this.getAuditLog();
    }
  },

  user(id) { return this.state.users.find(u => u.user_id === id); },
  dept(id) { return this.state.departments.find(d => d.department_id === id); },
  tracker(id) { return this.state.trackers.find(t => t.tracker_id === id); },
  trackersForDept(deptId) { return this.state.trackers.filter(t => t.department_id === deptId); },
  subHandlers() { return this.state.users.filter(u => u.role === 'junior_handler'); },
  complaintsFor(user) {
    if (user.is_administrator) return this.state.complaints;
    if (user.is_senior_handler) return this.state.complaints;
    if (user.is_sub_handler) return this.state.complaints.filter(c => c.handler_id === user.user_id);
    return this.state.complaints.filter(c => c.complainant_id === user.user_id);
  },

  STATUSES: ['New', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected', 'Closed'],
  PRIORITIES: ['Low', 'Medium', 'High', 'Critical'],
  statusClass: {
    'New': 'badge-new', 'Under Review': 'badge-review', 'Assigned': 'badge-assigned',
    'In Progress': 'badge-progress', 'Resolved': 'badge-resolved',
    'Rejected': 'badge-rejected', 'Closed': 'badge-closed',
  },
};

window.CMTS = CMTS;
// =============================================
// API — All HTTP calls to the Express backend
// =============================================

const API_BASE = 'http://localhost:3001/api';

const api = {
  async request(method, path, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${path}`, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  // Employees
  getEmployees: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.request('GET', `/employees${q ? '?' + q : ''}`);
  },
  createEmployee: (data) => api.request('POST', '/employees', data),
  updateEmployee: (id, data) => api.request('PUT', `/employees/${id}`, data),
  deleteEmployee: (id) => api.request('DELETE', `/employees/${id}`),

  // Skills
  getSkills: () => api.request('GET', '/skills'),
  createSkill: (data) => api.request('POST', '/skills', data),

  // Tasks
  getTasks: () => api.request('GET', '/tasks'),
  createTask: (data) => api.request('POST', '/tasks', data),
  updateTask: (id, data) => api.request('PUT', `/tasks/${id}`, data),
  deleteTask: (id) => api.request('DELETE', `/tasks/${id}`),
  assignTask: (taskId, employeeId) => api.request('POST', `/tasks/${taskId}/assign`, { employee_id: employeeId }),

  // Dashboard
  getDashboard: () => api.request('GET', '/dashboard'),

  // Optimize
  optimize: (save = false) => api.request('POST', '/optimize', { save }),
};

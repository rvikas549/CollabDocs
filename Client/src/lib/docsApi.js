import api from '../config/api';

const data = (response) => response.data;

export const docsApi = {
  list: (scope = 'all') => api.get('/documents', { params: { scope } }).then(data),
  create: (payload = {}) => api.post('/documents', payload).then(data),
  get: (id) => api.get(`/documents/${id}`).then(data),
  update: (id, patch) => api.patch(`/documents/${id}`, patch).then(data),
  star: (id, starred) => api.post(`/documents/${id}/star`, { starred }).then(data),
  duplicate: (id) => api.post(`/documents/${id}/duplicate`).then(data),
  leave: (id) => api.post(`/documents/${id}/leave`).then(data),
  remove: (id) => api.delete(`/documents/${id}`).then(data),
};

export const docUrl = (id) => `${window.location.origin}/doc/${id}`;

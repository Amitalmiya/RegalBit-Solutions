import api from './api';

export const loginAPI    = (data) => api.post('/auth/login', data);
export const registerAPI = (data) => api.post('/auth/register', data);
export const getMeAPI    = ()     => api.get('/auth/me');
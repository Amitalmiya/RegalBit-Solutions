import api from './api.js';

export const getUserProfileAPI  = (username)   => api.get(`/users/${username}`);
export const updateProfileAPI   = (formData)   => api.put('/users/profile', formData);
export const toggleFollowAPI    = (userId)     => api.put(`/users/${userId}/follow`);
export const getSuggestionsAPI  = ()           => api.get('/users/suggestions');
export const searchUsersAPI     = (query)      => api.get(`/users/search?q=${query}`);

import api from './api.js';

export const getFeedAPI     = (page = 1)    => api.get(`/posts/feed?page=${page}`);
export const getExploreAPI  = (page = 1)    => api.get(`/posts/explore?page=${page}`);
export const getPostAPI     = (id)          => api.get(`/posts/${id}`);
export const createPostAPI  = (formData)    => api.post('/posts', formData);
export const deletePostAPI  = (id)          => api.delete(`/posts/${id}`);
export const toggleLikeAPI  = (id)          => api.put(`/posts/${id}/like`);

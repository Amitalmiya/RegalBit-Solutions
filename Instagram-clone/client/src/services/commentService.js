import api from './api.js';

export const getCommentsAPI = (postId)         => api.get(`/comments/${postId}`);
export const addCommentAPI  = (postId, data)   => api.post(`/comments/${postId}`, data);
export const deleteCommentAPI = (commentId)    => api.delete(`/comments/${commentId}`);

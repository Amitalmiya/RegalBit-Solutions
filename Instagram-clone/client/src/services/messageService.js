import api from './api.js';

export const getConversationsAPI       = ()                     => api.get('/messages/conversations');
export const getOrCreateConversationAPI = (userId)              => api.post('/messages/conversations', { userId });
export const getMessagesAPI            = (conversationId)       => api.get(`/messages/${conversationId}`);
export const sendMessageAPI            = (conversationId, data) => api.post(`/messages/${conversationId}`, data);
export const deleteMessageAPI          = (messageId)            => api.delete(`/messages/message/${messageId}`);
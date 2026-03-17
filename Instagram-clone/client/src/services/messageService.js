import api from './api';

export const getConversationsAPI        = ()                         => api.get('/messages/conversations');
export const getOrCreateConversationAPI = (userId)                   => api.post('/messages/conversations', { userId });
export const getMessagesAPI             = (conversationId)           => api.get(`/messages/${conversationId}`);
export const sendMessageAPI             = (conversationId, data)     => api.post(`/messages/${conversationId}`, data);
export const sharePostAPI               = (postId, userIds, caption) => api.post('/messages/share-post', { postId, userIds, caption });
export const deleteMessageAPI           = (messageId)                => api.delete(`/messages/message/${messageId}`);
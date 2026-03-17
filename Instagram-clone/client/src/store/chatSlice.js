import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getConversationsAPI } from '../services/messageService';

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getConversationsAPI();
      return res.data.conversations;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load conversations');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    conversations:      [],
    activeConversation: null,
    unreadCount:        0,
    onlineUsers:        [],
    loading:            false,
    error:              null,
  },
  reducers: {
    setActiveConversation(state, action) {
      state.activeConversation = action.payload;
    },
    addConversation(state, action) {
      const exists = state.conversations.find((c) => c._id === action.payload._id);
      if (!exists) state.conversations.unshift(action.payload);
    },
    updateConversationLastMessage(state, action) {
      const { conversationId, message } = action.payload;
      const conv = state.conversations.find((c) => c._id === conversationId);
      if (conv) {
        conv.lastMessage   = message;
        conv.lastMessageAt = message.createdAt;
        state.conversations = [
          conv,
          ...state.conversations.filter((c) => c._id !== conversationId),
        ];
      }
    },
    setUserOnline(state, action) {
      const { userId, online } = action.payload;
      if (online) {
        if (!state.onlineUsers.includes(userId)) state.onlineUsers.push(userId);
      } else {
        state.onlineUsers = state.onlineUsers.filter((id) => id !== userId);
      }
    },
    incrementUnread(state) { state.unreadCount += 1; },
    resetUnread(state)      { state.unreadCount  = 0; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading       = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });
  },
});

export const {
  setActiveConversation,
  addConversation,
  updateConversationLastMessage,
  setUserOnline,
  incrementUnread,
  resetUnread,
} = chatSlice.actions;

export default chatSlice.reducer;
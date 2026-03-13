import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginAPI, registerAPI, getMeAPI } from '../services/authService.js';

// Load user from localStorage on app start
const token = localStorage.getItem('token');

export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await loginAPI(data);
    localStorage.setItem('token', res.data.token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await registerAPI(data);
    localStorage.setItem('token', res.data.token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const fetchCurrentUser = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const res = await getMeAPI();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch user');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:    null,
    token:   token || null,
    loading: false,
    error:   null,
  },
  reducers: {
    logout(state) {
      state.user  = null;
      state.token = null;
      localStorage.removeItem('token');
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending,  (state) => { state.loading = true;  state.error = null; })
      .addCase(loginUser.fulfilled,(state, action) => {
        state.loading = false;
        state.user    = action.payload.user;
        state.token   = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });

    // Register
    builder
      .addCase(registerUser.pending,  (state) => { state.loading = true;  state.error = null; })
      .addCase(registerUser.fulfilled,(state, action) => {
        state.loading = false;
        state.user    = action.payload.user;
        state.token   = action.payload.token;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });

    // Fetch current user
    builder
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
      });
  },
});

export const { logout, updateUser, clearError } = authSlice.actions;
export default authSlice.reducer;

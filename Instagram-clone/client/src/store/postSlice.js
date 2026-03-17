import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getFeedAPI, toggleLikeAPI } from '../services/postService';

export const fetchFeed = createAsyncThunk('posts/feed', async (page = 1, { rejectWithValue }) => {
  try {
    const res = await getFeedAPI(page);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch feed');
  }
});

export const likePost = createAsyncThunk('posts/like', async (postId, { rejectWithValue }) => {
  try {
    const res = await toggleLikeAPI(postId);
    return { postId, ...res.data };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to like post');
  }
});

const postSlice = createSlice({
  name: 'posts',
  initialState: {
    posts:   [],
    loading: false,
    error:   null,
    page:    1,
    hasMore: true,
  },
  reducers: {
    clearPosts(state) {
      state.posts   = [];
      state.page    = 1;
      state.hasMore = true;
    },
    addNewPost(state, action) {
      state.posts.unshift(action.payload);
    },
    removePost(state, action) {
      state.posts = state.posts.filter((p) => p._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending,  (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFeed.fulfilled,(state, action) => {
        state.loading = false;
        if (action.payload.page === 1) {
          state.posts = action.payload.posts;
        } else {
          state.posts = [...state.posts, ...action.payload.posts];
        }
        state.hasMore = action.payload.hasMore;
        state.page    = action.payload.page;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });

    builder.addCase(likePost.fulfilled, (state, action) => {
      const post = state.posts.find((p) => p._id === action.payload.postId);
      if (post) post.likesCount = action.payload.likesCount;
    });
  },
});

export const { clearPosts, addNewPost, removePost } = postSlice.actions;
export default postSlice.reducer;
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiRequest } from '../../api/http.js';

export const fetchUsers = createAsyncThunk('users/fetchUsers', async (_, { getState, rejectWithValue }) => {
  try {
    return await apiRequest('/users', { token: getState().auth.token });
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, changes }, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/users/${id}`, {
        method: 'PATCH',
        token: getState().auth.token,
        body: changes,
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id, { getState, rejectWithValue }) => {
    try {
      const result = await apiRequest(`/users/${id}`, {
        method: 'DELETE',
        token: getState().auth.token,
      });
      return { id, message: result.message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    items: [],
    status: 'idle',
    savingId: null,
    error: null,
    notice: null,
  },
  reducers: {
    clearUsersMessage(state) {
      state.error = null;
      state.notice = null;
    },
    resetUsers(state) {
      state.items = [];
      state.status = 'idle';
      state.savingId = null;
      state.error = null;
      state.notice = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.users;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Unable to load users.';
      })
      .addCase(updateUser.pending, (state, action) => {
        state.savingId = action.meta.arg.id;
        state.error = null;
        state.notice = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.savingId = null;
        const index = state.items.findIndex((user) => user.id === action.payload.user.id);
        if (index !== -1) state.items[index] = action.payload.user;
        state.notice = action.payload.message;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.savingId = null;
        state.error = action.payload || 'Unable to update the user.';
      })
      .addCase(deleteUser.pending, (state, action) => {
        state.savingId = action.meta.arg;
        state.error = null;
        state.notice = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.savingId = null;
        state.items = state.items.filter((user) => user.id !== action.payload.id);
        state.notice = action.payload.message;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.savingId = null;
        state.error = action.payload || 'Unable to delete the user.';
      });
  },
});

export const { clearUsersMessage, resetUsers } = usersSlice.actions;
export default usersSlice.reducer;

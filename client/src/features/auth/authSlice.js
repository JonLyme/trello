import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiRequest } from '../../api/http.js';
import { apiFileUploadRequest } from '../../api/http_file.js';

const STORAGE_KEY = 'account-hub-session';

function readStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    const parsed = JSON.parse(raw);
    return {
      token: typeof parsed.token === 'string' ? parsed.token : null,
      user: parsed.user || null,
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { token: null, user: null };
  }
}

function writeStoredSession(token, user) {
  if (token && user) localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
  else localStorage.removeItem(STORAGE_KEY);
}

const stored = readStoredSession();

/**
 * Accept one stable object from the form and construct the transport payload
 * here. This deliberately avoids `payload instanceof FormData`, which can be
 * unreliable across browser realms and previously allowed FormData to be
 * JSON-stringified to `{}`.
 */
export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ name, email, password, avatar = null }, { rejectWithValue }) => {
    try {
      if (avatar) {
        const multipartBody = new FormData();
        multipartBody.set('name', name);
        multipartBody.set('email', email);
        multipartBody.set('password', password);
        multipartBody.set('avatar', avatar);
        return await apiFileUploadRequest('/auth/signup', {
          method: 'POST',
          body: multipartBody,
        });
      }

      return await apiRequest('/auth/signup', {
        method: 'POST',
        body: { name, email, password },
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (credentials, { rejectWithValue }) => {
    try {
      return await apiRequest('/auth/signin', { method: 'POST', body: credentials });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { getState, rejectWithValue }) => {
    try {
      return await apiRequest('/auth/me', { token: getState().auth.token });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const uploadAvatar = createAsyncThunk(
  'auth/uploadAvatar',
  async (data, { getState, rejectWithValue }) => {
    try {
      return await apiFileUploadRequest('/avatar', {
        method: 'POST',
        token: getState().auth.token,
        body: data,
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: stored.token,
    user: stored.user,
    initialized: !stored.token,
    status: 'idle',
    avatarStatus: 'idle',
    error: null,
    notice: null,
  },
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      state.notice = null;
      state.initialized = true;
      writeStoredSession(null, null);
    },
    clearAuthMessage(state) {
      state.error = null;
      state.notice = null;
    },
  },
  extraReducers: (builder) => {
    const saveSession = (state, action) => {
      state.status = 'succeeded';
      state.initialized = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.notice = action.payload.message;
      writeStoredSession(state.token, state.user);
    };

    builder
      .addCase(signUp.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.notice = null;
      })
      .addCase(signUp.fulfilled, saveSession)
      .addCase(signUp.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Unable to create the account.';
      })
      .addCase(signIn.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.notice = null;
      })
      .addCase(signIn.fulfilled, saveSession)
      .addCase(signIn.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Unable to sign in.';
      })
      .addCase(fetchMe.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.initialized = true;
        state.user = action.payload.user;
        writeStoredSession(state.token, state.user);
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.status = 'failed';
        state.initialized = true;
        state.token = null;
        state.user = null;
        state.error = action.payload || 'Your session is no longer valid.';
        writeStoredSession(null, null);
      })
      .addCase(uploadAvatar.pending, (state) => {
        state.avatarStatus = 'loading';
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.avatarStatus = 'succeeded';
        state.user = action.payload.user;
        state.notice = action.payload.message;
        writeStoredSession(state.token, state.user);
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.avatarStatus = 'failed';
        state.error = action.payload || 'Unable to upload avatar.';
      });
  },
});

export const { logout, clearAuthMessage } = authSlice.actions;
export default authSlice.reducer;

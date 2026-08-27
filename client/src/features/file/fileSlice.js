import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiFileUploadRequest } from '../../api/http_file.js';

export const submitFile = createAsyncThunk(
  'users/uploadFile',
  async (data, { getState, rejectWithValue }) => {
    try {
      return await apiFileUploadRequest('/file/uploadFile', {
        method: 'POST',
        token: getState().auth.token,
        body: data,
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

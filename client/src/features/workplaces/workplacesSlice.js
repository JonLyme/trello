import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "../../api/http.js";
import { apiFileUploadRequest } from "../../api/http_file.js";

export const fetchWorkplaces = createAsyncThunk(
  "workplaces/fetchWorkplaces",
  async (_, { getState, rejectWithValue }) => {
    try {
      return await apiRequest("/workplaces", { token: getState().auth.token });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchSharedWorkplaces = createAsyncThunk(
  "workplaces/fetchSharedWorkplaces",
  async (_, { getState, rejectWithValue }) => {
    try {
      return await apiRequest("/workplaces/shared", {
        token: getState().auth.token,
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchInviteUserData = createAsyncThunk(
  "workplaces/fetchInviteUserData",
  async (workspace_id, { getState, rejectWithValue }) => {
    try {
      return await apiRequest("/workplaces/invitedUser", {
        method: "POST",
        token: getState().auth.token,
        body: { workspace_id: workspace_id },
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const insertWorkplace = createAsyncThunk(
  "workplaces/insertWorkplace",
  async (data, { getState, rejectWithValue }) => {
    try {
      return await apiFileUploadRequest("/workplaces/add", {
        method: "POST",
        token: getState().auth.token,
        body: data,
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateWorkplace = createAsyncThunk(
  "workplaces/updateWorkplace",
  async ({ id, changes }, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/workplaces/${id}`, {
        method: "PATCH",
        token: getState().auth.token,
        body: changes,
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteWorkplace = createAsyncThunk(
  "workplaces/deleteWorkplace",
  async (id, { getState, rejectWithValue }) => {
    try {
      const result = await apiRequest(`/workplaces/${id}`, {
        method: "DELETE",
        token: getState().auth.token,
      });
      return { id, message: result.message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const initialState = {
  items: [],
  sharedItems: [],
  InvitedUsers: [],
  fetchStatus: "idle",
  sharedFetchStatus: "idle",
  invitedFetchStatus: "idle",
  createStatus: "idle",
  deletingIds: [],
  updatingIds: [],
  currentFetchRequestId: null,
  error: null,
  sharedError: null,
  notice: null,
};

const workplacesSlice = createSlice({
  name: "workplaces",
  initialState,
  reducers: {
    clearWorkplacesMessage(state) {
      state.error = null;
      state.sharedError = null;
      state.notice = null;
    },
    resetWorkplaces() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkplaces.pending, (state, action) => {
        state.fetchStatus = "loading";
        state.currentFetchRequestId = action.meta.requestId;
        state.error = null;
      })
      .addCase(fetchWorkplaces.fulfilled, (state, action) => {
        if (state.currentFetchRequestId !== action.meta.requestId) return;
        state.fetchStatus = "succeeded";
        state.currentFetchRequestId = null;
        state.items = Array.isArray(action.payload?.workplaces)
          ? action.payload.workplaces
          : [];
      })
      .addCase(fetchWorkplaces.rejected, (state, action) => {
        if (state.currentFetchRequestId !== action.meta.requestId) return;
        state.fetchStatus = "failed";
        state.currentFetchRequestId = null;
        state.error = action.payload || "Unable to load workplaces.";
      })
      .addCase(fetchSharedWorkplaces.pending, (state) => {
        state.sharedFetchStatus = "loading";
        state.sharedError = null;
      })
      .addCase(fetchSharedWorkplaces.fulfilled, (state, action) => {
        state.sharedFetchStatus = "succeeded";
        state.sharedItems = Array.isArray(action.payload?.workplaces)
          ? action.payload.workplaces
          : [];
      })
      .addCase(fetchSharedWorkplaces.rejected, (state, action) => {
        state.sharedFetchStatus = "failed";
        state.sharedError =
          action.payload || "Unable to load shared workplaces.";
      })
      .addCase(fetchInviteUserData.pending, (state) => {
        state.invitedFetchStatus = "loading";
        state.sharedError = null;
      })
      .addCase(fetchInviteUserData.fulfilled, (state, action) => {
        state.invitedFetchStatus = "succeeded";
        state.InvitedUsers = Array.isArray(action.payload?.users_data)
          ? action.payload.users_data
          : [];
      })
      .addCase(fetchInviteUserData.rejected, (state, action) => {
        state.invitedFetchStatus = "failed";
        state.sharedError =
          action.payload || "Unable to load shared workplaces.";
      })
      .addCase(insertWorkplace.pending, (state) => {
        state.createStatus = "loading";
        state.currentFetchRequestId = null;
        state.error = null;
        state.notice = null;
      })
      .addCase(insertWorkplace.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        const workplace = action.payload?.workplace;
        if (workplace) {
          const existingIndex = state.items.findIndex(
            (item) => Number(item.id) === Number(workplace.id),
          );
          if (existingIndex === -1) state.items.unshift(workplace);
          else state.items[existingIndex] = workplace;
        }
        state.notice = action.payload?.message || "Workspace created.";
      })
      .addCase(insertWorkplace.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error = action.payload || "Unable to add the workplace.";
      })
      .addCase(updateWorkplace.pending, (state, action) => {
        const id = Number(action.meta.arg.id);
        if (!state.updatingIds.includes(id)) state.updatingIds.push(id);
        state.currentFetchRequestId = null;
        state.error = null;
        state.notice = null;
      })
      .addCase(updateWorkplace.fulfilled, (state, action) => {
        const workplace = action.payload?.workplace;
        state.updatingIds = state.updatingIds.filter(
          (id) => id !== Number(workplace?.id),
        );
        const index = state.items.findIndex(
          (item) => Number(item.id) === Number(workplace?.id),
        );
        if (index !== -1 && workplace) state.items[index] = workplace;
        state.notice = action.payload?.message;
      })
      .addCase(updateWorkplace.rejected, (state, action) => {
        state.updatingIds = state.updatingIds.filter(
          (id) => id !== Number(action.meta.arg.id),
        );
        state.error = action.payload || "Unable to update the workplace.";
      })
      .addCase(deleteWorkplace.pending, (state, action) => {
        const id = Number(action.meta.arg);
        if (!state.deletingIds.includes(id)) state.deletingIds.push(id);
        state.currentFetchRequestId = null;
        state.error = null;
        state.notice = null;
      })
      .addCase(deleteWorkplace.fulfilled, (state, action) => {
        state.deletingIds = state.deletingIds.filter(
          (id) => id !== Number(action.payload.id),
        );
        state.items = state.items.filter(
          (workplace) => Number(workplace.id) !== Number(action.payload.id),
        );
        state.notice = action.payload.message;
      })
      .addCase(deleteWorkplace.rejected, (state, action) => {
        state.deletingIds = state.deletingIds.filter(
          (id) => id !== Number(action.meta.arg),
        );
        state.error = action.payload || "Unable to delete the workplace.";
      });
  },
});

export const { clearWorkplacesMessage, resetWorkplaces } =
  workplacesSlice.actions;
export default workplacesSlice.reducer;

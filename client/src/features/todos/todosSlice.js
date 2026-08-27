import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "../../api/http.js";

const call = (type, fn) => createAsyncThunk(type, fn);

export const fetchBoard = call(
  "todos/fetchBoard",
  async (id, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/board/${id}`, { token: getState().auth.token });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const createTodo = call(
  "todos/createTodo",
  async ({ workspaceId, values }, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/board/${workspaceId}/todos`, {
        method: "POST",
        token: getState().auth.token,
        body: values,
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateTodo = call(
  "todos/updateTodo",
  async ({ todoId, values }, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/board/todos/${todoId}`, {
        method: "PATCH",
        token: getState().auth.token,
        body: values,
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteTodo = call(
  "todos/deleteTodo",
  async (todoId, { getState, rejectWithValue }) => {
    try {
      const result = await apiRequest(`/board/todos/${todoId}`, {
        method: "DELETE",
        token: getState().auth.token,
      });
      return { todoId, message: result.message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const createTicket = call(
  "todos/createTicket",
  async ({ todoId, values }, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/board/todos/${todoId}/tickets`, {
        method: "POST",
        token: getState().auth.token,
        body: values,
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateTicket = call(
  "todos/updateTicket",
  async ({ ticketId, values }, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/board/tickets/${ticketId}`, {
        method: "PATCH",
        token: getState().auth.token,
        body: values,
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteTicket = call(
  "todos/deleteTicket",
  async ({ todoId, ticketId }, { getState, rejectWithValue }) => {
    try {
      const result = await apiRequest(`/board/tickets/${ticketId}`, {
        method: "DELETE",
        token: getState().auth.token,
      });
      return { todoId, ticketId, message: result.message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const persistTicketOrder = call(
  "todos/persistTicketOrder",
  async ({ workspaceId, columns }, { getState, rejectWithValue }) => {
    try {
      return await apiRequest(`/board/${workspaceId}/tickets/reorder`, {
        method: "PATCH",
        token: getState().auth.token,
        body: { columns },
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const initialState = {
  workspace: null,
  items: [],
  workspaceId: null,
  fetchStatus: "idle",
  createStatus: "idle",
  savingTodoIds: [],
  savingTicketIds: [],
  orderStatus: "idle",
  error: null,
};

const addSavingId = (list, id) => {
  const numericId = Number(id);
  if (!list.includes(numericId)) list.push(numericId);
};

const slice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    setTodos(state, action) {
      state.items = action.payload;
    },
    clearBoardError(state) {
      state.error = null;
    },
    resetTodos() {
      return initialState;
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(fetchBoard.pending, (state, action) => {
        const nextId = Number(action.meta.arg);
        if (state.workspaceId !== nextId) {
          state.workspace = null;
          state.items = [];
        }
        state.fetchStatus = "loading";
        state.workspaceId = nextId;
        state.error = null;
      })
      .addCase(fetchBoard.fulfilled, (state, action) => {
        state.fetchStatus = "succeeded";
        state.workspace = action.payload.workspace;
        state.items = action.payload.todos || [];
      })
      .addCase(fetchBoard.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.error = action.payload || "Unable to load this board.";
      })
      .addCase(createTodo.pending, (state) => {
        state.createStatus = "loading";
      })
      .addCase(createTodo.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.items.push(action.payload.todo);
      })
      .addCase(createTodo.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error = action.payload;
      })
      .addCase(updateTodo.pending, (state, action) =>
        addSavingId(state.savingTodoIds, action.meta.arg.todoId),
      )
      .addCase(updateTodo.fulfilled, (state, action) => {
        const id = Number(action.payload.todo.id);
        state.savingTodoIds = state.savingTodoIds.filter((item) => item !== id);
        const index = state.items.findIndex((todo) => Number(todo.id) === id);
        if (index !== -1)
          state.items[index] = {
            ...action.payload.todo,
            tickets: state.items[index].tickets,
          };
      })
      .addCase(updateTodo.rejected, (state, action) => {
        state.savingTodoIds = state.savingTodoIds.filter(
          (item) => item !== Number(action.meta.arg.todoId),
        );
        state.error = action.payload;
      })
      .addCase(deleteTodo.pending, (state, action) =>
        addSavingId(state.savingTodoIds, action.meta.arg),
      )
      .addCase(deleteTodo.fulfilled, (state, action) => {
        const id = Number(action.payload.todoId);
        state.savingTodoIds = state.savingTodoIds.filter((item) => item !== id);
        state.items = state.items.filter((todo) => Number(todo.id) !== id);
      })
      .addCase(deleteTodo.rejected, (state, action) => {
        state.savingTodoIds = state.savingTodoIds.filter(
          (item) => item !== Number(action.meta.arg),
        );
        state.error = action.payload;
      })
      .addCase(createTicket.pending, (state, action) =>
        addSavingId(state.savingTodoIds, action.meta.arg.todoId),
      )
      .addCase(createTicket.fulfilled, (state, action) => {
        const ticket = action.payload.ticket;
        state.savingTodoIds = state.savingTodoIds.filter(
          (item) => item !== Number(ticket.todoId),
        );
        state.items
          .find((todo) => Number(todo.id) === Number(ticket.todoId))
          ?.tickets.push(ticket);
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.savingTodoIds = state.savingTodoIds.filter(
          (item) => item !== Number(action.meta.arg.todoId),
        );
        state.error = action.payload;
      })
      .addCase(updateTicket.pending, (state, action) =>
        addSavingId(state.savingTicketIds, action.meta.arg.ticketId),
      )
      .addCase(updateTicket.fulfilled, (state, action) => {
        const ticket = action.payload.ticket;
        const id = Number(ticket.id);
        state.savingTicketIds = state.savingTicketIds.filter(
          (item) => item !== id,
        );
        for (const todo of state.items) {
          const index = todo.tickets.findIndex(
            (item) => Number(item.id) === id,
          );
          if (index !== -1) {
            todo.tickets[index] = ticket;
            break;
          }
        }
      })
      .addCase(updateTicket.rejected, (state, action) => {
        state.savingTicketIds = state.savingTicketIds.filter(
          (item) => item !== Number(action.meta.arg.ticketId),
        );
        state.error = action.payload;
      })
      .addCase(deleteTicket.pending, (state, action) =>
        addSavingId(state.savingTicketIds, action.meta.arg.ticketId),
      )
      .addCase(deleteTicket.fulfilled, (state, action) => {
        const id = Number(action.payload.ticketId);
        state.savingTicketIds = state.savingTicketIds.filter(
          (item) => item !== id,
        );
        const todo = state.items.find(
          (item) => Number(item.id) === Number(action.payload.todoId),
        );
        if (todo)
          todo.tickets = todo.tickets.filter(
            (ticket) => Number(ticket.id) !== id,
          );
      })
      .addCase(deleteTicket.rejected, (state, action) => {
        state.savingTicketIds = state.savingTicketIds.filter(
          (item) => item !== Number(action.meta.arg.ticketId),
        );
        state.error = action.payload;
      })
      .addCase(persistTicketOrder.pending, (state) => {
        state.orderStatus = "loading";
      })
      .addCase(persistTicketOrder.fulfilled, (state) => {
        state.orderStatus = "succeeded";
      })
      .addCase(persistTicketOrder.rejected, (state, action) => {
        state.orderStatus = "failed";
        state.error = action.payload;
      }),
});

export const { setTodos, clearBoardError, resetTodos } = slice.actions;
export default slice.reducer;

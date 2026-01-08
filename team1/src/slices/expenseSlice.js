import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { expenseApi } from "../api/expenseApi";

const initialState = {
  expenses: [],
  currentExpense: null,
  loading: false,
  error: null,
  pageResponse: null,
};

export const fetchExpenses = createAsyncThunk(
  "expense/fetchExpenses",
  async (params) => {
    const response = await expenseApi.getExpenses(params);
    return response.data;
  }
);

export const fetchExpense = createAsyncThunk("expense/fetchExpense", async (id) => {
  const response = await expenseApi.getExpense(id);
  return response.data;
});

export const createExpense = createAsyncThunk("expense/createExpense", async (data) => {
  const response = await expenseApi.createExpense(data);
  return response.data;
});

export const updateExpense = createAsyncThunk(
  "expense/updateExpense",
  async ({ id, data }) => {
    const response = await expenseApi.updateExpense(id, data);
    return response.data;
  }
);

export const deleteExpense = createAsyncThunk("expense/deleteExpense", async (id) => {
  await expenseApi.deleteExpense(id);
  return id;
});

export const submitExpense = createAsyncThunk(
  "expense/submitExpense",
  async ({ id, data }) => {
    const response = await expenseApi.submitExpense(id, data);
    return response.data;
  }
);

const expenseSlice = createSlice({
  name: "expense",
  initialState,
  reducers: {
    clearCurrentExpense: (state) => {
      state.currentExpense = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        console.log("✅ 지출 목록 조회 성공:", action.payload);
        console.log("📊 조회된 지출 내역 수:", action.payload.dtoList?.length || 0);
        state.expenses = action.payload.dtoList || [];
        state.pageResponse = action.payload;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        console.error("❌ 지출 목록 조회 실패:", action.error);
        state.error = action.error.message || "지출 내역 조회에 실패했습니다.";
      })
      .addCase(fetchExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExpense = action.payload;
      })
      .addCase(fetchExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "지출 내역 조회에 실패했습니다.";
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload);
        state.currentExpense = action.payload;
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        const index = state.expenses.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
        if (state.currentExpense?.id === action.payload.id) {
          state.currentExpense = action.payload;
        }
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter((e) => e.id !== action.payload);
        if (state.currentExpense?.id === action.payload) {
          state.currentExpense = null;
        }
      })
      .addCase(submitExpense.fulfilled, (state, action) => {
        const index = state.expenses.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
        if (state.currentExpense?.id === action.payload.id) {
          state.currentExpense = action.payload;
        }
      });
  },
});

export const { clearCurrentExpense, clearError } = expenseSlice.actions;
export default expenseSlice.reducer;


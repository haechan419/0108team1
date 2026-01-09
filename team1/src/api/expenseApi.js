import axiosInstance from "./axiosInstance";

export const expenseApi = {
  getExpenses: (params) => {
    return axiosInstance.get("/receipt/expenses/list", { params });
  },

  getExpense: (id) => {
    return axiosInstance.get(`/receipt/expenses/${id}`);
  },

  createExpense: (data) => {
    return axiosInstance.post("/receipt/expenses/", data);
  },

  updateExpense: (id, data) => {
    return axiosInstance.put(`/receipt/expenses/${id}`, data);
  },

  deleteExpense: (id) => {
    return axiosInstance.delete(`/receipt/expenses/${id}`);
  },

  submitExpense: (id, data) => {
    return axiosInstance.post(`/receipt/expenses/${id}/submit`, data);
  },
};


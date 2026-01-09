import jwtAxios from "../util/jwtUtil";
import { API_SERVER_HOST } from "../util/jwtUtil";

const prefix = `${API_SERVER_HOST}/api/approval-requests`;

// D:\uj\fullstack 패턴: 함수로 export
export const getApprovalRequests = async (params) => {
  const res = await jwtAxios.get(`${prefix}/list`, { params });
  return res.data;
};

export const getExpenseApprovals = async (params) => {
  const res = await jwtAxios.get(`${prefix}/types/expense`, { params });
  return res.data;
};

export const getProductApprovals = async (params) => {
  const res = await jwtAxios.get(`${prefix}/types/product`, { params });
  return res.data;
};

export const getApprovalRequest = async (id) => {
  const res = await jwtAxios.get(`${prefix}/${id}`);
  return res.data;
};

export const getApprovalLogs = async (id) => {
  const res = await jwtAxios.get(`${prefix}/${id}/logs`);
  return res.data;
};

export const actionApproval = async (id, data) => {
  const res = await jwtAxios.put(`${prefix}/${id}/action`, data);
  return res.data;
};

// 기존 코드와의 호환성을 위한 객체 export (점진적 마이그레이션)
export const approvalApi = {
  getApprovalRequests: (params) => {
    return jwtAxios.get(`${prefix}/list`, { params });
  },
  getExpenseApprovals: (params) => {
    return jwtAxios.get(`${prefix}/types/expense`, { params });
  },
  getProductApprovals: (params) => {
    return jwtAxios.get(`${prefix}/types/product`, { params });
  },
  getApprovalRequest: (id) => {
    return jwtAxios.get(`${prefix}/${id}`);
  },
  getApprovalLogs: (id) => {
    return jwtAxios.get(`${prefix}/${id}/logs`);
  },
  actionApproval: (id, data) => {
    return jwtAxios.put(`${prefix}/${id}/action`, data);
  },
};


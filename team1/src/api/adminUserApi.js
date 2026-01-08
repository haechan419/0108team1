import axiosInstance from "./axiosInstance";

// 사원 목록 조회
export const getUsers = async (params) => {
  const res = await axiosInstance.get("/admin/users", { params });
  return res.data;
};

// 사원 상세 조회
export const getUser = async (id) => {
  const res = await axiosInstance.get(`/admin/users/${id}`);
  return res.data;
};

// 사원 등록
export const createUser = async (data) => {
  const res = await axiosInstance.post("/admin/users", data);
  return res.data;
};

// 사원 수정
export const updateUser = async (id, data) => {
  const res = await axiosInstance.put(`/admin/users/${id}`, data); // ✅ PUT으로 수정
  return res.data;
};

// 퇴사 처리
export const resignUser = async (id) => {
  const res = await axiosInstance.put(`/admin/users/${id}/resign`);
  return res.data;
};

// 계정 잠금 해제
export const unlockUser = async (id) => {
  const res = await axiosInstance.put(`/admin/users/${id}/unlock`);
  return res.data;
};

export const adminUserApi = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  resignUser,
  unlockUser,
};

export default adminUserApi;

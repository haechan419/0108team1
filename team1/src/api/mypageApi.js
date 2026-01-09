import axiosInstance from "./axiosInstance";

// 내정보 조회
export const getMyInfo = async () => {
  const response = await axiosInstance.get("/mypage");
  return response.data;
};

// 월별 출결 조회
export const getMonthlyAttendance = async (year, month) => {
  const response = await axiosInstance.get("/mypage/attendance", {
    params: { year, month },
  });
  return response.data;
};

// 출근하기
export const checkIn = async () => {
  const response = await axiosInstance.post("/mypage/attendance/check-in");
  return response.data;
};

// 퇴근하기
export const checkOut = async () => {
  const response = await axiosInstance.post("/mypage/attendance/check-out");
  return response.data;
};

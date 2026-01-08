import axios from "axios";

// 백엔드 주소
export const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/products`;

// 1. 등록 (POST)
export const postAdd = async (productObj) => {
  const header = { headers: { "Content-Type": "multipart/form-data" } };
  const res = await axios.post(`${prefix}/`, productObj, header);
  return res.data;
};

// 2. 목록 조회 (GET) - 카테고리 필터 추가됨
export const getList = async (pageParam) => {
  const { page, size, category } = pageParam;

  // 파라미터 구성
  const params = { page: page, size: size };

  // 카테고리가 있고 'All'이 아닐 때만 파라미터에 추가
  if (category && category !== "All") {
    params.category = category;
  }

  const res = await axios.get(`${prefix}/list`, { params: params });
  return res.data;
};

// 3. 상세 조회 (GET)
export const getOne = async (pno) => {
  const res = await axios.get(`${prefix}/${pno}`);
  return res.data;
};

// 4. 수정 (PUT)
export const putOne = async (pno, productObj) => {
  const header = { headers: { "Content-Type": "multipart/form-data" } };
  const res = await axios.put(`${prefix}/${pno}`, productObj, header);
  return res.data;
};

// 5. 삭제 (DELETE)
export const deleteOne = async (pno) => {
  const res = await axios.delete(`${prefix}/${pno}`);
  return res.data;
};

// 👇 [NEW] 6. 순서 변경 (PUT)
export const putOrder = async (pnoList) => {
  // pnoList 예시: [5, 2, 1, 3, 4] (ID 배열)
  const res = await axios.put(`${prefix}/order`, pnoList);
  return res.data;
};

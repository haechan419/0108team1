import jwtAxios from "../util/jwtUtil";
import { API_SERVER_HOST } from "../util/jwtUtil";

const expensePrefix = `${API_SERVER_HOST}/api/receipt/expenses`;
const requestPrefix = `${API_SERVER_HOST}/api/requests`;

// 1. 지출결의(영수증) - 캐시 방지 적용
export const getMyExpenseNotifications = async () => {
  try {
    // 🚨 주소 뒤에 시간을 붙여서 매번 새로운 요청으로 인식시킴!
    const res = await jwtAxios.get(
      `${expensePrefix}/list?t=${new Date().getTime()}`
    );
    const data = res.data;

    if (data && Array.isArray(data.dtoList)) return data.dtoList;
    if (data && Array.isArray(data.content)) return data.content;
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    return [];
  }
};

// 2. 비품구매(주문) - 캐시 방지 적용
export const getMyOrderNotifications = async () => {
  try {
    // 🚨 여기도 시간 추가!
    const res = await jwtAxios.get(
      `${requestPrefix}/list?t=${new Date().getTime()}`
    );
    const data = res.data;

    if (data && Array.isArray(data.dtoList)) return data.dtoList;
    if (data && Array.isArray(data.content)) return data.content;
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    return [];
  }
};

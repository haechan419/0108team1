import axios from "axios";
import { getCookie, setCookie } from "./cookieUtil";

// API 서버 주소
export const API_SERVER_HOST = "http://localhost:8080";

// JWT용 axios 인스턴스 생성
const jwtAxios = axios.create();

/**
 * Refresh Token으로 새 Access Token 발급 요청
 */
const refreshJWT = async (accessToken, refreshToken) => {
  const header = { headers: { Authorization: `Bearer ${accessToken}` } };

  const res = await axios.get(
    `${API_SERVER_HOST}/api/auth/refresh?refreshToken=${refreshToken}`,
    header
  );

  console.log("토큰 갱신 완료:", res.data);
  return res.data;
};

/**
 * 요청 전 인터셉터
 * - 쿠키에서 토큰을 가져와 Authorization 헤더에 자동 첨부
 */
const beforeReq = (config) => {
  console.log("--- jwtAxios 요청 전 ---");

  const memberInfo = getCookie("member");

  // 로그인 정보가 없으면 에러
  if (!memberInfo) {
    console.log("로그인 정보 없음");
    return Promise.reject({
      response: {
        data: { error: "REQUIRE_LOGIN" },
      },
    });
  }

  const { accessToken } = memberInfo;

  // Authorization 헤더에 토큰 첨부
  config.headers.Authorization = `Bearer ${accessToken}`;

  return config;
};

/**
 * 요청 실패 인터셉터
 */
const requestFail = (err) => {
  console.log("--- jwtAxios 요청 에러 ---");
  return Promise.reject(err);
};

/**
 * 응답 전 인터셉터
 * - Access Token 만료 시 자동으로 갱신 후 원래 요청 재시도
 */
const beforeRes = async (res) => {
  console.log("--- jwtAxios 응답 전 ---");

  const data = res.data;

  // Access Token 만료 에러인 경우
  if (data && data.error === "ERROR_ACCESS_TOKEN") {
    console.log("Access Token 만료 - 갱신 시도");

    const memberCookieValue = getCookie("member");

    // Refresh Token으로 새 토큰 발급
    const result = await refreshJWT(
      memberCookieValue.accessToken,
      memberCookieValue.refreshToken
    );

    console.log("새 토큰 발급 완료:", result);

    // 쿠키에 새 토큰 저장
    memberCookieValue.accessToken = result.accessToken;
    memberCookieValue.refreshToken = result.refreshToken;
    setCookie("member", JSON.stringify(memberCookieValue), 1);

    // 원래 요청 재시도
    const originalRequest = res.config;
    originalRequest.headers.Authorization = `Bearer ${result.accessToken}`;

    return await axios(originalRequest);
  }

  return res;
};

/**
 * 응답 실패 인터셉터
 */
const responseFail = (err) => {
  console.log("--- jwtAxios 응답 에러 ---");
  return Promise.reject(err);
};

// 인터셉터 등록
jwtAxios.interceptors.request.use(beforeReq, requestFail);
jwtAxios.interceptors.response.use(beforeRes, responseFail);

export default jwtAxios;

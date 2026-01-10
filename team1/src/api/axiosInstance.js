// axiosInstance.js
import axios from "axios";
import { getCookie, removeCookie } from "../util/cookieUtil";

const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api",
    timeout: 10000,
    // ✅ 기본은 JSON, 단 로그인만 아래에서 override
    headers: { "Content-Type": "application/json" },
    withCredentials: false, // ✅ JSESSIONID 등 쿠키도 같이 쓰는 구조면 유지 (CORS allowCredentials=true라서 OK)
});

// ✅ 로그인/회원가입 같은 "토큰 없는 요청"인지 체크
const isAuthEndpoint = (url = "") => {
    // baseURL 이후 path 기준으로 들어오니까 "/auth/login" 같은 형태임
    return url.startsWith("/auth/");
};

// 요청 인터셉터
axiosInstance.interceptors.request.use(
    (config) => {
        const url = config.url || "";
        const method = (config.method || "GET").toUpperCase();

        console.log("[REQ]", method, (config.baseURL || "") + url);

        // ✅ /auth/** 는 토큰 붙이지 않음 (로그인 시점에 token 없거나 꼬이는 거 방지)
        if (!isAuthEndpoint(url)) {
            const memberInfo = getCookie("member");
            const token = memberInfo?.accessToken;

            console.log("[REQ token exists?]", !!token);
            if (token) {
                console.log("[REQ token head]", token.slice(0, 20) + "...");
                config.headers.Authorization = `Bearer ${token}`;
            }
        } else {
            console.log("[REQ auth endpoint] skip Authorization");
        }

        // ✅ 로그인 요청만 formLogin 호환으로 Content-Type 자동 변경
        // - 프론트에서 config.data를 URLSearchParams로 넣으면 자동으로 맞춰줌
        if (url === "/auth/login" && config.data instanceof URLSearchParams) {
            config.headers["Content-Type"] = "application/x-www-form-urlencoded";
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url || "";

        console.log("[RES ERR]", status, url, error.response?.data);

        // ✅ 로그인 요청이 401인 경우: 바로 튕기지 말고 화면에서 메시지 띄우게 둔다
        if (status === 401 && url === "/auth/login") {
            return Promise.reject(error);
        }

        if (status === 401) {
            removeCookie("member");
            window.location.href = "/";
        } else if (status === 403) {
            console.warn("권한이 없습니다:", error.response?.data);
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;

// axiosInstance.js
import axios from "axios";
import { removeCookie } from "../util/cookieUtil";
import { getAccessToken } from "../util/authToken"; // ✅ 추가

const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api",
    timeout: 10000,
    headers: { "Content-Type": "application/json" },
    withCredentials: false,
});

const isAuthEndpoint = (url = "") => url.startsWith("/auth/");

// ✅ WS에서도 똑같이 쓰도록 export
export function getAuthTokenForRequest() {
    return getAccessToken();
}

axiosInstance.interceptors.request.use(
    (config) => {
        const url = config.url || "";
        const method = (config.method || "GET").toUpperCase();

        console.log("[REQ]", method, (config.baseURL || "") + url);

        if (!isAuthEndpoint(url)) {
            const token = getAuthTokenForRequest();

            console.log("[REQ token exists?]", !!token);
            if (token) {
                console.log("[REQ token head]", token.slice(0, 20) + "...");
                config.headers.Authorization = `Bearer ${token}`;
            }
        } else {
            console.log("[REQ auth endpoint] skip Authorization");
        }

        if (url === "/auth/login" && config.data instanceof URLSearchParams) {
            config.headers["Content-Type"] = "application/x-www-form-urlencoded";
        }

        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url || "";

        console.log("[RES ERR]", status, url, error.response?.data);

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

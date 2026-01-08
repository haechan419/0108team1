import React from "react";
import { useNavigate } from "react-router-dom";
import useCustomLogin from "../../hooks/useCustomLogin";
import "../../styles/layout.css";
import NotificationBell from "../common/NotificationBell";

export default function Topbar() {
  const navigate = useNavigate();
  const { loginState, doLogout } = useCustomLogin();

  // 로그아웃 처리
  const handleLogout = () => {
    alert("로그아웃 성공.");
    doLogout();
    navigate("/");
  };

  return (
      <header className="topbar">
        <div className="topbar-left">
          {/*<button*/}
          {/*    className="logout-btn"*/}
          {/*    style={{ padding: "8px 24px", fontSize: "15px" }}*/}
          {/*    onClick={() => navigate("/report")}*/}
          {/*>*/}
          {/*  Report*/}
          {/*</button>*/}
        </div>

        <div className="topbar-right">
          <div className="user-profile">
            <div className="avatar-circle"></div>
            <div className="user-info">
              <div className="user-name">{loginState.name || "사용자"}님</div>
              <div className="user-dept">
                {loginState.departmentName || "부서없음"}
              </div>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            로그아웃
          </button>

          {/*<button className="icon-btn">⚙️</button>*/}
            {/* 👇 [변경] 기존의 단순 텍스트 종(🔔)을 지우고, '배지 기능이 있는 종'으로 교체했습니다. */}
            <div
                style={{ marginLeft: "10px", display: "flex", alignItems: "center" }}
            >
                <NotificationBell />
            </div>
        </div>
      </header>
  );
}

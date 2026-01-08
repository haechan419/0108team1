import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// 💡 가짜 알림 데이터 (나중에 백엔드 API에서 가져올 부분)
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "approval",
    message: "강진수님이 '맥북 프로' 승인을 요청했습니다.",
    time: "방금 전",
  },
  {
    id: 2,
    type: "stock",
    message: "⚠ '맥심 모카골드' 재고가 10개 미만입니다.",
    time: "10분 전",
  },
  {
    id: 3,
    type: "info",
    message: "3월 회계 마감일이 다가옵니다.",
    time: "1시간 전",
  },
];

const NotificationBell = () => {
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0); // 안 읽은 개수
  const [isOpen, setIsOpen] = useState(false); // 드롭다운 열림 여부
  const [notifications, setNotifications] = useState([]); // 알림 목록

  // 초기 데이터 로드 (시뮬레이션)
  useEffect(() => {
    setTimeout(() => {
      setUnreadCount(MOCK_NOTIFICATIONS.length);
      setNotifications(MOCK_NOTIFICATIONS);
    }, 1000);
  }, []);

  // 🔔 종 클릭 핸들러
  const handleBellClick = () => {
    if (!isOpen) {
      // 열릴 때: 배지를 없애고(0), 창을 연다.
      setUnreadCount(0);
      setIsOpen(true);
    } else {
      // 닫을 때
      setIsOpen(false);
    }
  };

  // 알림 항목 클릭 시 이동 로직
  const handleItemClick = (type) => {
    setIsOpen(false); // 창 닫기
    if (type === "approval")
      navigate("/admin/product-approval"); // 승인 페이지로
    else if (type === "stock") navigate("/admin/shop"); // 재고 페이지로
    else navigate("/history"); // 그 외
  };

  return (
    <div style={{ position: "relative" }}>
      {/* 1. 투명 배경 (창 열렸을 때 바깥 클릭하면 닫히게 하는 역할) */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 998,
            cursor: "default",
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 2. 종 아이콘 */}
      <div
        onClick={handleBellClick}
        style={{
          position: "relative",
          cursor: "pointer",
          padding: "5px",
          zIndex: 999,
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill={isOpen ? "#333" : "none"} // 열리면 색 채우기
          stroke="#555"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "fill 0.3s" }}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>

        {/* 🔴 빨간 배지 (count가 있을 때만) */}
        {unreadCount > 0 && (
          <span style={badgeStyle}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      {/* 3. 드롭다운 알림창 (애니메이션 적용) */}
      <div
        style={{
          ...dropdownStyle,
          opacity: isOpen ? 1 : 0,
          transform: isOpen
            ? "translateY(0) scale(1)"
            : "translateY(-10px) scale(0.95)",
          pointerEvents: isOpen ? "auto" : "none", // 닫혀있을 땐 클릭 방지
        }}
      >
        <div style={dropdownHeaderStyle}>알림</div>

        <ul style={listStyle}>
          {notifications.length === 0 ? (
            <li style={{ padding: "20px", color: "#999", textAlign: "center" }}>
              새로운 알림이 없습니다.
            </li>
          ) : (
            notifications.map((note) => (
              <li
                key={note.id}
                style={listItemStyle}
                onClick={() => handleItemClick(note.type)}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f9f9f9")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "white")
                }
              >
                <div
                  style={{
                    fontSize: "13px",
                    color: "#333",
                    marginBottom: "4px",
                  }}
                >
                  {note.type === "stock" && (
                    <span style={{ color: "red", fontWeight: "bold" }}>
                      [긴급]{" "}
                    </span>
                  )}
                  {note.message}
                </div>
                <div style={{ fontSize: "11px", color: "#aaa" }}>
                  {note.time}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

// --- ✨ 스타일 정의 (CSS-in-JS) ---

const badgeStyle = {
  position: "absolute",
  top: "0px",
  right: "0px",
  backgroundColor: "#ff3b30",
  color: "white",
  fontSize: "10px",
  fontWeight: "bold",
  borderRadius: "50%",
  minWidth: "16px",
  height: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2px",
  border: "2px solid white",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  animation: "pop 0.3s ease-out", // 톡 튀어나오는 효과 (필요 시 keyframes 추가)
};

const dropdownStyle = {
  position: "absolute",
  top: "40px",
  right: "-10px",
  width: "300px",
  backgroundColor: "white",
  borderRadius: "12px",
  boxShadow: "0 5px 20px rgba(0,0,0,0.15)",
  border: "1px solid #eee",
  zIndex: 1000,
  overflow: "hidden",
  transition: "all 0.2s cubic-bezier(0.165, 0.84, 0.44, 1)", // 애플 스타일의 부드러운 물리 효과
  transformOrigin: "top right", // 오른쪽 위에서부터 펼쳐짐
};

const dropdownHeaderStyle = {
  padding: "12px 16px",
  borderBottom: "1px solid #eee",
  fontWeight: "bold",
  fontSize: "14px",
  color: "#333",
  backgroundColor: "#fff",
};

const listStyle = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  maxHeight: "300px",
  overflowY: "auto",
};

const listItemStyle = {
  padding: "12px 16px",
  borderBottom: "1px solid #f5f5f5",
  cursor: "pointer",
  transition: "background 0.2s",
};

export default NotificationBell;

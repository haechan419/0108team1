import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  checkMyNotification,
  removeNotification,
} from "../../slices/notificationSlice";

const NotificationBell = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isOpen, setIsOpen] = useState(false);
  const { items: notifications } = useSelector((state) => state.notification);

  useEffect(() => {
    dispatch(checkMyNotification());
    const interval = setInterval(() => {
      dispatch(checkMyNotification());
    }, 5000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleItemClick = (item) => {
    dispatch(removeNotification(item.id));
    setIsOpen(false);

    if (item.notiType === "ORDER") {
      navigate("/history");
    } else {
      navigate("/expenses");
    }
  };

  // 🎨 글자 색상 결정 함수
  const getTitleColor = (note) => {
    const title = note.title || "";
    // 보완, 반려, 보류 등은 빨간색/주황색 계열로 강조!
    if (
      title.includes("보완") ||
      title.includes("반려") ||
      title.includes("보류")
    ) {
      return "#e67e22"; // 주황색 (눈에 확 띔)
    }
    // 기존 색상 유지
    return note.notiType === "ORDER" ? "#2980b9" : "#27ae60";
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: "relative", cursor: "pointer", padding: "8px" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill={isOpen ? "#333" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {notifications.length > 0 && (
          <span style={badgeStyle}>{notifications.length}</span>
        )}
      </div>

      {isOpen && (
        <>
          <div style={overlayStyle} onClick={() => setIsOpen(false)} />
          <div style={dropdownStyle}>
            <div style={headerStyle}>알림 센터</div>
            <ul style={listStyle}>
              {notifications.length === 0 ? (
                <li style={emptyItemStyle}>새로운 알림이 없습니다.</li>
              ) : (
                notifications.map((note) => (
                  <li
                    key={note.id}
                    style={itemStyle}
                    onClick={() => handleItemClick(note)}
                  >
                    {/* ✨ 색상 로직 적용됨 */}
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "13px",
                        marginBottom: "4px",
                        color: getTitleColor(note),
                      }}
                    >
                      {note.title}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#aaa",
                        marginTop: "4px",
                        textAlign: "right",
                      }}
                    >
                      {note.displayDate
                        ? new Date(note.displayDate).toLocaleDateString()
                        : ""}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

// 스타일 (기존 유지)
const badgeStyle = {
  position: "absolute",
  top: 0,
  right: 0,
  backgroundColor: "#e74c3c",
  color: "white",
  fontSize: "11px",
  fontWeight: "bold",
  borderRadius: "50%",
  padding: "2px 5px",
  border: "2px solid white",
};
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  zIndex: 998,
};
const dropdownStyle = {
  position: "absolute",
  top: "45px",
  right: "-10px",
  width: "280px",
  backgroundColor: "white",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  border: "1px solid #eee",
  zIndex: 999,
  overflow: "hidden",
};
const headerStyle = {
  padding: "12px",
  borderBottom: "1px solid #f0f0f0",
  fontWeight: "bold",
  backgroundColor: "#f9fafb",
};
const listStyle = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  maxHeight: "300px",
  overflowY: "auto",
};
const itemStyle = {
  padding: "12px",
  borderBottom: "1px solid #f0f0f0",
  cursor: "pointer",
  transition: "background 0.2s",
};
const emptyItemStyle = {
  padding: "20px",
  textAlign: "center",
  color: "#999",
  fontSize: "13px",
};

export default NotificationBell;

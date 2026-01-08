import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useCustomLogin from "../../hooks/useCustomLogin";
import { useFloatingAI } from "../../context/FloatingAIContext";
import "../../styles/layout.css";
import NotificationBell from "../common/NotificationBell";
import ChatDrawer from "../chat/ChatDrawer";
import { chatApi } from "../../api/chatApi";

export default function Topbar() {
  const navigate = useNavigate();
  const { loginState, doLogout } = useCustomLogin();
  const { setOpen: openAI } = useFloatingAI();

  const [chatOpen, setChatOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState(null);

  const [rooms, setRooms] = useState([]);
  const [roomsOpen, setRoomsOpen] = useState(false);

  const handleLogout = () => {
    alert("로그아웃 성공.");
    doLogout();
    navigate("/");
  };

  // ✅ 팝오버 표시용 제목: partnerName 우선
  const buildRoomTitle = useCallback((r) => {
    const partner = (r?.partnerName ?? "").toString().trim();
    if (partner && partner.toLowerCase() !== "null") return partner;

    const t = (r?.title ?? r?.name ?? "").toString().trim();
    if (t && t.toLowerCase() !== "null") return t;

    const rid = r?.roomId ?? r?.id;
    return `Room ${rid ?? "?"}`;
  }, []);

  // ✅ rooms 로딩 함수로 분리(필요하면 이후 "새 채팅 생성 후 갱신"에도 재사용 가능)
  const loadRooms = useCallback(async () => {
    try {
      const data = await chatApi.getRooms();
      setRooms(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("❌ rooms fetch failed", e);
      setRooms([]);
    }
  }, []);

  useEffect(() => {
    if (!loginState?.employeeNo) return;
    loadRooms();
  }, [loginState?.employeeNo, loadRooms]);

  const openRoom = (roomId) => {
    setActiveRoomId(String(roomId));
    setChatOpen(true);
    setRoomsOpen(false);
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <button
            className="ai-topbar-btn"
            onClick={() => openAI(true)}
            aria-label="Open AI assistant"
            title="AI Assistant"
            type="button"
          >
            AI
          </button>
        </div>

        <div className="topbar-right">
          <div className="user-profile">
            <div className="avatar-circle">
              {loginState?.thumbnailUrl || loginState?.profileImageUrl ? (
                <img
                  src={`http://localhost:8080${
                    loginState.thumbnailUrl || loginState.profileImageUrl
                  }`}
                  alt="프로필 이미지"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span style={{ fontSize: "18px" }}>👤</span>
              )}
            </div>
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

          <div
            style={{
              marginLeft: "10px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <NotificationBell />
          </div>

          {/* 💬 버튼: 방 목록 토글 */}
          <div style={{ position: "relative" }}>
            <button
              className="topIconBtn"
              onClick={() => {
                setRoomsOpen((v) => !v);
                // 열 때 한 번 최신화(가벼움). 싫으면 제거해도 됨.
                if (!roomsOpen) loadRooms();
              }}
              aria-label="Open chat"
              title="Chat"
              type="button"
            >
              💬
            </button>

            {roomsOpen && (
              <div className="chatRoomsPopover">
                {rooms.length === 0 ? (
                  <div className="chatRoomsEmpty">채팅방 없음</div>
                ) : (
                  rooms.map((r) => {
                    const rid = r.roomId ?? r.id;
                    const label = buildRoomTitle(r);

                    return (
                      <button
                        key={rid}
                        className="chatRoomItem"
                        onClick={() => openRoom(rid)}
                        type="button"
                        title={label}
                      >
                        {label}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <ChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        roomId={activeRoomId}
        onChangeRoom={(rid) => {
          console.log("[TOPBAR] onChangeRoom =", rid);
          setActiveRoomId(String(rid));
          setChatOpen(true);
          setRoomsOpen(false);
          // 방 바꿀 때도 목록 최신화(선택)
          loadRooms();
        }}
      />
    </>
  );
}

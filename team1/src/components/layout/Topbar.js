import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useCustomLogin from "../../hooks/useCustomLogin";
import "../../styles/layout.css";
import NotificationBell from "../common/NotificationBell";
import ChatDrawer from "../chat/ChatDrawer";
import { chatApi } from "../../api/chatApi";

// ✅ B안이면 Topbar에서 FloatingAI 렌더할 필요 없음 (AppInner에 전역 FloatingAI가 있으니까)
// import FloatingAI from "../../pages/FloatingAI";

export default function Topbar() {
    const navigate = useNavigate();
    const { loginState, doLogout } = useCustomLogin();

    const [chatOpen, setChatOpen] = useState(false);
    const [activeRoomId, setActiveRoomId] = useState(null);

    const [rooms, setRooms] = useState([]);
    const [roomsOpen, setRoomsOpen] = useState(false);
    const [scrollToMessageId, setScrollToMessageId] = useState(null);

    // ✅ rooms=0일 때 NewChatModal 자동 오픈
    const [autoOpenNewChat, setAutoOpenNewChat] = useState(false);

    const handleLogout = () => {
        alert("로그아웃 성공.");
        doLogout();
        navigate("/");
    };

    const buildRoomTitle = useCallback((r) => {
        const partner = (r?.partnerName ?? "").toString().trim();
        if (partner && partner.toLowerCase() !== "null") return partner;

        const t = (r?.title ?? r?.name ?? "").toString().trim();
        if (t && t.toLowerCase() !== "null") return t;

        const rid = r?.roomId ?? r?.id;
        return `Room ${rid ?? "?"}`;
    }, []);

    const loadRooms = useCallback(async () => {
        try {
            const data = await chatApi.getRooms();
            const list = Array.isArray(data) ? data : [];
            setRooms(list);
            return list;
        } catch (e) {
            console.error("❌ rooms fetch failed", e);
            setRooms([]);
            return [];
        }
    }, []);

    useEffect(() => {
        if (!loginState?.employeeNo) return;
        loadRooms();
    }, [loginState?.employeeNo, loadRooms]);

    const openRoom = useCallback((roomId) => {
        if (roomId == null) return;

        setActiveRoomId(String(roomId));
        setChatOpen(true);
        setRoomsOpen(false);
        setAutoOpenNewChat(false);
        setScrollToMessageId(null); // ✅ 일반 클릭은 스크롤 타깃 없음
    }, []);

    // ✅ AI/이벤트/직접호출 모두를 처리하는 단일 진입점
    const handleOpenRoom = useCallback((arg) => {
        const roomId = typeof arg === "object" && arg !== null ? arg.roomId : arg;
        const messageId =
            typeof arg === "object" && arg !== null ? arg.messageId : null;

        if (roomId == null) return;

        console.log("[AI->OPEN]", { roomId, messageId });

        setChatOpen(true);
        setActiveRoomId(String(roomId));
        setRoomsOpen(false);
        setAutoOpenNewChat(false);
        setScrollToMessageId(messageId != null ? String(messageId) : null);
    }, []);

    // ✅ B안: 전역 FloatingAI(Prop 없음) → 이벤트로 방 이동
    useEffect(() => {
        const handler = (e) => {
            // CustomEvent detail 기대: { roomId, messageId }
            handleOpenRoom(e?.detail);
        };

        window.addEventListener("ai-open-room", handler);
        return () => window.removeEventListener("ai-open-room", handler);
    }, [handleOpenRoom]);

    return (
        <>
            <header className="topbar">
                <div className="topbar-left"></div>

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

                    <div style={{ marginLeft: "10px", display: "flex", alignItems: "center" }}>
                        <NotificationBell />
                    </div>

                    {/* 💬 버튼 */}
                    <div style={{ position: "relative" }}>
                        <button
                            className="topIconBtn"
                            onClick={async () => {
                                if (chatOpen) {
                                    setRoomsOpen(false);
                                    return;
                                }

                                const list = await loadRooms();

                                if (list.length === 0) {
                                    setRoomsOpen(false);
                                    setChatOpen(true);
                                    setActiveRoomId(null);
                                    setAutoOpenNewChat(true);
                                    setScrollToMessageId(null);
                                    return;
                                }

                                setAutoOpenNewChat(false);
                                setRoomsOpen((v) => !v);
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

            {/* ✅ B안이면 여기서 FloatingAI 렌더하지 않음 (AppInner 전역 FloatingAI가 이벤트를 쏨) */}
            {/* <FloatingAI onOpenRoom={handleOpenRoom} /> */}

            {/* ✅ 채팅 UI는 Drawer 하나로만 */}
            <ChatDrawer
                open={chatOpen}
                onClose={() => {
                    setChatOpen(false);
                    setAutoOpenNewChat(false);
                    setScrollToMessageId(null);
                }}
                roomId={activeRoomId}
                scrollToMessageId={scrollToMessageId}
                autoOpenNewChat={autoOpenNewChat}
                onChangeRoom={(rid) => {
                    console.log("[TOPBAR] onChangeRoom =", rid);
                    setActiveRoomId(String(rid));
                    setChatOpen(true);
                    setRoomsOpen(false);
                    setAutoOpenNewChat(false);
                    setScrollToMessageId(null);
                    loadRooms();
                }}
                onRoomsChanged={() => loadRooms()}
            />
        </>
    );
}

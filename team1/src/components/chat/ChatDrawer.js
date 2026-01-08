import { useEffect, useState, useCallback } from "react";
import ChatPanel from "./ChatPanel";
import NewChatModal from "./NewChatModal";
import "../../styles/chatDrawer.css";

export default function ChatDrawer({
                                       open,
                                       onClose,
                                       roomId,
                                       onChangeRoom,
                                       autoOpenNewChat,     // ✅ 추가
                                       onRoomsChanged,      // ✅ (선택) 방 생성/삭제 후 Topbar 갱신 콜백
                                   }) {
    const [newChatOpen, setNewChatOpen] = useState(false);

    // ✅ autoOpenNewChat가 true면 모달 강제 오픈
    useEffect(() => {
        if (!open) return;
        if (autoOpenNewChat) setNewChatOpen(true);
    }, [open, autoOpenNewChat]);

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                if (newChatOpen) setNewChatOpen(false);
                else onClose?.();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose, newChatOpen]);

    const handleCreated = useCallback(
        (createdRoomId) => {
            console.log("[DRAWER] onCreated roomId=", createdRoomId);
            onChangeRoom?.(createdRoomId);
            setNewChatOpen(false);
            onRoomsChanged?.(); // ✅ 상단 rooms도 갱신
        },
        [onChangeRoom, onRoomsChanged]
    );

    if (!open) return null;

    return (
        <div className="chatOverlay" onMouseDown={onClose}>
            <div className="chatDrawer" onMouseDown={(e) => e.stopPropagation()}>
                <div className="chatDrawerHeader">
                    <div className="chatDrawerTitle">Chat</div>

                    <div className="chatDrawerActions">
                        <button
                            className="chatNewBtn"
                            onClick={() => setNewChatOpen(true)}
                            title="새 채팅"
                            type="button"
                        >
                            ＋
                        </button>

                        <button className="chatCloseBtn" onClick={onClose} aria-label="Close chat" type="button">
                            ✕
                        </button>
                    </div>
                </div>

                <div className="chatDrawerBody">
                    {roomId ? (
                        <ChatPanel key={roomId} roomId={roomId} />
                    ) : (
                        <div className="chatEmpty">대화를 선택하거나 새 채팅을 시작하세요</div>
                    )}
                </div>

                <NewChatModal
                    open={newChatOpen}
                    onClose={() => setNewChatOpen(false)}
                    onCreated={handleCreated}
                />
            </div>
        </div>
    );
}

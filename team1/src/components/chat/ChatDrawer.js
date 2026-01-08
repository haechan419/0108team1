import { useEffect, useState, useCallback } from "react";
import ChatPanel from "./ChatPanel";
import NewChatModal from "./NewChatModal";
import "../../styles/chatDrawer.css";

export default function ChatDrawer({ open, onClose, roomId, onChangeRoom }) {
    const [newChatOpen, setNewChatOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        console.log("[DRAWER] props roomId =", roomId);

        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                if (newChatOpen) setNewChatOpen(false);
                else onClose?.();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose, newChatOpen]);

    const handleCreated = useCallback((createdRoomId) => {
        console.log("[DRAWER] onCreated roomId=", createdRoomId);
        onChangeRoom?.(createdRoomId);
        setNewChatOpen(false);
    }, [onChangeRoom]);


    if (!open) return null;

    return (
        <div className="chatOverlay" onMouseDown={onClose}>
            <div className="chatDrawer" onMouseDown={(e) => e.stopPropagation()}>
                {/* ===== Header ===== */}
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

                        <button
                            className="chatCloseBtn"
                            onClick={onClose}
                            aria-label="Close chat"
                            type="button"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* ===== Body ===== */}
                <div className="chatDrawerBody">
                    {roomId ? (
                        <ChatPanel key={roomId} roomId={roomId} />
                    ) : (
                        <div className="chatEmpty">대화를 선택하거나 새 채팅을 시작하세요</div>
                    )}
                </div>

                {/* ===== New Chat Modal ===== */}
                <NewChatModal
                    open={newChatOpen}
                    onClose={() => setNewChatOpen(false)}
                    onCreated={handleCreated}
                />
            </div>
        </div>
    );
}

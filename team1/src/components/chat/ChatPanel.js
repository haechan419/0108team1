import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { chatApi } from "../../api/chatApi";
import RoomList from "./RoomList";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import "../../styles/chatPanel.css";
import { connectChatSocket, disconnectChatSocket, subscribeRoom, unsubscribeRoom } from "../../ws/chatSocket";

export default function ChatPanel({ roomId }) {
    const [otherLastReadMessageId, setOtherLastReadMessageId] = useState(null);

    const [rooms, setRooms] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [err, setErr] = useState("");

    const selectedRoomIdRef = useRef(null);

    const selectedRoom = useMemo(() => {
        if (!selectedRoomId) return null;
        return rooms.find((r) => String(r.roomId ?? r.id) === String(selectedRoomId));
    }, [rooms, selectedRoomId]);

    const roomTitle = selectedRoom?.partnerName || "(알 수 없음)";

    const latestMessageId = useMemo(() => {
        if (!messages?.length) return null;
        return Math.max(...messages.map((m) => m.messageId ?? m.id));
    }, [messages]);

    const loadRooms = useCallback(async () => {
        try {
            const data = await chatApi.getRooms();
            const list = Array.isArray(data) ? data : [];
            setRooms(list);

            setSelectedRoomId((prev) => {
                if (roomId != null) return String(roomId);
                if (prev) return prev;
                const first = list.length ? (list[0].roomId ?? list[0].id) : null;
                return first != null ? String(first) : null;
            });
        } catch (e) {
            setErr(e?.response?.data?.message || e.message || "방 목록 로딩 실패");
        }
    }, [roomId]);

    const loadMessagesOnce = useCallback(async (rid) => {
        if (!rid) return;
        try {
            const data = await chatApi.getMessages(rid, { limit: 30 });
            setMessages(Array.isArray(data) ? data : []);
        } catch (e) {
            setErr(e?.response?.data?.message || e.message || "메시지 로딩 실패");
            setMessages([]);
        }
    }, []);

    const loadRoomMeta = useCallback(async (rid) => {
        if (!rid) return;
        try {
            const meta = await chatApi.getRoomMeta(rid);
            setOtherLastReadMessageId(meta?.otherLastReadMessageId ?? null);
        } catch {
            setOtherLastReadMessageId(null);
        }
    }, []);

    // 1) 최초 rooms 로딩
    useEffect(() => {
        loadRooms();
    }, [loadRooms]);

    // 2) 부모 roomId 바뀌면 선택 반영
    useEffect(() => {
        if (roomId == null) return;
        setSelectedRoomId(String(roomId));
    }, [roomId]);

    // 3) 방 선택 시: REST로 최초 한번 로딩 + WS 구독
    useEffect(() => {
        if (!selectedRoomId) return;

        selectedRoomIdRef.current = selectedRoomId;

        // ✅ 최초 1회만 REST로 가져오고
        loadMessagesOnce(selectedRoomId);
        loadRoomMeta(selectedRoomId);

        // ✅ 이후부터는 WS로 메시지 받기
        const jwt = localStorage.getItem("jwt"); // 너 프로젝트에 맞춰
        connectChatSocket(jwt);

        // 구독
        subscribeRoom(selectedRoomId, (incoming) => {
            // 서버 payload 형태가 다를 수 있으니 normalize
            const msg = {
                messageId: incoming.messageId ?? incoming.id,
                roomId: incoming.roomId ?? selectedRoomIdRef.current,
                senderId: incoming.senderId,
                content: incoming.content,
                createdAt: incoming.createdAt,
            };
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            unsubscribeRoom(selectedRoomId);
            // drawer 닫힐 때 끊고 싶으면 ChatDrawer에서 disconnectChatSocket() 호출하는 게 더 깔끔
        };
    }, [selectedRoomId, loadMessagesOnce, loadRoomMeta]);

    // 4) 읽음 처리
    useEffect(() => {
        if (!selectedRoomId || !latestMessageId) return;

        chatApi.updateRead(selectedRoomId, latestMessageId).catch(() => {});
        setRooms((prev) =>
            prev.map((r) => {
                const rid = String(r.roomId ?? r.id);
                return rid === String(selectedRoomId) ? { ...r, unreadCount: 0 } : r;
            })
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [latestMessageId, selectedRoomId]);

    const handleSend = async (text) => {
        if (!selectedRoomId) return;
        setErr("");

        try {
            const saved = await chatApi.sendMessage(selectedRoomId, text);

            const normalized = {
                messageId: saved.messageId ?? saved.id,
                roomId: saved.roomId,
                senderId: saved.senderId,
                content: saved.content,
                createdAt: saved.createdAt,
            };

            // ⚠️ 서버가 브로드캐스트도 해주면 “중복 append” 될 수 있음
            //    - 중복 방지하려면 아래처럼 set에 기반한 de-dupe 필요
            setMessages((prev) => [...prev, normalized]);

            loadRooms(); // rooms 전역 이벤트가 없으니 전송 후만 갱신
        } catch (e) {
            setErr(e?.response?.data?.message || e.message || "전송 실패");
        }
    };

    return (
        <div className="chatPanelShell">
            <aside className="chatPanelLeft">
                <div className="chatPanelSearch">
                    <input placeholder="대화 검색 (MVP)" />
                </div>

                <RoomList
                    rooms={rooms}
                    selectedRoomId={selectedRoomId}
                    onSelect={setSelectedRoomId}
                    onDeleted={(deletedId) => {
                        setRooms((prev) => prev.filter((r) => String(r.roomId ?? r.id) !== String(deletedId)));

                        if (String(selectedRoomId) === String(deletedId)) {
                            const remain = rooms.filter((r) => String(r.roomId ?? r.id) !== String(deletedId));
                            const next = remain.length ? (remain[0].roomId ?? remain[0].id) : null;
                            setSelectedRoomId(next != null ? String(next) : null);
                            setMessages([]);
                        }
                    }}
                />
            </aside>

            <main className="chatPanelRight">
                <div className="chatPanelTop">
                    <div className="chatPanelRoomTitle">{selectedRoomId ? roomTitle : "방을 선택하세요"}</div>
                    <button className="miniBtn" onClick={loadRooms}>↻</button>
                </div>

                {err && <div className="chatErr">{err}</div>}

                <MessageList messages={messages} otherLastReadMessageId={otherLastReadMessageId} />
                <MessageInput disabled={!selectedRoomId} onSend={handleSend} />
            </main>
        </div>
    );
}

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { chatApi } from "../../api/chatApi";
import RoomList from "./RoomList";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import "../../styles/chatPanel.css";
import {
    connectChatSocket,
    disconnectChatSocket,
    subscribeRoom,
    unsubscribeRoom,
    subscribeRooms,
    sendRoomMessage,
} from "../../ws/chatSocket";

export default function ChatPanel({ roomId, scrollToMessageId }) {
    const prevRoomIdRef = useRef(null);
    const selectedRoomIdRef = useRef(null);

    const [otherLastReadMessageId, setOtherLastReadMessageId] = useState(null);

    const [rooms, setRooms] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [err, setErr] = useState("");

    // ✅ 중복 방지용 (messageId 기반)
    const seenIdsRef = useRef(new Set());

    // ✅ 스크롤 요청 저장 (room 이동과 스크롤을 분리하기 위해)
    const scrollReqRef = useRef(null); // { roomId: "18", messageId: "1234" }

    // ===== helpers =====
    const toMillis = (v) => {
        if (!v) return 0;
        if (typeof v === "number") return v;
        const t = Date.parse(v);
        return Number.isNaN(t) ? 0 : t;
    };

    const normalizeMessages = useCallback((list) => {
        const arr = Array.isArray(list) ? list : [];
        const mapped = arr.map((m) => ({ ...m, messageId: m.messageId ?? m.id }));

        // ✅ 최신이 위(큰 id가 먼저) = 내림차순
        mapped.sort((a, b) => (b.messageId ?? 0) - (a.messageId ?? 0));
        return mapped;
    }, []);


    const hasMessageId = useCallback((list, targetId) => {
        const t = String(targetId);
        return (list || []).some((m) => String(m.messageId ?? m.id) === t);
    }, []);

    const scrollToDomMessage = useCallback((targetId) => {
        const id = String(targetId);
        requestAnimationFrame(() => {
            const el = document.getElementById(`msg-${id}`);
            if (!el) return;

            el.scrollIntoView({ behavior: "smooth", block: "center" });

            // 하이라이트
            el.classList.add("chat-msg-highlight");
            setTimeout(() => el.classList.remove("chat-msg-highlight"), 1800);
        });
    }, []);

    const selectedRoom = useMemo(() => {
        if (!selectedRoomId) return null;
        return rooms.find((r) => String(r.roomId ?? r.id) === String(selectedRoomId));
    }, [rooms, selectedRoomId]);

    const roomTitle = selectedRoom?.partnerName || "(알 수 없음)";

    const latestMessageId = useMemo(() => {
        if (!messages?.length) return null;
        return Math.max(...messages.map((m) => m.messageId ?? m.id));
    }, [messages]);

    // ===== API loaders =====
    const loadRooms = useCallback(async () => {
        try {
            const data = await chatApi.getRooms();
            const raw = Array.isArray(data) ? data : [];

            const sorted = [...raw].sort((a, b) => {
                const atA =
                    toMillis(a.lastCreatedAt) ||
                    toMillis(a.lastMessageCreatedAt) ||
                    toMillis(a.updatedAt);

                const atB =
                    toMillis(b.lastCreatedAt) ||
                    toMillis(b.lastMessageCreatedAt) ||
                    toMillis(b.updatedAt);

                return atB - atA;
            });

            setRooms(sorted);

            setSelectedRoomId((prev) => {
                if (roomId != null) return String(roomId);
                if (prev) return prev;
                const first = sorted.length ? (sorted[0].roomId ?? sorted[0].id) : null;
                return first != null ? String(first) : null;
            });
        } catch (e) {
            setErr(e?.response?.data?.message || e.message || "방 목록 로딩 실패");
        }
    }, [roomId]);

    const loadMessagesOnce = useCallback(
        async (rid, opts = {}) => {
            if (!rid) return [];
            try {
                const data = await chatApi.getMessages(rid, { limit: 30, ...opts });
                const list = normalizeMessages(data);

                setMessages(list);

                // ✅ seenIds 갱신
                const next = new Set();
                for (const m of list) next.add(String(m.messageId ?? m.id));
                seenIdsRef.current = next;

                return list;
            } catch (e) {
                setErr(e?.response?.data?.message || e.message || "메시지 로딩 실패");
                setMessages([]);
                seenIdsRef.current = new Set();
                return [];
            }
        },
        [normalizeMessages]
    );

    const loadRoomMeta = useCallback(async (rid) => {
        if (!rid) return;
        try {
            const meta = await chatApi.getRoomMeta(rid);
            setOtherLastReadMessageId(meta?.otherLastReadMessageId ?? null);
        } catch {
            setOtherLastReadMessageId(null);
        }
    }, []);

    // ✅ 메시지 요약 텍스트 만들기 (첨부-only면 📎 파일)
    const summarizeIncoming = useCallback((incoming) => {
        const text = (incoming?.content ?? "").trim();
        if (text) return text;

        const hasAtt = Array.isArray(incoming?.attachments) && incoming.attachments.length > 0;
        if (hasAtt) {
            if (incoming.attachments.length === 1) return "📎 파일 1개";
            return `📎 파일 ${incoming.attachments.length}개`;
        }
        return "…";
    }, []);

    // ✅ rooms를 로컬에서 즉시 갱신 + 맨 위로 올림
    const bumpRoomByIncoming = useCallback(
        (incoming) => {
            const rid = String(incoming.roomId);
            const createdAt = incoming.createdAt ?? new Date().toISOString();
            const lastContent = summarizeIncoming(incoming);

            setRooms((prev) => {
                const next = prev.map((r) => {
                    const rId = String(r.roomId ?? r.id);
                    if (rId !== rid) return r;

                    return {
                        ...r,
                        lastContent,
                        lastCreatedAt: createdAt,
                    };
                });

                next.sort((a, b) => {
                    const atA =
                        toMillis(a.lastCreatedAt) ||
                        toMillis(a.lastMessageCreatedAt) ||
                        toMillis(a.updatedAt);

                    const atB =
                        toMillis(b.lastCreatedAt) ||
                        toMillis(b.lastMessageCreatedAt) ||
                        toMillis(b.updatedAt);

                    return atB - atA;
                });

                return next;
            });
        },
        [summarizeIncoming]
    );

    // ===== ✅ 핵심: target message가 나올 때까지 older fetch 반복 후 스크롤 =====
    const ensureMessageLoadedAndScroll = useCallback(
        async (rid, targetMessageId) => {
            if (!rid || !targetMessageId) return;

            const targetId = String(targetMessageId);

            // 1) 현재 messages에 있으면 바로 스크롤
            if (hasMessageId(messages, targetId)) {
                scrollToDomMessage(targetId);
                return;
            }

            // 2) 없으면 older fetch 반복
            //    - getMessages(rid, { limit, beforeMessageId }) 지원한다고 했으니 그걸 사용
            let current = messages.slice();
            let tries = 0;
            const MAX_TRIES = 8;      // 너무 많이 당기지 않게
            const PAGE_SIZE = 50;

            while (tries < MAX_TRIES) {
                tries += 1;

                // ✅ 내림차순(최신→과거)에서 "가장 과거"는 맨 아래
                const oldest = current.length
                    ? String(current[current.length - 1].messageId ?? current[current.length - 1].id)
                    : null;

                const older = await chatApi.getMessages(rid, {
                    limit: PAGE_SIZE,
                    ...(oldest ? { beforeMessageId: oldest } : {}),
                });

                const olderList = normalizeMessages(older);

                if (!olderList.length) break;

                // ✅ 머지(중복 제거)
                const mergedMap = new Map();
                for (const m of [...current, ...olderList]) {
                    mergedMap.set(String(m.messageId ?? m.id), { ...m, messageId: m.messageId ?? m.id });
                }

                // ✅ 내림차순 유지
                const merged = Array.from(mergedMap.values())
                    .sort((a, b) => (b.messageId ?? 0) - (a.messageId ?? 0));

                current = merged;
                setMessages(current);

                // seenIds 갱신
                const nextSeen = new Set();
                for (const m of current) nextSeen.add(String(m.messageId ?? m.id));
                seenIdsRef.current = nextSeen;

                if (hasMessageId(current, targetId)) {
                    requestAnimationFrame(() => scrollToDomMessage(targetId));
                    return;
                }

                // ✅ oldest가 변하지 않으면 더 내려올 게 없다는 뜻
                const newOldest = current.length
                    ? String(current[current.length - 1].messageId ?? current[current.length - 1].id)
                    : null;

                if (newOldest === oldest) break;
            }


            // 여기까지 왔으면 target을 못 찾은 것
            setErr((prev) => prev || "해당 메시지를 찾지 못했습니다. (더 오래된 메시지일 수 있음)");
        },
        [messages, hasMessageId, normalizeMessages, scrollToDomMessage]
    );

    // ===== effects =====

    // 1) 최초 rooms 로딩
    useEffect(() => {
        loadRooms();
    }, [loadRooms]);

    // 2) 부모 roomId 바뀌면 선택 반영
    useEffect(() => {
        if (roomId == null) return;
        setSelectedRoomId(String(roomId));
    }, [roomId]);

    // ✅ 2-1) 스크롤 타깃이 들어오면 요청 저장
    useEffect(() => {
        if (scrollToMessageId == null) return;
        const rid = roomId != null ? String(roomId) : selectedRoomIdRef.current;
        if (!rid) return;

        scrollReqRef.current = { roomId: String(rid), messageId: String(scrollToMessageId) };
    }, [scrollToMessageId, roomId]);

    // 3) WS 연결 + rooms 전역 이벤트 구독 (한 번만)
    useEffect(() => {
        const jwt = localStorage.getItem("jwt");
        if (!jwt) return;

        connectChatSocket(jwt);

        subscribeRooms((evt) => {
            console.log("📩 rooms evt", evt);
            if (evt?.type === "ROOMS_CHANGED") loadRooms();
        });

        return () => {
            disconnectChatSocket();
        };
    }, [loadRooms]);

    // 4) 방 선택 시: REST 1회 로딩 + WS room 구독
    useEffect(() => {
        if (!selectedRoomId) return;

        // ✅ 방 바뀌면 seen 초기화
        seenIdsRef.current = new Set();

        const prev = prevRoomIdRef.current;
        if (prev && String(prev) !== String(selectedRoomId)) {
            unsubscribeRoom(prev);
        }
        prevRoomIdRef.current = selectedRoomId;
        selectedRoomIdRef.current = selectedRoomId;

        (async () => {
            const list = await loadMessagesOnce(selectedRoomId);
            await loadRoomMeta(selectedRoomId);

            // ✅ 방 로딩 직후: 스크롤 요청이 이 방에 대한 거면 처리
            const req = scrollReqRef.current;
            if (req && String(req.roomId) === String(selectedRoomId)) {
                await ensureMessageLoadedAndScroll(selectedRoomId, req.messageId);
                scrollReqRef.current = null; // 소비
            }
        })();

        subscribeRoom(selectedRoomId, async (incoming) => {
            if (incoming?.type && incoming.type !== "MESSAGE") return;

            const msgId = String(incoming.messageId ?? incoming.id);
            if (!msgId) return;

            if (seenIdsRef.current.has(msgId)) return;
            seenIdsRef.current.add(msgId);

            const msg = {
                messageId: incoming.messageId ?? incoming.id,
                roomId: incoming.roomId ?? selectedRoomIdRef.current,
                senderId: incoming.senderId,
                content: incoming.content ?? "",
                createdAt: incoming.createdAt,
                attachments: Array.isArray(incoming.attachments) ? incoming.attachments : [],
            };

            setMessages((prevMsgs) => {
                const next = normalizeMessages([...prevMsgs, msg]);
                return next;
            });

            bumpRoomByIncoming(msg);

            // ✅ WS로 메시지가 들어오면서 target이 생성될 수 있음 → req가 남아있으면 재시도
            const req = scrollReqRef.current;
            if (req && String(req.roomId) === String(selectedRoomId)) {
                // messages state가 아직 업데이트 전일 수 있으니 한 프레임 늦춰서 시도
                requestAnimationFrame(() => {
                    scrollToDomMessage(req.messageId);
                    scrollReqRef.current = null;
                });
            }
        });

        return () => {
            unsubscribeRoom(selectedRoomId);
        };
    }, [
        selectedRoomId,
        loadMessagesOnce,
        loadRoomMeta,
        bumpRoomByIncoming,
        ensureMessageLoadedAndScroll,
        normalizeMessages,
        scrollToDomMessage,
    ]);

    // 5) 읽음 처리
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

    // 6) 전송: WS publish (텍스트만)
    const handleSend = useCallback(
        (text) => {
            if (!selectedRoomId) return;
            setErr("");

            const ok = sendRoomMessage(selectedRoomId, text);
            if (!ok) {
                setErr("소켓 연결이 끊겨서 전송 실패");
                return;
            }
        },
        [selectedRoomId]
    );

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
                        setRooms((prev) =>
                            prev.filter((r) => String(r.roomId ?? r.id) !== String(deletedId))
                        );

                        if (String(selectedRoomId) === String(deletedId)) {
                            const remain = rooms.filter(
                                (r) => String(r.roomId ?? r.id) !== String(deletedId)
                            );
                            const next = remain.length ? (remain[0].roomId ?? remain[0].id) : null;
                            setSelectedRoomId(next != null ? String(next) : null);
                            setMessages([]);
                            seenIdsRef.current = new Set();
                        }
                    }}
                />
            </aside>

            <main className="chatPanelRight">
                <div className="chatPanelTop">
                    <div className="chatPanelRoomTitle">
                        {selectedRoomId ? roomTitle : "방을 선택하세요"}
                    </div>
                    <button className="miniBtn" onClick={loadRooms}>
                        ↻
                    </button>
                </div>

                {err && <div className="chatErr">{err}</div>}


                <div className="kcChatCol">
                    <MessageList
                        messages={messages}
                        otherLastReadMessageId={otherLastReadMessageId}
                    />

                    <MessageInput
                        disabled={!selectedRoomId}
                        roomId={selectedRoomId}
                        onSend={handleSend}
                    />
                </div>
            </main>
        </div>
    );
}

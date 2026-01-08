import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client = null;
let connecting = false;
let pingSubscribed = false;

const roomSubs = new Map();
let roomsSub = null;
const readSubs = new Map();

// ✅ rooms 구독 대기열
let roomsHandlers = [];
let roomsSubscribeRequested = false;

export function connectChatSocket(jwt, onPing) {
    if (!jwt) {
        console.warn("⛔ STOMP connect skipped: jwt is null");
        return null;
    }

    if (client?.connected) return client;
    if (connecting) return client;

    connecting = true;

    client = new Client({
        webSocketFactory: () => new SockJS("http://localhost:8080/ws-chat"),
        connectHeaders: { Authorization: `Bearer ${jwt}` },
        reconnectDelay: 3000,
        debug: (msg) => console.log("[STOMP]", msg),

        onConnect: () => {
            connecting = false;
            console.log("✅ STOMP connected");

            // ✅ 연결된 순간, rooms 구독 요청이 있었다면 반드시 붙이기
            if (roomsSubscribeRequested && !roomsSub) {
                console.log("✅ subscribing /user/queue/rooms ...");
                roomsSub = client.subscribe("/user/queue/rooms", (msg) => {
                    let body = msg.body;
                    try { body = JSON.parse(msg.body); } catch {}
                    // 등록된 핸들러들 모두 호출
                    for (const h of roomsHandlers) h?.(body);
                });
            }

            // ping (선택)
            if (!pingSubscribed) {
                pingSubscribed = true;
                client.subscribe("/user/queue/ping", (msg) => onPing?.(msg.body));
                try { client.publish({ destination: "/app/ping", body: "" }); } catch {}
            }
        },

        onWebSocketClose: () => {
            connecting = false;
            console.log("🔌 WebSocket closed");
            roomSubs.clear();
            roomsSub = null;
            roomsSubscribeRequested = false;
            roomsHandlers = [];
        },

        onStompError: (frame) => {
            console.error("❌ STOMP error", frame.headers["message"], frame.body);
        },
    });

    client.activate();
    return client;
}

export function disconnectChatSocket() {
    try { for (const sub of roomSubs.values()) sub?.unsubscribe?.(); } catch {}
    roomSubs.clear();

    try { roomsSub?.unsubscribe?.(); } catch {}
    roomsSub = null;

    roomsSubscribeRequested = false;
    roomsHandlers = [];

    pingSubscribed = false;
    connecting = false;

    if (client) {
        client.deactivate();
        client = null;
    }
}

export function subscribeRooms(onEvent) {
    // ✅ 핸들러 등록은 언제든지
    if (typeof onEvent === "function") roomsHandlers.push(onEvent);

    // ✅ "구독해줘" 플래그
    roomsSubscribeRequested = true;

    // 이미 연결돼있고 아직 roomsSub 없으면 즉시 구독
    if (client?.connected && !roomsSub) {
        console.log("✅ subscribing /user/queue/rooms (immediate) ...");
        roomsSub = client.subscribe("/user/queue/rooms", (msg) => {
            let body = msg.body;
            try { body = JSON.parse(msg.body); } catch {}
            for (const h of roomsHandlers) h?.(body);
        });
    }

    return roomsSub;
}

export function unsubscribeRooms() {
    try { roomsSub?.unsubscribe?.(); } catch {}
    roomsSub = null;
    roomsSubscribeRequested = false;
    roomsHandlers = [];
}

// room 구독은 너 기존 그대로
export function subscribeRoom(roomId, onMsg) {
    if (!client?.connected) {
        console.warn("⛔ subscribeRoom skipped: not connected");
        return null;
    }

    const key = String(roomId);
    if (roomSubs.has(key)) return roomSubs.get(key);

    const sub = client.subscribe(`/topic/room/${key}`, (msg) => {
        let body = msg.body;
        try { body = JSON.parse(msg.body); } catch {}
        onMsg?.(body);
    });

    roomSubs.set(key, sub);
    return sub;
}

export function unsubscribeRoom(roomId) {
    const key = String(roomId);
    const sub = roomSubs.get(key);
    if (!sub) return;
    try { sub.unsubscribe(); } catch {}
    roomSubs.delete(key);
}

export function sendRoomMessage(roomId, content) {
    if (!client?.connected) {
        console.warn("⛔ sendRoomMessage skipped: not connected");
        return false;
    }

    const trimmed = (content ?? "").trim();
    if (!trimmed) return false;

    client.publish({
        destination: "/app/chat/send",
        body: JSON.stringify({ roomId: Number(roomId), content: trimmed }),
    });

    return true;
}



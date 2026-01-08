import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client = null;
let connecting = false;
let pingSubscribed = false;

// roomId -> subscription
const roomSubs = new Map();

// 전역 rooms 이벤트 구독(있으면 쓰고, 없으면 무시)
let roomsSub = null;

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

            // ping 구독 1회 (선택)
            if (!pingSubscribed) {
                pingSubscribed = true;

                client.subscribe("/user/queue/ping", (msg) => {
                    onPing?.(msg.body);
                });

                // 서버가 /app/ping 받는 경우만
                try {
                    client.publish({ destination: "/app/ping", body: "" });
                } catch {}
            }
        },

        onWebSocketClose: () => {
            connecting = false;
            console.log("🔌 WebSocket closed");
            roomSubs.clear();
            roomsSub = null;
        },

        onStompError: (frame) => {
            console.error("❌ STOMP error", frame.headers["message"], frame.body);
        },
    });

    client.activate();
    return client;
}

export function disconnectChatSocket() {
    try {
        for (const sub of roomSubs.values()) sub?.unsubscribe?.();
    } catch {}
    roomSubs.clear();

    try {
        roomsSub?.unsubscribe?.();
    } catch {}
    roomsSub = null;

    pingSubscribed = false;
    connecting = false;

    if (client) {
        client.deactivate();
        client = null;
    }
}

function parseBody(msg) {
    let body = msg.body;
    try {
        body = JSON.parse(msg.body);
    } catch {}
    return body;
}

export function isChatConnected() {
    return Boolean(client?.connected);
}

// -------------------------
// rooms 전역 구독 (서버가 쏘면 받기, 안 쏘면 그냥 무시)
// -------------------------
export function subscribeRooms(onEvent) {
    if (!client?.connected) {
        console.warn("⛔ subscribeRooms skipped: not connected");
        return null;
    }
    if (roomsSub) return roomsSub;

    roomsSub = client.subscribe("/user/queue/rooms", (msg) => {
        const body = parseBody(msg);
        onEvent?.(body);
    });

    return roomsSub;
}

export function unsubscribeRooms() {
    try {
        roomsSub?.unsubscribe?.();
    } catch {}
    roomsSub = null;
}

// -------------------------
// ✅ room 구독 (여기만 서버 경로에 맞춰 수정)
//    기존: /topic/rooms/{id}  ❌
//    변경: /topic/room/{id}   ✅
// -------------------------
export function subscribeRoom(roomId, onMsg) {
    if (!client?.connected) {
        console.warn("⛔ subscribeRoom skipped: not connected");
        return null;
    }

    const key = String(roomId);
    if (roomSubs.has(key)) return roomSubs.get(key);

    const sub = client.subscribe(`/topic/room/${key}`, (msg) => {
        const body = parseBody(msg);
        onMsg?.(body);
    });

    roomSubs.set(key, sub);
    return sub;
}

export function unsubscribeRoom(roomId) {
    const key = String(roomId);
    const sub = roomSubs.get(key);
    if (!sub) return;

    try {
        sub.unsubscribe();
    } catch {}
    roomSubs.delete(key);
}

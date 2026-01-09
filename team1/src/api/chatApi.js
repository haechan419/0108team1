import axiosInstance from "./axiosInstance";

// --- AI file search (global) ---
export const aiFindChatFilesGlobal = async (query) => {
    if (!query || !query.trim()) {
        throw new Error("query is required");
    }

    const res = await axiosInstance.post(
        "/ai/find-chat-files-global",
        { query },
        {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
        }
    );

    return res.data;
    // { summary: string, files: AiChatFileItem[] }
};


export const chatApi = {
    // --- user search / create rooms ---
    searchUsers: (q, limit = 20) =>
        axiosInstance.get("/chat/users/search", { params: { q, limit } }).then(r => r.data),

    createDm: (targetUserId) =>
        axiosInstance.post("/chat/rooms/dm", { targetUserId }).then(r => r.data),

    createGroup: (memberUserIds) =>
        axiosInstance.post("/chat/rooms/group", { memberUserIds }).then(r => r.data),

    invite: (roomId, userIds) =>
        axiosInstance.post(`/chat/rooms/${roomId}/invite`, { userIds }).then(r => r.data),

    // --- rooms / messages ---
    getRooms: async () => {
        const res = await axiosInstance.get("/chat/rooms");
        return res.data;
    },

    getMessages: async (roomId, { cursor, limit } = {}) => {
        const params = {};
        if (cursor) params.cursor = cursor;
        if (limit) params.limit = limit;
        const res = await axiosInstance.get(`/chat/rooms/${roomId}/messages`, { params });
        return res.data;
    },

    sendMessage: async (roomId, content) => {
        const res = await axiosInstance.post(`/chat/rooms/${roomId}/messages`, { content });
        return res.data;
    },

    updateRead: async (roomId, lastReadMessageId = null) => {
        const res = await axiosInstance.post(`/chat/rooms/${roomId}/read`, { lastReadMessageId });
        return res.data;
    },

    getRoomMeta: async (roomId) => {
        const res = await axiosInstance.get(`/chat/rooms/${roomId}/meta`);
        return res.data;
    },

    deleteRoom: async (roomId) => {
        const res = await axiosInstance.delete(`/chat/rooms/${roomId}`);
        return res.data;
    },

    uploadAttachments: async (roomId, content, files) => {
        const form = new FormData();
        if (content != null) form.append("content", content); // "" 가능

        if (files && files.length) {
            for (const f of files) form.append("files", f);
        }

        const res = await axiosInstance.post(
            `/chat/rooms/${roomId}/attachments`,
            form,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return res.data; // { ok, messageId, attachments }
    },

    aiFindChatFilesGlobal: async (query) => {
        const res = await axiosInstance.post(
            "/ai/find-chat-files-global",
            { query },
            { headers: { "Content-Type": "application/json; charset=utf-8" } }
        );
        return res.data;
    },


};
// src/api/chatApi.js
const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

export function chatAttachmentDownloadUrl(attachmentId, inline = false) {
    const q = inline ? "?inline=true" : "";
    return `${API_BASE}/api/files/chat/${attachmentId}/download${q}`;
}

export async function downloadChatAttachment(attachmentId, filename, token) {
    const url = chatAttachmentDownloadUrl(attachmentId);

    const res = await fetch(url, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
    });

    const ct = (res.headers.get("content-type") || "").toLowerCase();

    // ✅ 200이어도 HTML/JSON이면 SPA/에러 응답임
    if (!res.ok || ct.includes("application/json") || ct.includes("text/html")) {
        const text = await res.text().catch(() => "");
        throw new Error(`Download failed: ${res.status} CT=${ct} BODY=${text.slice(0, 200)}`);
    }

    const buf = await res.arrayBuffer();
    const blob = new Blob([buf], { type: ct || "application/octet-stream" });

    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename || "file";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(objectUrl);
}

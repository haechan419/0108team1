import axiosInstance from "./axiosInstance";

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

};

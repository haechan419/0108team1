import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getMyExpenseNotifications,
  getMyOrderNotifications,
} from "../api/notificationApi";

// 🚨 키 변경: 정렬 꼬임 방지를 위해 초기화 한 번 진행
const STORAGE_KEY = "read_notifications_sorted_final";

const getReadList = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

export const checkMyNotification = createAsyncThunk(
  "notification/checkMyNotification",
  async (_, { rejectWithValue }) => {
    try {
      const [expenseRes, orderRes] = await Promise.all([
        getMyExpenseNotifications(),
        getMyOrderNotifications(),
      ]);

      const readList = getReadList();

      const createNotificationItem = (item, forcedType) => {
        // 1. 상태 필터링 (대기중은 무시)
        const status = item.status || "";
        if (
          status === "PENDING" ||
          status === "WAITING" ||
          status === "REQUEST" ||
          status === "신청" ||
          status === "대기"
        ) {
          return null;
        }

        // 2. 제목 생성 및 유효성 검사
        let title = "";
        const label = forcedType === "EXPENSE" ? "[📄지출]" : "[📦비품]";
        const reason = item.rejectReason || item.reason || "";
        let isValid = false;

        // (A) 반려
        if (
          ["REJECTED", "RETURN", "반려", "거절"].some((s) => status.includes(s))
        ) {
          title = `${label} 반려: ${reason ? reason : "사유 확인"}`;
          isValid = true;
        }
        // (B) 보완
        else if (
          ["REQUEST_MORE", "SUPPLEMENT", "보완", "보류"].some((s) =>
            status.includes(s)
          )
        ) {
          title = `${label} 보완요청: ${reason ? reason : "내용 확인"}`;
          isValid = true;
        }
        // (C) 승인 (결제처리승인 포함)
        else if (
          [
            "APPROVED",
            "CONFIRMED",
            "COMPLETE",
            "승인",
            "결재",
            "결제",
            "완료",
          ].some((s) => status.includes(s))
        ) {
          const name =
            item.title ||
            item.pname ||
            (item.items && item.items[0]?.pname) ||
            "상세 내역";
          title = `${label} 승인완료: ${name}`;
          isValid = true;
        }

        if (!isValid) return null;

        // 3. ID 추출
        let id;
        if (forcedType === "EXPENSE") {
          id = item.id || item.expenseId || item.eno;
        } else {
          id = item.rno || item.pno || item.id;
        }
        if (!id) return null;

        // 📅 [핵심 수정] 시간 정렬 기준 잡기
        // 승인 처리를 하면 modDate(수정일)가 갱신됩니다. 이걸 최우선으로 잡아야
        // 옛날에 신청한 것도 방금 승인하면 맨 위로 뜹니다.
        const targetDate =
          item.modDate || item.uptDate || item.updatedAt || item.regDate || "";

        // 키 생성 (상태가 바뀌거나 시간이 바뀌면 새 알림)
        const idKey = `${
          forcedType === "EXPENSE" ? "EXP" : "ORD"
        }_${id}_${status}_${targetDate}`;

        if (readList.includes(idKey)) return null;

        return {
          ...item,
          notiType: forcedType,
          id: idKey,
          targetId: id,
          displayDate: targetDate || new Date().toISOString(), // 정렬용 날짜
          title: title,
        };
      };

      // ====================================================
      // 🚀 데이터 생성 및 정렬
      // ====================================================

      const expenses = (Array.isArray(expenseRes) ? expenseRes : [])
        .map((item) => createNotificationItem(item, "EXPENSE"))
        .filter((item) => item !== null);

      const orders = (Array.isArray(orderRes) ? orderRes : [])
        .map((item) => createNotificationItem(item, "ORDER"))
        .filter((item) => item !== null);

      const combinedList = [...expenses, ...orders];

      // 📊 [정렬 로직] 최신순 (날짜 내림차순)
      combinedList.sort((a, b) => {
        // 날짜 문자열을 숫자로 변환하여 비교 (정확도 향상)
        const dateA = new Date(a.displayDate).getTime();
        const dateB = new Date(b.displayDate).getTime();

        // 날짜가 없으면 뒤로 보냄
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;

        return dateB - dateA; // 큰 숫자(최신)가 앞으로
      });

      return combinedList;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const notificationSlice = createSlice({
  name: "notification",
  initialState: { items: [], count: 0 },
  reducers: {
    removeNotification: (state, action) => {
      const uniqueId = action.payload;
      state.items = state.items.filter((item) => item.id !== uniqueId);
      state.count = state.items.length;

      const currentReadList = getReadList();
      if (!currentReadList.includes(uniqueId)) {
        currentReadList.push(uniqueId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentReadList));
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(checkMyNotification.fulfilled, (state, action) => {
      const readList = getReadList();
      const newItems = action.payload.filter(
        (item) => !readList.includes(item.id)
      );
      state.items = newItems;
      state.count = newItems.length;
    });
  },
});

export const { removeNotification } = notificationSlice.actions;
export default notificationSlice.reducer;

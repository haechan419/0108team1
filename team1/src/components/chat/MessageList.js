import { useEffect, useMemo, useRef } from "react";
import { getCookie } from "../../util/cookieUtil";
import { decodeJwtPayload } from "../../util/jwtDecode";
import "../../styles/kakaoChat.css";

function toKoreanDate(d) {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const week = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
    return `${y}년 ${m}월 ${day}일 (${week})`;
}

function dateKey(iso) {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`; // grouping key
}

function formatTime(iso) {
    const d = new Date(iso);
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    const ampm = h < 12 ? "오전" : "오후";
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${ampm} ${hh}:${m}`;
}

export default function MessageList({
                                        messages,
                                        // 읽음표시용: 상대가 어디까지 읽었는지(상대 member의 lastReadMessageId)
                                        otherLastReadMessageId,
                                    }) {
    const bottomRef = useRef(null);

    const meId = useMemo(() => {
        const member = getCookie("member");
        const token = member?.accessToken;
        const payload = token ? decodeJwtPayload(token) : null;
        return payload?.id ?? null;
    }, []);

    // 1) createdAt 기준 오래된 → 최신 정렬
    const sorted = useMemo(() => {
        const arr = Array.isArray(messages) ? [...messages] : [];
        arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        return arr;
    }, [messages]);

    //  2) 렌더용 “날짜칩 + 메시지” 합성
    const rows = useMemo(() => {
        const out = [];
        let prevKey = null;

        for (const m of sorted) {
            const key = dateKey(m.createdAt);
            if (key !== prevKey) {
                out.push({ type: "date", key, label: toKoreanDate(new Date(m.createdAt)) });
                prevKey = key;
            }
            out.push({ type: "msg", msg: m });
        }
        return out;
    }, [sorted]);

    // 최신이 아래로 가므로, 새 메시지 오면 맨 아래로 스크롤
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [rows.length]);

    if (!sorted || sorted.length === 0) {
        return <div className="kcEmpty">메시지가 없습니다. 첫 메시지를 보내보세요.</div>;
    }

    return (
        <div className="kcMsgArea">
            {rows.map((r) => {
                if (r.type === "date") {
                    return (
                        <div key={`date-${r.key}`} className="kcDateChip">
                            {r.label}
                        </div>
                    );
                }

                const m = r.msg;
                const id = m.messageId ?? m.id;
                const mine = meId != null && Number(m.senderId) === Number(meId);


                const isReadByOther =
                    mine &&
                    otherLastReadMessageId != null &&
                    Number(otherLastReadMessageId) >= Number(id);

                return (
                    <div key={`msg-${id}`} className={`kcRow ${mine ? "me" : "other"}`}>
                        {!mine && <div className="kcAvatar">{String(m.senderId).slice(-2)}</div>}

                        <div className="kcBubbleWrap">
                            <div className={`kcBubble ${mine ? "me" : "other"}`}>{m.content}</div>

                            <div className={`kcMeta ${mine ? "me" : "other"}`}>
                                {mine && (
                                    <span className={`kcRead ${isReadByOther ? "read" : "unread"}`}>
                    {isReadByOther ? "읽음" : "1"}
                  </span>
                                )}
                                <span className="kcTime">{formatTime(m.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                );
            })}

            <div ref={bottomRef} />
        </div>
    );
}

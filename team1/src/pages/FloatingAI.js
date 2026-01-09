import { useEffect, useRef, useState } from "react";
import "../styles/floatingai.css";
import { getAuthTokenForRequest } from "../api/axiosInstance"; // ✅ src/pages 기준
import { downloadChatAttachment } from "../api/chatApi"; // ✅ 이미 있는 다운로드 유틸 사용

const API_BASE = "http://localhost:8080/api/ai";

// --- 공통 fetch helper (JWT 포함) ---
async function postJson(url, body) {
    const token = getAuthTokenForRequest();

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`AI API failed: ${res.status} ${text}`);
    }
    return await res.json();
}

// --- 기존 generate ---
async function aiGenerate(prompt) {
    return postJson(`${API_BASE}/generate`, { prompt });
}

// --- room 전용 ---
async function aiFindContext(roomId, query) {
    return postJson(`${API_BASE}/find-context`, { roomId, query });
}

// --- ✅ global: 파일 찾기 (내 전체 채팅방) ---
async function aiFindChatFilesGlobal(query) {
    // ✅ POST /api/ai/find-chat-files-global
    return postJson(`${API_BASE}/find-chat-files-global`, { query });
}

// 결과 포맷팅 (컨텍스트)
function formatContextResult(data) {
    const summary = (data?.summary ?? "").toString().trim();
    const msgs = Array.isArray(data?.messages) ? data.messages : [];

    const lines = [];
    lines.push(`📌 요약\n${summary || "(요약 없음)"}`);

    if (msgs.length) {
        lines.push("");
        lines.push(`🧾 근거 메시지 (${Math.min(5, msgs.length)}개)`);
        msgs.slice(0, 5).forEach((m) => {
            const roomId = m.roomId != null ? `room:${m.roomId}` : "room:?";
            const when = m.createdAt ? String(m.createdAt) : "";
            const content = (m.content ?? "").toString();
            lines.push(`- [${roomId}] ${when}  ${content}`);
        });
    } else {
        lines.push("");
        lines.push("🧾 근거 메시지: 없음");
    }

    return { text: lines.join("\n"), messages: msgs };
}

// ✅ 결과 포맷팅 (파일)
function formatFilesResult(data) {
    const summary = (data?.summary ?? "").toString().trim();
    const files = Array.isArray(data?.files) ? data.files : [];

    const lines = [];
    lines.push(`📎 파일 찾기 결과`);
    lines.push(`📌 요약\n${summary || "(요약 없음)"}`);

    if (files.length) {
        lines.push("");
        lines.push(`🗂️ 파일 (${Math.min(5, files.length)}개)`);

        files.slice(0, 5).forEach((f) => {
            const id = f.attachmentId ?? "?";
            const room = f.roomId != null ? `room:${f.roomId}` : "room:?";
            const when = f.createdAt ? String(f.createdAt) : "";
            const name = (f.originalName ?? "").toString();
            const snip = (f.messageSnippet ?? "").toString();

            lines.push(`- [${id}] [${room}] ${when}  ${name}`);
            if (snip) lines.push(`    ↳ ${snip}`);
        });
    } else {
        lines.push("");
        lines.push("🗂️ 파일: 없음");
    }

    return { text: lines.join("\n"), files };
}

export default function FloatingAI({ roomId, onOpenRoom  }) {
    const emitOpenRoom = (payload) => {
        if (typeof onOpenRoom === "function") return onOpenRoom(payload);
        window.dispatchEvent(new CustomEvent("ai-open-room", { detail: payload }));
    };

    const [open, setOpen] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [result, setResult] = useState("");
    const [resultMessages, setResultMessages] = useState([]);
    const [resultFiles, setResultFiles] = useState([]); // ✅ 추가
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const textareaRef = useRef(null);

    // ====== 위치(드래그) 관련 ======
    const FAB_SIZE = 58;
    const MARGIN = 12;

    function clampPos(p) {
        const maxX = window.innerWidth - MARGIN - FAB_SIZE;
        const maxY = window.innerHeight - MARGIN - FAB_SIZE;
        return {
            x: Math.max(MARGIN, Math.min(p.x, maxX)),
            y: Math.max(MARGIN, Math.min(p.y, maxY)),
        };
    }

    const [pos, setPos] = useState(() => {
        const saved = localStorage.getItem("floatingAI.pos");
        const initial = saved
            ? JSON.parse(saved)
            : { x: 18, y: window.innerHeight - 18 - FAB_SIZE };
        return clampPos(initial);
    });

    const draggingRef = useRef(false);
    const pointerIdRef = useRef(null);
    const startRef = useRef({ x: 0, y: 0, px: 0, py: 0 });

    // ====== UX: 열릴 때 포커스 ======
    useEffect(() => {
        if (open) {
            const t = setTimeout(() => textareaRef.current?.focus(), 50);
            return () => clearTimeout(t);
        }
    }, [open]);

    // ====== UX: ESC로 닫기 ======
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    // ====== 리사이즈 시 화면 밖으로 나가지 않게 ======
    useEffect(() => {
        const onResize = () => setPos((p) => clampPos(p));
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // ====== 위치 저장 ======
    useEffect(() => {
        localStorage.setItem("floatingAI.pos", JSON.stringify(pos));
    }, [pos]);

    // ====== AI 실행 ======
    const onRun = async () => {
        const q = prompt.trim();
        if (!q) return;

        setErr("");
        setLoading(true);

        try {
            // ✅ roomId 있으면: 컨텍스트 검색 그대로
            // ✅ roomId 없으면: 전역 파일찾기
            if (roomId) {
                const ctx = await aiFindContext(Number(roomId), q);
                const formatted = formatContextResult(ctx);

                setResult(formatted.text);
                setResultMessages(formatted.messages);
                setResultFiles([]); // ✅ 파일결과는 비움

                // 2) 근거 메시지가 0개면 generate로 fallback
                const msgs = formatted.messages || [];
                if (msgs.length === 0) {
                    const finalPrompt = `한국어로만 답변해줘.\n\n${q}`;
                    const out = await aiGenerate(finalPrompt);

                    const text =
                        typeof out === "string"
                            ? out
                            : (out?.result ?? out?.message ?? JSON.stringify(out));

                    setResult((prev) => `${prev}\n\n🤖 (채팅에서 못 찾아서 일반 답변)\n${text}`);
                }
            } else {
                const data = await aiFindChatFilesGlobal(q);
                const formatted = formatFilesResult(data);

                setResult(formatted.text);
                setResultMessages([]);
                setResultFiles(formatted.files || []);
            }
        } catch (e) {
            setErr(e?.message || String(e));
        } finally {
            setLoading(false);
        }
    };

    // ====== 드래그 핸들러 ======
    const onPointerDown = (e) => {
        if (e.button !== undefined && e.button !== 0) return;

        draggingRef.current = false;
        pointerIdRef.current = e.pointerId;

        startRef.current = {
            x: e.clientX,
            y: e.clientY,
            px: pos.x,
            py: pos.y,
        };

        e.currentTarget.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e) => {
        if (pointerIdRef.current == null) return;
        if (pointerIdRef.current !== e.pointerId) return;

        const dx = e.clientX - startRef.current.x;
        const dy = e.clientY - startRef.current.y;

        if (!draggingRef.current && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
            draggingRef.current = true;
        }

        if (draggingRef.current) {
            setPos(
                clampPos({
                    x: startRef.current.px + dx,
                    y: startRef.current.py + dy,
                })
            );
        }
    };

    const onPointerUp = (e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        pointerIdRef.current = null;

        if (!draggingRef.current) setOpen(true);
    };

    return (
        <>
            <button
                className="ai-fab ai-bob"
                style={{
                    left: pos.x,
                    top: pos.y,
                    bottom: "auto",
                    right: "auto",
                    touchAction: "none",
                    position: "fixed",
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                aria-label="Open AI assistant"
                title="AI (drag me)"
                type="button"
            >
                AI
            </button>

            {open && (
                <div className="ai-overlay" onMouseDown={() => setOpen(false)}>
                    <div
                        className="ai-panel"
                        onMouseDown={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="ai-panel__header">
                            <div className="ai-panel__title">
                                AI Assistant {roomId ? `(room ${roomId})` : "(global files)"}
                            </div>
                            <button className="ai-x" onClick={() => setOpen(false)} type="button">
                                ✕
                            </button>
                        </div>

                        <div className="ai-panel__body">
                            <textarea
                                ref={textareaRef}
                                className="ai-input"
                                rows={4}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={
                                    roomId
                                        ? "예) 일정 마감일 변경 얘기했었나?"
                                        : "예) 승인금액 리포트 엑셀 찾아줘 / 00일 그 파일 어디지?"
                                }
                            />

                            <div className="ai-actions">
                                <button
                                    className="ai-btn"
                                    onClick={onRun}
                                    disabled={loading || !prompt.trim()}
                                    type="button"
                                >
                                    {loading ? "검색 중..." : "Ask"}
                                </button>

                                <button
                                    className="ai-btn ai-btn--ghost"
                                    onClick={() => {
                                        setPrompt("");
                                        setResult("");
                                        setResultMessages([]);
                                        setResultFiles([]);
                                        setErr("");
                                    }}
                                    disabled={loading}
                                    type="button"
                                >
                                    Reset
                                </button>
                            </div>

                            {err && <div className="ai-error">{err}</div>}

                            <div className="ai-result">
                                <div className="ai-result__label">Result</div>

                                {Array.isArray(resultMessages) && resultMessages.length > 0 && (
                                    <div style={{ marginBottom: 10 }}>
                                        {resultMessages.slice(0, 5).map((m) => {
                                            const rid = m.roomId;
                                            const mid = m.messageId ?? m.id; // (선택) 방어: messageId 대신 id일 수도

                                            return (
                                                <button
                                                    key={mid ?? `${rid}-${Math.random()}`} // (선택) 방어
                                                    type="button"
                                                    className="ai-btn ai-btn--ghost"
                                                    style={{ marginRight: 6, marginBottom: 6 }}
                                                    onClick={() => {
                                                        if (!rid) return;
                                                        // ✅ FIX: 항상 객체로 보냄
                                                        // onOpenRoom?.({ roomId: String(rid) });
                                                        // 필요하면 아래처럼 메시지 점프까지:
                                                        // onOpenRoom?.({ roomId: String(rid), messageId: mid != null ? String(mid) : null });
                                                    }}
                                                    title={`room ${rid}로 이동`}
                                                >
                                                    room {rid}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {Array.isArray(resultFiles) && resultFiles.length > 0 && (
                                    <div className="ai-result__files" style={{ marginBottom: 10 }}>
                                        {resultFiles.slice(0, 5).map((f) => (
                                            <div key={f.attachmentId} className="ai-file-row">
                                                {/* ✅ 방 점프 버튼 (이미 객체라 OK) */}
                                                <button
                                                    type="button"
                                                    className="ai-btn ai-btn--ghost ai-room-btn"
                                                    onClick={() => {
                                                        emitOpenRoom({ roomId: String(f.roomId), messageId: String(f.messageId) });
                                                    }}

                                                    title={`room ${f.roomId}로 이동`}
                                                >
                                                    room {f.roomId ?? "?"}
                                                </button>

                                                {/* ✅ 파일명 표시(누르면 방으로 이동) */}
                                                <button
                                                    type="button"
                                                    className="ai-btn ai-btn--ghost ai-file-name"
                                                    onClick={() => {
                                                        const rid = f.roomId;
                                                        if (!rid) return;
                                                        // ✅ FIX: 항상 객체로 보냄
                                                        onOpenRoom?.({ roomId: String(rid) });
                                                        // 필요하면 메시지 점프까지:
                                                        // onOpenRoom?.({ roomId: String(rid), messageId: f.messageId != null ? String(f.messageId) : null });
                                                    }}
                                                    title="해당 방으로 이동"
                                                >
                                                    📎 {f.originalName || `file ${f.attachmentId}`}
                                                </button>

                                                {/* ✅ 다운로드 버튼 (그대로) */}
                                                <button
                                                    type="button"
                                                    className="ai-btn ai-btn--ghost ai-dl-btn"
                                                    onClick={async () => {
                                                        try {
                                                            const token = getAuthTokenForRequest();
                                                            await downloadChatAttachment(f.attachmentId, f.originalName, token);
                                                        } catch (e) {
                                                            setErr(e?.message || String(e));
                                                        }
                                                    }}
                                                    title="다운로드"
                                                >
                                                    다운로드
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}


                                <div className="ai-result__box">
                                    {result || "결과가 여기에 표시됩니다."}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}


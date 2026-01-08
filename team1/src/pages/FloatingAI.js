import { useEffect, useRef, useState } from "react";
import "../styles/floatingai.css";

async function aiGenerate(prompt) {
    const res = await fetch("http://localhost:8080/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // credentials: "include",
        body: JSON.stringify({ prompt }),
    });

    // /login 리다이렉트 같은 이슈 방지용: text로 먼저 확인 가능
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`AI API failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    if (!data.ok) throw new Error(data.message || "AI API returned ok=false");
    return data.result;
}

export default function FloatingAI() {
    const [open, setOpen] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [result, setResult] = useState("");
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

    // ====== AI 실행 (AI 호출만 담당) ======
    const onRun = async () => {
        const p = prompt.trim();
        if (!p) return;

        setErr("");
        setLoading(true);
        try {
            // 한국어 고정(중국어 튀는 문제 예방)
            const finalPrompt = `한국어로만 답변해줘.\n\n${p}`;
            const out = await aiGenerate(finalPrompt);
            setResult(out);
        } catch (e) {
            setErr(e?.message || String(e));
        } finally {
            setLoading(false);
        }
    };

    // ====== 드래그 핸들러 ======
    const onPointerDown = (e) => {
        // 왼쪽 버튼/터치만
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

        // “클릭 vs 드래그” 구분: 4px 이상 움직이면 드래그로 판단
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

        // 드래그가 아니면 “클릭”으로 처리 → 패널 열기
        if (!draggingRef.current) setOpen(true);
    };

    return (
        <>
            {/* ✅ 드래그 가능한 떠있는 버튼 */}
            <button
                className="ai-fab ai-bob"
                style={{
                    left: pos.x,
                    top: pos.y,
                    bottom: "auto",
                    right: "auto",
                    touchAction: "none", // ✅ 모바일 스크롤 방지 (드래그 안정화)
                    position: "fixed",
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                aria-label="Open AI assistant"
                title="AI (drag me)"
            >
                AI
            </button>

            {/* 오버레이 + 패널 */}
            {open && (
                <div className="ai-overlay" onMouseDown={() => setOpen(false)}>
                    <div
                        className="ai-panel"
                        onMouseDown={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="ai-panel__header">
                            <div className="ai-panel__title">AI Assistant</div>
                            <button className="ai-x" onClick={() => setOpen(false)}>
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
                  placeholder="예) 이번달 요약을 3줄로 정리해줘"
              />

                            <div className="ai-actions">
                                <button
                                    className="ai-btn"
                                    onClick={onRun}
                                    disabled={loading || !prompt.trim()}
                                >
                                    {loading ? "생성 중..." : "Generate"}
                                </button>

                                <button
                                    className="ai-btn ai-btn--ghost"
                                    onClick={() => {
                                        setPrompt("");
                                        setResult("");
                                        setErr("");
                                    }}
                                    disabled={loading}
                                >
                                    Reset
                                </button>
                            </div>

                            {err && <div className="ai-error">{err}</div>}

                            <div className="ai-result">
                                <div className="ai-result__label">Result</div>
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

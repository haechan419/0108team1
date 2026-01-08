import { useEffect, useRef, useState } from "react";
import "../styles/floatingai.css";

// ========================================
// API 함수들
// ========================================

/**
 * 기존 일반 AI 생성 (Spring Boot → Ollama)
 */
async function aiGenerate(prompt) {
  const res = await fetch("http://localhost:8080/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI API failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  if (!data.ok) throw new Error(data.message || "AI API returned ok=false");
  return { type: "text", result: data.result };
}

/**
 * 출결 AI 요청 (Python FastAPI 서버)
 */
async function attendanceAiRequest(prompt) {
  const res = await fetch("http://localhost:8000/api/ai/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`출결 AI API failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data;
}

/**
 * 부서 실적 AI 요청 (Python FastAPI 서버)
 */
async function performanceAiRequest(prompt) {
  const res = await fetch("http://localhost:8000/api/ai/performance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`실적 AI API failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data;
}

/**
 * 출결 관련 키워드 체크
 * 이 키워드가 포함되면 Python 서버로 요청
 */
function isAttendanceQuery(prompt) {
  const keywords = [
    "출결",
    "출근",
    "지각",
    "결근",
    "휴가",
    "근태",
    "출석",
    "attendance",
  ];
  const lowerPrompt = prompt.toLowerCase();
  return keywords.some((keyword) => lowerPrompt.includes(keyword));
}

/**
 * 부서 실적 관련 키워드 체크
 */
function isPerformanceQuery(prompt) {
  const keywords = [
    "실적",
    "매출",
    "비교",
    "그래프",
    "차트",
    "성과",
    "목표달성",
    "계약",
    "달성률",
  ];
  const lowerPrompt = prompt.toLowerCase();
  return keywords.some((keyword) => lowerPrompt.includes(keyword));
}

// ========================================
// 메인 컴포넌트
// ========================================
export default function FloatingAI() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const textareaRef = useRef(null);
  const [imageModal, setImageModal] = useState(false); // 이미지 확대 모달

  // 응답 상태 (확장됨)
  const [response, setResponse] = useState({
    message: "",
    summary: "",
    hasFile: false,
    downloadUrl: "",
    fileName: "",
    chartImage: "", // Base64 그래프 이미지
  });

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
      if (e.key === "Escape") {
        // 이미지 모달이 열려있으면 이미지 모달 먼저 닫기
        if (imageModal) {
          setImageModal(false);
        } else {
          setOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [imageModal]);

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

  // ====== AI 실행 (핵심 로직) ======
  const onRun = async () => {
    const p = prompt.trim();
    if (!p) return;

    setErr("");
    setLoading(true);
    setResponse({
      message: "",
      summary: "",
      hasFile: false,
      downloadUrl: "",
      fileName: "",
      chartImage: "",
    });

    try {
      // 부서 실적 관련 질문인지 확인 (우선 체크)
      if (isPerformanceQuery(p)) {
        // ★ Python 부서 실적 AI 서버 호출
        console.log("[AI] 실적 관련 질문 → Python 서버로 요청");
        const data = await performanceAiRequest(p);

        if (data.ok) {
          setResponse({
            message: data.message || "",
            summary: data.summary || "",
            hasFile: false,
            downloadUrl: "",
            fileName: "",
            chartImage: data.chartImage || "",
          });
        } else {
          setErr(data.message || "처리 실패");
        }
      }
      // 출결 관련 질문인지 확인
      else if (isAttendanceQuery(p)) {
        // ★ Python 출결 AI 서버 호출
        console.log("[AI] 출결 관련 질문 → Python 서버로 요청");
        const data = await attendanceAiRequest(p);

        if (data.ok) {
          setResponse({
            message: data.message || "",
            summary: data.summary || "",
            hasFile: data.hasFile || false,
            downloadUrl: data.downloadUrl || "",
            fileName: data.fileName || "",
            chartImage: "",
          });
        } else {
          setErr(data.message || "처리 실패");
        }
      } else {
        // ★ 일반 AI 질문 (기존 Spring Boot → Ollama)
        console.log("[AI] 일반 질문 → Spring Boot로 요청");
        const finalPrompt = `한국어로만 답변해줘.\n\n${p}`;
        const result = await aiGenerate(finalPrompt);
        setResponse({
          message: result.result,
          summary: "",
          hasFile: false,
          downloadUrl: "",
          fileName: "",
          chartImage: "",
        });
      }
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  // ====== 엑셀 다운로드 ======
  const handleDownload = async () => {
    if (!response.downloadUrl) return;

    try {
      // Python 서버에서 파일 다운로드
      const downloadUrl = `http://localhost:8000${response.downloadUrl}`;

      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error("다운로드 실패");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = response.fileName || "출결데이터.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setErr("파일 다운로드 실패: " + e.message);
    }
  };

  // ====== Enter 키로 전송 ======
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onRun();
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
      {/* 떠있는 AI 버튼 */}
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
              <div className="ai-panel__title">🤖 AI Assistant</div>
              <button className="ai-x" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <div className="ai-panel__body">
              {/* 입력창 */}
              <textarea
                ref={textareaRef}
                className="ai-input"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="예) 개발1팀 개발2팀 실적 비교해줘"
              />

              {/* 버튼들 */}
              <div className="ai-actions">
                <button
                  className="ai-btn"
                  onClick={onRun}
                  disabled={loading || !prompt.trim()}
                >
                  {loading ? " 처리 중..." : " 보내기"}
                </button>

                <button
                  className="ai-btn ai-btn--ghost"
                  onClick={() => {
                    setPrompt("");
                    setResponse({
                      message: "",
                      summary: "",
                      hasFile: false,
                      downloadUrl: "",
                      fileName: "",
                      chartImage: "",
                    });
                    setErr("");
                  }}
                  disabled={loading}
                >
                  초기화
                </button>
              </div>

              {/* 에러 메시지 */}
              {err && <div className="ai-error">❌ {err}</div>}

              {/* 결과 영역 */}
              <div className="ai-result">
                <div className="ai-result__label">💬 Result</div>
                <div className="ai-result__box">
                  {response.message ? (
                    <>
                      {/* 메시지 */}
                      <p style={{ marginBottom: "10px", fontWeight: "500" }}>
                        {response.message}
                      </p>

                      {/* 요약 (있으면) */}
                      {response.summary && (
                        <pre
                          style={{
                            background: "#f5f5f5",
                            padding: "12px",
                            borderRadius: "8px",
                            fontSize: "13px",
                            whiteSpace: "pre-wrap",
                            marginBottom: "12px",
                            lineHeight: "1.5",
                          }}
                        >
                          {response.summary}
                        </pre>
                      )}

                      {/* 다운로드 버튼 (파일 있으면) */}
                      {response.hasFile && (
                        <button
                          onClick={handleDownload}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "12px 20px",
                            background:
                              "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                            color: "white",
                            border: "none",
                            borderRadius: "10px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                            boxShadow: "0 2px 8px rgba(34, 197, 94, 0.3)",
                          }}
                        >
                          엑셀 다운로드
                          <span style={{ fontSize: "12px", opacity: 0.9 }}>
                            ({response.fileName})
                          </span>
                        </button>
                      )}

                      {/* 그래프 이미지 (실적 비교용) */}
                      {response.chartImage && (
                        <div style={{ marginTop: "16px" }}>
                          <img
                            src={`data:image/png;base64,${response.chartImage}`}
                            alt="부서 실적 비교 그래프"
                            onClick={() => setImageModal(true)}
                            style={{
                              width: "100%",
                              maxWidth: "700px",
                              borderRadius: "12px",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                              cursor: "pointer",
                              transition: "transform 0.2s, box-shadow 0.2s",
                            }}
                            onMouseOver={(e) => {
                              e.target.style.transform = "scale(1.02)";
                              e.target.style.boxShadow =
                                "0 6px 20px rgba(0, 0, 0, 0.25)";
                            }}
                            onMouseOut={(e) => {
                              e.target.style.transform = "scale(1)";
                              e.target.style.boxShadow =
                                "0 4px 12px rgba(0, 0, 0, 0.15)";
                            }}
                          />
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#888",
                              marginTop: "6px",
                              textAlign: "center",
                            }}
                          >
                            🔍 클릭하면 크게 볼 수 있습니다
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <span style={{ color: "#999" }}>
                      결과가 여기에 표시됩니다.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 확대 모달 */}
      {imageModal && response.chartImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            cursor: "pointer",
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={() => setImageModal(false)}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "95vw",
              maxHeight: "95vh",
              animation: "scaleIn 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`data:image/png;base64,${response.chartImage}`}
              alt="부서 실적 비교 그래프 (확대)"
              style={{
                maxWidth: "95vw",
                maxHeight: "85vh",
                borderRadius: "16px",
                boxShadow: "0 12px 48px rgba(0, 0, 0, 0.5)",
              }}
            />
            <button
              onClick={() => setImageModal(false)}
              style={{
                position: "absolute",
                top: "-50px",
                right: "0",
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                color: "white",
                fontSize: "28px",
                cursor: "pointer",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) =>
                (e.target.style.background = "rgba(255, 255, 255, 0.2)")
              }
              onMouseOut={(e) =>
                (e.target.style.background = "rgba(255, 255, 255, 0.1)")
              }
            >
              ✕
            </button>
            <p
              style={{
                textAlign: "center",
                color: "rgba(255, 255, 255, 0.6)",
                marginTop: "16px",
                fontSize: "14px",
              }}
            >
              ESC 또는 바깥 영역을 클릭하면 닫힙니다
            </p>
          </div>
        </div>
      )}

      {/* 모달 애니메이션 스타일 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}

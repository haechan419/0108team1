import React, { useState, useEffect } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { getRequestList, putRequestStatus } from "../../api/requestApi";
import "../../styles/history.css";

export default function AdminApprovalPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getRequestList();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✨ [핵심] 상태 변경 핸들러 (사유 입력 로직 추가)
  const handleStatusChange = async (rno, newStatus) => {
    let rejectReason = "";

    // 1. 반려일 경우 사유 입력받기
    if (newStatus === "REJECTED") {
      const input = window.prompt("반려 사유를 입력해주세요:");
      if (input === null) return; // 취소 누르면 종료
      if (!input.trim()) return alert("반려 사유는 필수입니다!");
      rejectReason = input;
    } else {
      if (!window.confirm("정말 승인 처리하시겠습니까?")) return;
    }

    try {
      // 2. API 호출 (사유 포함)
      await putRequestStatus(rno, newStatus, rejectReason);
      alert("처리되었습니다.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // ✨ 상태 한글 변환 헬퍼 함수
  const getStatusText = (status) => {
    switch (status) {
      case "PENDING":
        return "승인 대기";
      case "APPROVED":
        return "승인 완료";
      case "REJECTED":
        return "반려됨";
      default:
        return status;
    }
  };

  return (
    <AppLayout>
      <div className="page-header" style={{ backgroundColor: "#fff0f0" }}>
        <h2 className="page-title" style={{ color: "#d63031" }}>
          🛡️ 관리자 결재 관리
        </h2>
        <p className="text-gray">
          요청된 비품 구매 건을 검토하고 승인하거나 반려합니다.
        </p>
      </div>

      <div className="history-container">
        <div className="history-list">
          {requests.map((req, index) => {
            const reqId = req.rno || index;
            const reqStatus = req.status || "PENDING";
            const reqDate = req.regDate ? req.regDate.substring(0, 10) : "-";

            // 상품명 요약
            const title =
              req.items && req.items.length > 0
                ? req.items.length > 1
                  ? `${req.items[0].pname} 외 ${req.items.length - 1}건`
                  : req.items[0].pname
                : "상품 정보 없음";

            return (
              <div
                key={reqId}
                className={`history-card-pro ${
                  expandedId === reqId ? "expanded" : ""
                }`}
              >
                <div
                  className="card-header"
                  onClick={() => toggleExpand(reqId)}
                >
                  <div className="header-left">
                    <span style={{ fontWeight: "bold", marginRight: "10px" }}>
                      #{reqId}
                    </span>
                    <div className={`status-dot ${reqStatus}`}></div>
                    <div className="req-date">{reqDate}</div>
                    <div className="req-title">{title}</div>
                  </div>
                  <div className="header-right">
                    <div className="req-amount">
                      {req.totalAmount?.toLocaleString()}원
                    </div>
                    {/* ✨ 한글 상태 텍스트 적용 */}
                    <div className={`status-badge ${reqStatus}`}>
                      {getStatusText(reqStatus)}
                    </div>
                  </div>
                </div>

                {expandedId === reqId && (
                  <div className="card-detail">
                    <table className="item-table">
                      <thead>
                        <tr>
                          <th>품목명</th>
                          <th>수량</th>
                          <th>금액</th>
                        </tr>
                      </thead>
                      <tbody>
                        {req.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.pname}</td>
                            <td>{item.quantity}</td>
                            <td>
                              {(item.price * item.quantity).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="memo-box">
                      <span className="label">📝 기안 메모:</span> {req.reason}
                    </div>

                    {/* ✨ 반려된 경우 반려 사유 표시 (관리자도 볼 수 있게) */}
                    {reqStatus === "REJECTED" && (
                      <div className="reject-alert">
                        <strong>🚨 반려 사유:</strong> {req.rejectReason}
                      </div>
                    )}

                    {reqStatus === "PENDING" && (
                      <div
                        style={{
                          marginTop: "20px",
                          display: "flex",
                          gap: "10px",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          onClick={() => handleStatusChange(reqId, "APPROVED")}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#4caf50",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                          }}
                        >
                          ✅ 승인하기
                        </button>
                        <button
                          onClick={() => handleStatusChange(reqId, "REJECTED")}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#f44336",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                          }}
                        >
                          ⛔ 반려하기
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

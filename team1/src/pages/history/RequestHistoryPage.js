import React, { useState, useEffect } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { getRequestList } from "../../api/requestApi"; // ✨ API 함수 임포트
import "../../styles/history.css";

export default function RequestHistoryPage() {
  // ✨ 서버에서 가져온 데이터를 담을 상태
  const [serverData, setServerData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState(null);

  // ✨ [핵심] 페이지 들어오면 서버에서 목록 가져오기
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getRequestList(); // 백엔드 호출 (GET /api/request/list)
      console.log("서버에서 가져온 내역:", data);
      setServerData(data); // 상태 업데이트
    } catch (error) {
      console.error("내역 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 1. 필터링 로직 수정 (대문자 기준)
  const filteredRequests = serverData.filter((req) => {
    const status = req.status || "PENDING"; // 기본값도 대문자
    return filter === "ALL" ? true : status === filter;
  });

  // 2. 통계 계산 수정 (대문자 기준)
  const stats = {
    total: serverData.length,
    pending: serverData.filter((r) => (r.status || "PENDING") === "PENDING")
        .length,
    approved: serverData.filter((r) => r.status === "APPROVED").length,
    rejected: serverData.filter((r) => r.status === "REJECTED").length,
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
      <AppLayout>
        <div className="page-header">
          <h2 className="page-title">📂 구매 신청 내역</h2>
          <p className="text-gray">
            상신한 비품 구매 요청의 진행 상황을 상세하게 확인합니다.
          </p>
        </div>

        <div className="history-container">
          {/* 상단 통계 카드 */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">총 신청 건수</div>
              <div className="stat-value">{stats.total}건</div>
            </div>
            <div className="stat-card pending">
              <div className="stat-label">대기 중</div>
              <div className="stat-value">{stats.pending}건</div>
            </div>
            <div className="stat-card approved">
              <div className="stat-label">승인 완료</div>
              <div className="stat-value">{stats.approved}건</div>
            </div>
            <div className="stat-card rejected">
              <div className="stat-label">반려됨</div>
              <div className="stat-value">{stats.rejected}건</div>
            </div>
          </div>

          {/* 3. 필터 탭 수정 (대문자 사용) */}
          <div className="filter-tabs">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
                <button
                    key={status}
                    className={`tab-btn ${filter === status ? "active" : ""}`}
                    onClick={() => setFilter(status)}
                >
                  {status === "ALL"
                      ? "전체 보기"
                      : status === "PENDING"
                          ? "승인 대기"
                          : status === "APPROVED"
                              ? "승인 완료"
                              : "반려됨"}
                </button>
            ))}
          </div>

          {/* 리스트 영역 */}
          <div className="history-list">
            {loading ? (
                <div
                    style={{ textAlign: "center", padding: "50px", color: "#999" }}
                >
                  ⏳ 데이터를 불러오는 중입니다...
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="empty-history">
                  <span style={{ fontSize: "40px" }}>📭</span>
                  <p>해당하는 요청 내역이 없습니다.</p>
                </div>
            ) : (
                filteredRequests.map((req, index) => {
                  const reqId = req.rno || index;

                  // 4. 상태 변수 수정 (대문자 기본값)
                  const reqStatus = req.status || "PENDING";

                  const reqDate = req.regDate
                      ? req.regDate.substring(0, 10)
                      : new Date().toISOString().split("T")[0];

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
                        {/* 헤더 */}
                        <div
                            className="card-header"
                            onClick={() => toggleExpand(reqId)}
                        >
                          <div className="header-left">
                            {/* 상태별 색상 클래스 적용 (대문자 값 그대로 사용) */}
                            <div className={`status-dot ${reqStatus}`}></div>
                            <div className="req-date">{reqDate}</div>
                            <div className="req-title">{title}</div>
                          </div>
                          <div className="header-right">
                            <div className="req-amount">
                              {req.totalAmount ? req.totalAmount.toLocaleString() : 0}
                              원
                            </div>

                            {/* 5. 뱃지 텍스트 조건 수정 (대문자 검사) */}
                            <div className={`status-badge ${reqStatus}`}>
                              {reqStatus === "PENDING"
                                  ? "결재 대기"
                                  : reqStatus === "APPROVED"
                                      ? "승인됨"
                                      : "반려됨"}
                            </div>
                            <div className="arrow-icon">
                              {expandedId === reqId ? "▲" : "▼"}
                            </div>
                          </div>
                        </div>

                        {/* 상세 내용 */}
                        {expandedId === reqId && (
                            <div className="card-detail">
                              <div className="progress-stepper">
                                <div className={`step completed`}>기안 상신</div>
                                <div className="line completed"></div>

                                {/* 6. 진행 상태 바 로직 수정 (대문자 검사) */}
                                <div
                                    className={`step ${
                                        reqStatus !== "PENDING" ? "completed" : "active"
                                    }`}
                                >
                                  담당자 확인
                                </div>
                                <div
                                    className={`line ${
                                        reqStatus !== "PENDING" ? "completed" : ""
                                    }`}
                                ></div>
                                <div
                                    className={`step ${
                                        reqStatus === "APPROVED"
                                            ? "completed"
                                            : reqStatus === "REJECTED"
                                                ? "error"
                                                : ""
                                    }`}
                                >
                                  {reqStatus === "APPROVED"
                                      ? "최종 승인"
                                      : reqStatus === "REJECTED"
                                          ? "반려됨"
                                          : "승인 대기"}
                                </div>
                              </div>

                              {/* 7. 반려 사유 표시 조건 수정 (대문자 검사) */}
                              {reqStatus === "REJECTED" && (
                                  <div className="reject-alert">
                                    <strong>🚨 반려 사유:</strong>{" "}
                                    {req.rejectReason || "사유 불충분"}
                                  </div>
                              )}

                              {req.items && req.items.length > 0 && (
                                  <div className="item-table-wrapper">
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
                                            <td
                                                style={{
                                                  textAlign: "left",
                                                  paddingLeft: "10px",
                                                }}
                                            >
                                              {item.pname}
                                            </td>
                                            <td>{item.quantity}개</td>
                                            <td>
                                              {(
                                                  item.price * item.quantity
                                              ).toLocaleString()}
                                              원
                                            </td>
                                          </tr>
                                      ))}
                                      </tbody>
                                    </table>
                                  </div>
                              )}

                              <div className="memo-box">
                                <span className="label">📝 기안 메모:</span>{" "}
                                {req.reason || "없음"}
                              </div>
                            </div>
                        )}
                      </div>
                  );
                })
            )}
          </div>
        </div>
      </AppLayout>
  );
}

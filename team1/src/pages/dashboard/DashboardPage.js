import React from "react";
import AppLayout from "../../components/layout/AppLayout";
import "../../styles/layout.css";
import "../../styles/dashboard.css";

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="report-page">
        <div className="page-meta">SmartSpend ERP</div>
        <h1 className="page-title">Dashboard</h1>

        {/* 상단 통계 카드 */}
        <div className="dashboard-grid">
          <div className="panel stat-card">
            <div>
              <div className="stat-title">나의 결재 대기</div>
              <div className="stat-value">12건</div>
            </div>
            <div className="stat-footer">
              <span className="trend-up">▲ 2건</span>
              <span className="text-muted"> 어제 대비</span>
            </div>
          </div>

          <div className="panel stat-card">
            <div>
              <div className="stat-title">이번 달 예산 소진율</div>
              <div className="stat-value">45%</div>
            </div>
            <div className="stat-footer">
              <span className="trend-down" style={{ color: "var(--blue)" }}>
                안정적
              </span>
            </div>
          </div>

          <div className="panel stat-card">
            <div>
              <div className="stat-title">승인 완료</div>
              <div className="stat-value">28건</div>
            </div>
            <div className="stat-footer text-muted">이번 달 누적</div>
          </div>

          <div className="panel stat-card">
            <div>
              <div className="stat-title">비품 구매 요청</div>
              <div className="stat-value">3건</div>
            </div>
            <div className="stat-footer text-muted">처리 필요</div>
          </div>
        </div>

        {/* 하단 차트 및 목록 */}
        <div className="dashboard-row">
          <div className="panel" style={{ minHeight: "400px" }}>
            <div className="section-title">월별 지출 추이</div>
            <div
              style={{
                height: "320px",
                background: "rgba(17,24,39,0.02)",
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                color: "var(--muted)",
                fontWeight: "700",
              }}
            >
              [차트 영역 예정]
            </div>
          </div>

          <div className="panel">
            <div className="section-title">최근 요청 내역</div>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>요청자</th>
                  <th>제목</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>김유진</td>
                  <td>회식비 결제</td>
                  <td>
                    <span style={{ color: "var(--gold)" }}>대기</span>
                  </td>
                </tr>
                <tr>
                  <td>박민수</td>
                  <td>모니터 구매</td>
                  <td>
                    <span style={{ color: "var(--gold)" }}>대기</span>
                  </td>
                </tr>
                <tr>
                  <td>이영희</td>
                  <td>교통비</td>
                  <td>
                    <span style={{ color: "var(--green)" }}>승인</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

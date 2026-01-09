import { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
// 👇 방금 만든 API 임포트 (경로 확인해주세요!)
import { getMyNotifications, readNotification } from "../api/notificationApi";

// ... (기타 임포트 생략)

const BasicLayout = ({ children }) => {
  // 기존에 있던 이 부분(가짜 데이터 3개) 삭제
  // const [notifications, setNotifications] = useState([
  //   { id: 1, message: "임의 데이터...", isRead: false }, ...
  // ]);

  //빈 배열로 시작
  const [notifications, setNotifications] = useState([]);
  const [showNoti, setShowNoti] = useState(false); // 알림창 열기/닫기용

  // 1. 5초마다 서버에서 진짜 알림 가져오기 (Polling)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getMyNotifications();
        console.log("알림 데이터 수신:", data); // 확인용 로그
        setNotifications(data);
      } catch (err) {
        // 로그인이 안 되어있거나 에러나면 조용히 패스
      }
    };

    fetchNotifications(); // 최초 1회 실행
    const interval = setInterval(fetchNotifications, 5000); // 5초마다 실행
    return () => clearInterval(interval); // 청소
  }, []);

  // 2. 알림 클릭 시 (읽음 처리 + 목록에서 삭제 + 이동)
  const handleClickNotification = async (nno) => {
    try {
      // 서버에 "나 읽었어!" 신호 보내기
      await readNotification(nno);

      // 화면에서 즉시 지우기 (좀비 부활 방지)
      setNotifications((prev) => prev.filter((n) => n.nno !== nno));

      // (옵션) 클릭하면 해당 결재 내역 페이지로 이동하려면?
      // navigate("/history");
      // setShowNoti(false); // 창 닫기
    } catch (err) {
      console.error("읽음 처리 실패:", err);
    }
  };

  return (
    <div className="layout-container">
      {/* --- 헤더 영역 시작 --- */}
      <header className="p-4 bg-white shadow flex justify-between items-center z-50 relative">
        <div className="logo">Logo</div>

        {/* 종 아이콘 영역 */}
        <div className="relative">
          <div
            className="cursor-pointer relative"
            onClick={() => setShowNoti(!showNoti)} // 종 누르면 목록 열기/닫기
          >
            <FaBell className="text-2xl text-gray-600" />
            {/* 빨간 배지: 알림 있을 때만 표시 */}
            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </div>

          {/* 알림 목록 드롭다운 */}
          {showNoti && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b bg-gray-50 font-bold text-gray-700">
                알림 ({notifications.length})
              </div>
              <ul className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <li className="p-4 text-center text-gray-500 text-sm">
                    새로운 알림이 없습니다.
                  </li>
                ) : (
                  notifications.map((noti) => (
                    <li
                      key={noti.nno}
                      onClick={() => handleClickNotification(noti.nno)} // ✨ 클릭 시 삭제 함수 연결
                      className="p-3 border-b hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <p className="text-sm text-gray-800 font-medium">
                        {noti.message} {/* 서버에서 온 진짜 메시지 */}
                      </p>
                      <span className="text-xs text-gray-400 mt-1 block">
                        {/* 날짜 포맷팅 (필요시) */}
                        {new Date(noti.regDate).toLocaleString()}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </header>
      {/* --- 헤더 영역 끝 --- */}

      <main className="p-4">{children}</main>
    </div>
  );
};

export default BasicLayout;

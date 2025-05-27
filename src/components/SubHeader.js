// components/SubHeader.js
// 이 컴포넌트의 내용은 페이지마다 달라질 수 있음
const SubHeader = () => {
  return (
    <header className="bg-white border-b border-gray-200 py-3 px-6 flex justify-between items-center">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-800">
          {/* 페이지 타이틀 */}
          모니터링 대시보드
        </h1>
      </div>
      <div className="flex items-center space-x-6">
        <div className="flex items-center">
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 mr-2">
            <i className="ri-notification-3-line"></i>
          </div>
          <div className="relative">
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {/* 알림 개수 */}
              1
            </span>
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
            <i className="ri-user-line text-gray-600"></i>
          </div>
          <div>
            {/* 수정 필요 */}
            <p className="text-sm font-medium text-gray-800">김지영 의사</p>
            <p className="text-xs text-gray-500">모니터링 담당자</p>
          </div>
        </div>
        <div className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600">
          <i className="ri-settings-3-line"></i>
        </div>
      </div>
    </header>
  );
};

export default SubHeader;
// components/Navbar.js
const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-6 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="text-2xl font-pacifico text-primary">Carelink</div>
          <div className="flex space-x-6">
            {/* 라우팅 필요 */}
            <a href="#" className="text-primary font-medium">
              대시보드
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900">
              환자 관리
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900">
              통계
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900">
              설정
            </a>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-gray-900">
            <i className="ri-question-line text-xl"></i>
          </button>
          <div className="h-6 w-px bg-gray-200"></div>
          <div className="flex items-center space-x-2">
            <button>
              {/* <a href="org_list"> */}
              <span className="text-sm text-gray-500">순천향대병원</span> {/* 기관명 들어가야함 */}
              {/* <i className="ri-arrow-down-s-line text-gray-400"></i> */}
              {/* </a> */}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
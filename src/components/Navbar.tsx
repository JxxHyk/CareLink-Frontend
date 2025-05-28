// src/components/Navbar.tsx
import React from 'react'; // .tsx 파일이므로 React import
import Link from 'next/link'; // Next.js의 Link 컴포넌트 사용 (선택 사항)

// --- 공통 타입 정의 (Layout.tsx, SubHeader.tsx와 동일한 타입을 사용해야 함) ---
// 이상적으로는 src/types/index.ts 같은 파일에 한번만 정의하고 각 파일에서 import
interface OrganizationInfo {
  id: number; // 또는 string, 백엔드 응답에 맞춰서
  name: string;
}

interface User {
  name: string;         // 사용자 이름 (예: full_name 또는 username)
  role: string;         // 사용자 역할 (예: user_type)
  organization?: OrganizationInfo | null; // 사용자가 속한 기관 정보
  // id?: string;
  // is_superuser?: boolean;
}
// --- 공통 타입 정의 끝 ---

// Navbar 컴포넌트가 받을 props들의 타입을 정의
interface NavbarProps {
  currentUser: User | null; // 현재 로그인한 사용자 정보
}

const Navbar = ({ currentUser }: NavbarProps) => {
  // currentUser 객체에서 기관 이름을 가져옴. 없으면 기본값 또는 다른 문구 사용.
  const organizationName = currentUser?.organization?.name || "기관 정보 없음"; // 기본값 설정

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-6 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          {/* 로고 부분 - Link 컴포넌트를 사용해서 홈으로 가게 할 수도 있음 */}
          <Link href="/" className="text-2xl font-pacifico text-primary">
            CareLink
          </Link>
          <div className="flex space-x-6">
            {/* 각 메뉴도 나중에는 Link 컴포넌트로 실제 경로 연결 필요 */}
            <Link href="/" className="text-primary font-medium">
              대시보드
            </Link>
            <Link href="/patients" className="text-gray-500 hover:text-gray-900"> {/* 예시 경로 */}
              환자 관리
            </Link>
            {/* <Link href="/statistics" className="text-gray-500 hover:text-gray-900"> {/* 예시 경로
              통계
            </Link>
             */}
            <Link href="/settings" className="text-gray-500 hover:text-gray-900"> {/* 예시 경로 */}
              설정
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-gray-900">
            <i className="ri-question-line text-xl"></i>
          </button>
          <div className="h-6 w-px bg-gray-200"></div>
          <div className="flex items-center space-x-2">
            {/* 기관 이름 부분 - 버튼으로 감쌀 필요가 없다면 span으로 바로 표시해도 됨 */}
            {/* 만약 클릭 시 기관 목록을 보여주는 등의 기능이 있다면 button 유지 */}
            <span className="text-sm text-gray-500">
              {organizationName} {/* 👈 하드코딩된 이름 대신 변수 사용! */}
            </span>
            {/* 드롭다운 기능이 있다면 이 아이콘을 사용 */}
            {/* <i className="ri-arrow-down-s-line text-gray-400"></i> */}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
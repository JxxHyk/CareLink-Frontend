// src/components/Navbar.tsx
import React from 'react'; // .tsx 파일이므로 React import
import Link from 'next/link'; // Next.js의 Link 컴포넌트 사용

// ✨ src/types/index.ts에서 정의한 CurrentUser와 IdNamePair를 import
import { CurrentUser, IdNamePair } from '@/types';

// Navbar 컴포넌트가 받을 props들의 타입을 정의
interface NavbarProps {
  // ✨ currentUser의 타입을 User | null 에서 CurrentUser | null 로 변경
  currentUser: CurrentUser | null;
}

const Navbar = ({ currentUser }: NavbarProps) => {
  // currentUser 객체에서 기관 이름을 가져옴. 없으면 기본값 또는 다른 문구 사용.
  // CurrentUser 타입에는 organization이 IdNamePair로 되어 있으므로 접근 방식은 동일
  const organizationName = currentUser?.organization?.name || "기관 정보 없음";

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
            <Link href="/patients" className="text-gray-500 hover:text-gray-900">
              환자 관리
            </Link>
            <Link href="/settings" className="text-gray-500 hover:text-gray-900">
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
            <span className="text-sm text-gray-500">
              {organizationName}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
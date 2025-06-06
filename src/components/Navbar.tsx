// src/components/Navbar.tsx
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CurrentUser, IdNamePair } from '@/types';

interface NavbarProps {
  currentUser: CurrentUser | null;
}

const Navbar = ({ currentUser }: NavbarProps) => {
  const pathname = usePathname(); // 현재 경로를 가져옴

  const organizationName = currentUser?.organization?.name || "기관 정보 없음";

  // ✨ 현재 경로에 따라 링크의 클래스 이름을 결정하는 헬퍼 함수
  const getLinkClassName = (href: string) => {
    // pathname이 null일 경우를 대비하여 빈 문자열로 처리하거나 적절히 대체
    // 여기서는 pathname이 null이면 어떤 링크도 활성으로 간주하지 않음
    const currentPath = pathname || ''; // null일 경우 빈 문자열로 처리

    const isActive = currentPath === href || (href !== '/' && currentPath.startsWith(href));
    
    return `text-base font-medium transition-colors duration-200 ${
      isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
    }`;
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-6 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-2xl font-pacifico text-primary">
            CareLink
          </Link>
          <div className="flex space-x-6">
            <Link href="/" className={getLinkClassName('/')}>
              대시보드
            </Link>
            <Link href="/patients" className={getLinkClassName('/patients')}>
              환자 관리
            </Link>
            <Link href="/settings" className={getLinkClassName('/settings')}>
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
// src/components/Navbar.tsx
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CurrentUser, IdNamePair } from '@/types';
import { UserType } from '@/types/enums'; // ✨ UserType Enum import!

interface NavbarProps {
  currentUser: CurrentUser | null;
}

const Navbar = ({ currentUser }: NavbarProps) => {
  const pathname = usePathname();
  const organizationName = currentUser?.organization?.name || "기관 정보 없음";

  // ✨ 현재 로그인한 사용자의 역할 확인 (없으면 기본값 설정)
  const userRole = currentUser?.user_type;

  const getLinkClassName = (href: string) => {
    const currentPath = pathname || '';
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

            {/* ✨ userRole이 UserType.STAFF가 아닐 때만 '환자 관리' 링크 렌더링 */}
            {userRole !== UserType.STAFF && (
              <Link href="/patients" className={getLinkClassName('/patients')}>
                환자 관리
              </Link>
            )}

            {/* 설정 탭은 일단 나중에 구현해도 되니 여기 그대로 두자 */}
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
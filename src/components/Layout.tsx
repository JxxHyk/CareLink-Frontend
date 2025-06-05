// src/components/Layout.tsx
import React from 'react';
// ✨ src/types/index.ts에서 정의한 CurrentUser와 IdNamePair를 import
import { CurrentUser, IdNamePair } from '@/types';

import Navbar from './Navbar';     // Navbar.js 또는 Navbar.tsx (currentUser prop을 받도록 수정 필요)
import SubHeader from './SubHeader'; // SubHeader.js 또는 SubHeader.tsx (currentUser prop을 받도록 수정 필요)

// --- 공통 타입 정의 삭제 (이제 src/types/index.ts에서 관리) ---
// interface OrganizationInfo {
//   id: number;
//   name: string;
// }
// interface User {
//   name: string;
//   role: string;
//   organization?: OrganizationInfo | null;
// }
// --- 공통 타입 정의 끝 ---

// Layout 컴포넌트가 받을 props들의 타입을 정의
interface LayoutProps {
  // ✨ currentUser의 타입을 User | null 에서 CurrentUser | null 로 변경
  currentUser: CurrentUser | null;
  children: React.ReactNode; // 페이지의 실제 내용
}

const Layout = ({ children, currentUser }: LayoutProps) => {
  return (
    <div className="flex flex-col h-screen">
      {/* Navbar와 SubHeader에 currentUser 정보를 그대로 전달 */}
      {/* 이 부분도 Navbar와 SubHeader 컴포넌트의 props 타입이 CurrentUser를 받도록 수정되어야 합니다. */}
      <Navbar currentUser={currentUser} />
      <SubHeader currentUser={currentUser} />
      <main className="flex flex-1 overflow-y-auto"> {/* overflow-hidden은 로그인 페이지 잘림 문제 해결 후 다시 넣어도 됨 */}
        {children}
      </main>
    </div>
  );
};

export default Layout;
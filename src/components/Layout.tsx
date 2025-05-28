// src/components/Layout.tsx
import React from 'react';
import Navbar from './Navbar';     // Navbar.js 또는 Navbar.tsx (currentUser prop을 받도록 수정 필요)
import SubHeader from './SubHeader'; // SubHeader.js 또는 SubHeader.tsx (currentUser prop을 받도록 수정 필요)

// --- 공통 타입 정의 (원래는 별도 types.ts 파일에 있는 것이 좋음) ---
interface OrganizationInfo {
  id: number; // 또는 string, 백엔드 응답에 맞춰서
  name: string;
}

// User 인터페이스는 Navbar와 SubHeader에 필요한 모든 정보를 포함해야 함
// page.tsx에서 currentUser 상태를 만들 때 이 구조로 데이터를 넣어줘야 함
interface User {
  name: string;         // 사용자 이름 (예: full_name 또는 username)
  role: string;         // 사용자 역할 (예: user_type)
  organization?: OrganizationInfo | null; // 사용자가 속한 기관 정보 (선택 사항)
  // id?: string;
  // is_superuser?: boolean; // 필요하다면 슈퍼유저 여부 등 추가
}
// --- 공통 타입 정의 끝 ---

// Layout 컴포넌트가 받을 props들의 타입을 정의
interface LayoutProps {
  children: React.ReactNode; // 페이지의 실제 내용
  currentUser: User | null;  // 현재 로그인한 사용자 정보 (User 타입 또는 null)
}

const Layout = ({ children, currentUser }: LayoutProps) => {
  return (
    <div className="flex flex-col h-screen">
      {/* Navbar와 SubHeader에 currentUser 정보를 그대로 전달 */}
      <Navbar currentUser={currentUser} />
      <SubHeader currentUser={currentUser} />
      <main className="flex flex-1 overflow-y-auto"> {/* overflow-hidden은 로그인 페이지 잘림 문제 해결 후 다시 넣어도 됨 */}
        {children}
      </main>
    </div>
  );
};

export default Layout;
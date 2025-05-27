// src/components/Layout.tsx
import React from 'react'; // ReactNode 타입을 위해 import
import Navbar from './Navbar';
import SubHeader from './SubHeader';

// User 타입을 여기서도 정의해주거나, page.tsx와 공유하는 types 파일에서 import 해야 해.
// page.tsx에 정의된 User 타입과 동일해야 함!
interface User {
  name: string;
  role: string;
  // id?: string; // 필요하다면 page.tsx의 User 타입과 동일하게
}

// Layout 컴포넌트가 받을 props들의 타입을 정의
interface LayoutProps {
  children: React.ReactNode; // 모든 React 컴포넌트는 children을 받을 수 있음
  currentUser: User | null;  // currentUser prop을 받는다고 명시!
}

// 이제 Layout 컴포넌트는 LayoutProps 타입을 따르는 props를 받음
const Layout = ({ children, currentUser }: LayoutProps) => {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      {/* SubHeader에도 currentUser prop을 전달해야 하므로,
          SubHeader.js도 SubHeader.tsx로 바꾸고 props 타입을 정의해주는 것이 좋아! */}
      <SubHeader currentUser={currentUser} />
      <main className="flex flex-1">{children}</main>
    </div>
  );
};

export default Layout;
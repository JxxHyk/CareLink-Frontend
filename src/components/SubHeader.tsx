// src/components/SubHeader.tsx
import { UserRoleType } from '@/app/page';
import React from 'react';

// User 및 OrganizationInfo 인터페이스 정의 또는 import
// Layout.tsx와 동일한 User 타입을 사용해야 함!
interface OrganizationInfo {
  id: number;
  name: string;
}

// User 타입을 여기서도 정의하거나 import
interface User {
  name: string;
  role: UserRoleType;
  organization?: OrganizationInfo | null;
}

// 역할 코드에 따른 한국어 이름 매핑 객체
const roleDisplayNames: { [key in UserRoleType]?: string } = {
  "super_admin": "시스템 관리자",
  "admin": "관리자",
  "staff": "직원"
};

interface SubHeaderProps {
  currentUser: User | null;
}

const SubHeader = ({ currentUser }: SubHeaderProps) => {
  const displayName = currentUser ? currentUser.name : '사용자'; // 기본값 설정
  const displayRole = currentUser?.role ? (roleDisplayNames[currentUser.role] || '담당자') : '정보 없음';


  return (
    <header className="bg-white border-b border-gray-200 py-3 px-6 flex justify-between items-center">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-800">
          모니터링 대시보드
        </h1>
      </div>
      <div className="flex items-center space-x-6">
        {/* ... (알림 아이콘 등) ... */}
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
            <i className="ri-user-line text-gray-600"></i>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{displayName}</p>
            <p className="text-xs text-gray-500">{displayRole}</p>
          </div>
        </div>
        {/* ... (설정 아이콘 등) ... */}
      </div>
    </header>
  );
};

export default SubHeader;
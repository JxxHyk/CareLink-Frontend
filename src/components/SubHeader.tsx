// src/components/SubHeader.tsx
import React from 'react';

// User 타입을 여기서도 정의하거나 import
interface User {
  name: string;
  role: string;
}

interface SubHeaderProps {
  currentUser: User | null;
}

const SubHeader = ({ currentUser }: SubHeaderProps) => {
  const displayName = currentUser ? currentUser.name : '사용자'; // 기본값 설정
  const displayRole = currentUser ? currentUser.role : '정보 없음'; // 기본값 설정

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
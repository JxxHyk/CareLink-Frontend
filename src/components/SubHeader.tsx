// src/components/SubHeader.tsx
import React from 'react';
import { CurrentUser } from '@/types'; // 인터페이스는 index.ts에서 가져옴
import { UserType } from '@/types/enums'; // ✨ UserRole은 enums.ts에서 가져옴

// 역할 코드에 따른 한국어 이름 매핑 객체
// ✨ UserType Enum을 키 타입으로 사용
const roleDisplayNames: { [key in UserType]?: string } = {
  [UserType.SUPER_ADMIN]: "시스템 관리자",
  [UserType.ADMIN]: "관리자",
  [UserType.STAFF]: "보호자",
};

interface SubHeaderProps {
  // ✨ currentUser의 타입을 User | null 에서 CurrentUser | null 로 변경
  currentUser: CurrentUser | null;
}

const SubHeader = ({ currentUser }: SubHeaderProps) => {
  // CurrentUser 타입에는 full_name이 있으므로 name 대신 full_name 사용을 고려.
  // 아니면 CurrentUser 타입에 name 필드를 추가하여 일관성 유지.
  // 여기서는 일단 기존 코드의 displayName 로직에 맞춰 full_name을 사용하도록 함.
  const displayName = currentUser ? currentUser.full_name : '사용자'; // 기본값 설정
  // ✨ currentUser.user_type을 사용하여 roleDisplayNames에서 매핑
  const displayRole = currentUser?.user_type ? (roleDisplayNames[currentUser.user_type] || '담당자') : '정보 없음';

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-6 flex justify-between items-center">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-800">
          모니터링 시스템
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
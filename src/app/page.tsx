// src/app/page.tsx
"use client";

import { useAuth } from '@/hooks/useAuth';
import { usePatients } from '@/hooks/usePatients';

import MyCustomLayout from '@/components/Layout';
import PatientList from '@/components/PatientList';
import PatientDetail from '@/components/PatientDetail';

export default function HomePage() {
  const { isAuthenticated, isLoadingAuth, currentUser, authToken, logout } = useAuth();
  const {
    displayedPatients,
    isLoadingPatients,
    selectedPatientId,
    setSelectedPatientId,
    searchTerm,
    setSearchTerm,
    sortCriteria,
    setSortCriteria,
    handleRefreshPatients,
  } = usePatients(currentUser, authToken);

  const selectedPatient = selectedPatientId !== null
    ? displayedPatients.find(p => p.patient_id === selectedPatientId) || null
    : null;

  // 인증 로딩 상태 처리
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl">
        인증 상태 확인 중...
      </div>
    );
  }

  // 인증되지 않았고, 로그인/회원가입 페이지가 아니라면 아무것도 렌더링하지 않음 (useAuth 훅에서 리다이렉트 처리)
  if (!isAuthenticated && typeof window !== "undefined" && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
    return null;
  }

  // 인증은 되었지만 currentUser 정보가 아직 없거나 (매우 짧은 순간)
  // 또는 환자 데이터 로딩 중인 경우
  if (!currentUser || isLoadingPatients) {
    return (
      <MyCustomLayout currentUser={currentUser}>
        <div className="flex items-center justify-center h-full w-full text-xl p-8">
          환자 목록 로딩 중...
        </div>
      </MyCustomLayout>
    );
  }

  // displayedPatients가 배열임을 확인하는 로직 (안전성을 위해 유지)
  if (!Array.isArray(displayedPatients)) {
      console.warn("displayedPatients가 배열이 아닙니다. 다시 시도합니다.");
      return (
        <MyCustomLayout currentUser={currentUser}>
            <div className="flex items-center justify-center h-full w-full text-xl p-8">
                데이터를 준비 중입니다...
            </div>
        </MyCustomLayout>
      );
  }

  return (
    <MyCustomLayout currentUser={currentUser}>
      <>
        {/* 환자 목록 섹션 */}
        <div className="w-[320px] border-r border-gray-200 bg-white flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-200 space-y-2">
            <button
              onClick={logout}
              className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              로그아웃
            </button>
          </div>
          <PatientList
            patients={displayedPatients}
            onSelectPatient={(patient) => setSelectedPatientId(patient.patient_id)}
            selectedPatientId={selectedPatientId}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSort={setSortCriteria}
            activeSort={sortCriteria}
            onRefresh={handleRefreshPatients}
          />
        </div>
        {/* 환자 상세 정보 섹션 */}
        <div className="flex-1 bg-gray-50 flex flex-col overflow-y-auto">
          {selectedPatient ? (
            <PatientDetail patient={selectedPatient} />
          ) : (
            <div className="p-6 flex-1 flex items-center justify-center">
              <p className="text-gray-500">
                {displayedPatients.length === 0 ? '표시할 환자 데이터가 없습니다.' : '목록에서 환자를 선택해주세요.'}
              </p>
            </div>
          )}
        </div>
      </>
    </MyCustomLayout>
  );
}
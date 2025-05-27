// src/app/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// 컴포넌트 import
import MyCustomLayout from '@/components/Layout'; // 대시보드 전체 레이아웃
import LoginPage from '@/components/LoginPage';    // 로그인 페이지 UI
import PatientList from '@/components/PatientList';
import PatientDetail from '@/components/PatientDetail';

// 목업 데이터 (실제로는 로그인 후 API로 환자 데이터 가져와야 함)
import { initialPatients } from '@/lib/mockData';

// 타입 정의
interface User {
  name: string;
  role: string;
  // id?: string; // FastAPI /me 응답에 따라 추가 가능
}

interface Patient {
  id: string;
  name: string;
  age: number;
  room: string;
  risk: 'high' | 'medium' | 'low';
  heartRate: number;
  temperature: number;
  fallStatus: 'normal' | 'alert';
  lastUpdated: string;
  heartRateHistory: number[];
  temperatureHistory: number[];
  gyro: { x: number; y: number; z: number };
  lastMovement: string;
  movementPattern: string;
  gps: {
    lat: string;
    long: string;
    address: string;
    timestamp: string;
  };
}

// 대시보드 내용을 표시하는 내부 컴포넌트
function DashboardView({ onLogout, currentUser }: { onLogout: () => void; currentUser: User | null }) {
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortCriteria, setSortCriteria] = useState<string>('risk');

  // currentUser가 있고 (즉, 로그인 성공), allPatients가 비어있을 때만 목업 데이터 로드
  useEffect(() => {
    if (currentUser && allPatients.length === 0) {
      // 실제 앱에서는 여기서 currentUser의 토큰을 사용해 환자 데이터를 API로 가져와야 함
      // 지금은 목업 데이터를 사용
      setAllPatients(initialPatients as Patient[]);
    }
  }, [currentUser, allPatients.length]); // currentUser가 변경되거나 allPatients.length가 0일때 재확인

  const displayedPatients = useMemo(() => {
    let filtered = allPatients;
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    const sorted = [...filtered];
    if (sortCriteria === 'risk') {
      const riskOrder: { [key in Patient['risk']]: number } = { high: 0, medium: 1, low: 2 };
      sorted.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);
    } else if (sortCriteria === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortCriteria === 'heart') {
      sorted.sort((a, b) => b.heartRate - a.heartRate);
    } else if (sortCriteria === 'temp') {
      sorted.sort((a, b) => b.temperature - a.temperature);
    }
    return sorted;
  }, [allPatients, searchTerm, sortCriteria]);

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return allPatients.find(p => p.id === selectedPatientId) || null;
  }, [allPatients, selectedPatientId]);

  useEffect(() => {
    if (displayedPatients.length > 0) {
      if (!selectedPatientId || !displayedPatients.find(p => p.id === selectedPatientId)) {
        setSelectedPatientId(displayedPatients[0].id);
      }
    } else {
      setSelectedPatientId(null);
    }
  }, [displayedPatients, selectedPatientId]);

  useEffect(() => {
    if (allPatients.length === 0) return; // 환자 데이터 없으면 실행 안 함

    const interval = setInterval(() => {
      setAllPatients(prevPatients =>
        prevPatients.map(p => {
          if (Math.random() < 0.2) { // 20% 확률로 데이터 변경
            const newHeartRate = Math.floor(Math.random() * (130 - 50 + 1)) + 50;
            const newTemperature = parseFloat((Math.random() * (40.0 - 35.0) + 35.0).toFixed(1));
            let newRisk: Patient['risk'] = p.risk;
            if (newHeartRate > 100 || newTemperature > 38.5) newRisk = 'high';
            else if (newHeartRate > 85 || newTemperature > 37.5) newRisk = 'medium';
            else newRisk = 'low';
            const newHeartRateHistory = [...p.heartRateHistory.slice(1), newHeartRate];
            const newTemperatureHistory = [...p.temperatureHistory.slice(1), newTemperature];
            return {
              ...p,
              heartRate: newHeartRate, temperature: newTemperature, risk: newRisk,
              lastUpdated: 'just now', heartRateHistory: newHeartRateHistory,
              temperatureHistory: newTemperatureHistory,
              gyro: { x: parseFloat((Math.random()*1-0.5).toFixed(2)), y: parseFloat((Math.random()*1-0.5).toFixed(2)), z: parseFloat((Math.random()*0.4+0.8).toFixed(2)) },
              fallStatus: (newRisk === 'high' && Math.random() < 0.3) ? 'alert' : p.fallStatus,
            };
          }
          return p;
        })
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [allPatients]);

  const handleSelectPatient = (patient: Patient) => setSelectedPatientId(patient.id);
  const handleSort = (criteria: string) => setSortCriteria(criteria);

  return (
    <MyCustomLayout currentUser={currentUser}> {/* MyCustomLayout으로 감싸기 */}
      <>
        <div className="w-[320px] border-r border-gray-200 bg-white flex flex-col shrink-0">
          <div className="p-4 border-b">
            <button onClick={onLogout} className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600">
                로그아웃
            </button>
          </div>
          <PatientList
            patients={displayedPatients}
            onSelectPatient={handleSelectPatient}
            selectedPatientId={selectedPatientId}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSort={handleSort}
            activeSort={sortCriteria}
          />
        </div>
        <div className="flex-1 bg-gray-50 flex flex-col overflow-y-auto">
          {selectedPatient ? (
            <PatientDetail patient={selectedPatient} />
          ) : (
            <div className="p-6 flex-1 flex items-center justify-center">
              <p className="text-gray-500">
                {allPatients.length > 0 && displayedPatients.length === 0 ? '검색 결과가 없습니다.' :
                 allPatients.length === 0 && currentUser ? '환자 데이터가 없습니다. (초기 로딩 또는 빈 데이터)' :
                 !currentUser ? '' : // 이 경우는 MainPage에서 처리됨
                 '목록에서 환자를 선택해주세요.'}
              </p>
            </div>
          )}
        </div>
      </>
    </MyCustomLayout>
  );
}


// --- 메인 페이지 라우팅 및 인증 관리 ---
export default function MainPageController() { // 기존 MainPage에서 이름 변경 (혼동 방지)
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true); // 인증 상태 확인 중 로딩
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // 앱이 처음 로드될 때 localStorage에서 인증 정보 확인
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem('authToken');
      const storedUserJson = localStorage.getItem('currentUser');

      if (storedToken && storedUserJson) {
        // TODO: 여기서 storedToken의 유효성을 백엔드 /me API 등을 호출해서 실제로 검증하는 로직 추가 권장
        // 지금은 토큰이 존재하면 일단 로그인된 것으로 간주
        try {
          setCurrentUser(JSON.parse(storedUserJson));
          setAuthToken(storedToken);
          setIsAuthenticated(true);
        } catch (e) {
          console.error("저장된 사용자 정보 파싱 오류, 로그아웃 처리:", e);
          localStorage.clear(); // 잘못된 정보면 모두 삭제하고 로그아웃 상태로
          setIsAuthenticated(false);
        }
      } else {
        // 저장된 토큰이나 사용자 정보가 없으면 로그인하지 않은 것으로 간주
        // 현재 경로가 /login이 아니라면 /login으로 리다이렉트
        if (window.location.pathname !== '/login') {
          router.replace('/login');
        }
      }
      setIsLoadingAuth(false); // 인증 상태 확인 완료
    }
  }, [router]);

  // 로그인 성공 시 호출되는 함수
  const handleLoginSuccess = (token: string, userData: User) => {
    setIsAuthenticated(true);
    setCurrentUser(userData);
    setAuthToken(token);
    if (typeof window !== "undefined") {
      localStorage.setItem('isAuthenticated', 'true'); // 간단한 플래그
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(userData));
    }
    router.push('/'); // 로그인 성공 후 메인 대시보드 페이지('/')로 이동
  };

  // 로그아웃 시 호출되는 함수
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setAuthToken(null);
    router.replace('/login'); // 로그아웃 후 로그인 페이지로 이동
  };

  // 인증 상태 확인 중일 때 로딩 화면 표시
  if (isLoadingAuth) {
    return <div className="flex items-center justify-center min-h-screen text-xl">인증 상태 확인 중...</div>;
  }

  // 인증되지 않았고, 현재 경로가 /login이 아니라면 LoginPage를 보여주기 전에 리다이렉트가 발생함.
  // 이 로직은 주로 /login 경로 자체는 src/app/login/page.tsx가 처리하도록 하고,
  // 다른 경로로 접근 시 인증되지 않았으면 /login으로 보내는 역할.
  // 하지만 지금은 / 가 유일한 경로이므로, 아래 조건은 /login으로 리다이렉트 된 후,
  // src/app/login/page.tsx 가 렌더링되게 됨.
  if (!isAuthenticated) {
    // 현재 경로가 /login 이라면 해당 페이지가 렌더링 될 것이므로 null 또는 로딩 반환
    // 아니라면 이미 useEffect에서 /login으로 redirect 시켰을 것임.
    // 이 컴포넌트(MainPageController)는 / 경로를 담당하므로,
    // 인증 안됐으면 /login으로 보내는 로직이 useEffect에 이미 있음.
    // 만약 /login 페이지에서 이 컴포넌트를 사용하지 않는다면,
    // 이 조건은 사용자가 /로 왔지만 아직 redirect 전인 짧은 순간에만 해당될 수 있음.
    // console.log("MainPageController: Not authenticated, should be redirecting or rendering LoginPage via /login route.");
    // router.replace('/login'); // useEffect에서 이미 처리하고 있으므로 중복일 수 있음.
    return <div className="flex items-center justify-center min-h-screen text-xl">로그인이 필요합니다. 로그인 페이지로 이동합니다...</div>; // 리다이렉트 될 때까지 잠시 보일 수 있음
  }

  // 인증된 사용자에게 대시보드 뷰 표시
  return <DashboardView onLogout={handleLogout} currentUser={currentUser} />;
}
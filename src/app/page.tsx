// src/app/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// 컴포넌트 import
import MyCustomLayout from '@/components/Layout';
// LoginPage는 src/app/login/page.tsx 에서 직접 렌더링되므로, 여기서는 직접 import/사용 안 함.
import PatientList from '@/components/PatientList';
import PatientDetail from '@/components/PatientDetail';

// 목업 데이터 import
import { initialPatientProfiles } from '@/lib/patientInfoMockData'; // 환자 기본 정보
import { timeSeriesData } from '@/lib/timeSeriesMockData';         // 환자 시계열 정보

// --- 타입 정의 (실제로는 src/types/index.ts 같은 곳에서 import 권장) ---
interface OrganizationInfo {
  id: number;
  name: string;
}

interface User {
  name: string;
  role: string;
  organization?: OrganizationInfo | null;
  // is_superuser?: boolean;
}

interface Patient {
  patient_id: number; // DB와 일치 (숫자)
  full_name: string;  // DB와 일치
  age: number;
  // room: string;       // 이 필드가 patientInfoMockData 또는 API 응답에 있는지 확인
  risk: 'high' | 'medium' | 'low'; // 이 필드가 patientInfoMockData 또는 API 응답에 있는지 확인
  heartRate: number | null;
  temperature: number | null;
  fallStatus: 'normal' | 'alert' | null; // 이 필드가 patientInfoMockData 또는 API 응답에 있는지 확인
  lastUpdated: string; // 이 필드가 patientInfoMockData 또는 API 응답에 있는지 확인
  heartRateHistory: number[] | null;
  temperatureHistory: number[] | null;
  gyro: { x: number; y: number; z: number }; // API 응답 구조 확인
  lastMovement: string; // API 응답 구조 확인
  movementPattern: string; // API 응답 구조 확인
  gps: { lat: string; long: string; address: string; timestamp: string; }; // API 응답 구조 확인
  organization_id?: number;
  patient_code?: string;
  // created_at?: string | Date;
  // updated_at?: string | Date;
}
// --- 타입 정의 끝 ---


// --- 데이터를 FastAPI 백엔드에서 가져오는 비동기 함수 ---
async function fetchAllPatientsFromAPI(token: string | null, organizationId: number | undefined): Promise<Patient[]> {
  if (!token) {
    console.warn("Auth token not found, cannot fetch patients from API.");
    return [];
  }
  if (organizationId === undefined || organizationId === null) {
    console.warn("Organization ID not found, cannot fetch patients for a specific organization.");
    // 여기에 모든 기관의 환자를 가져오는 API를 호출하거나, 빈 배열을 반환할 수 있습니다.
    // 지금은 특정 기관 환자만 가져온다고 가정하고 빈 배열 반환.
    return [];
  }

  // !!! 중요 !!!: 실제 FastAPI 환자 목록 API 엔드포인트 주소로 변경하세요.
  // 이 API는 특정 기관의 환자 목록을 반환해야 합니다. (예: /api/v1/organizations/{org_id}/patients/ 또는 /api/v1/patients?organization_id={org_id})
  const PATIENTS_API_URL = `http://127.0.0.1:8000/api/v1/patients/?organization_id=${organizationId}`; // 기관 ID로 필터링하는 API라고 가정

  try {
    console.log(`Fetching patients for organization ID ${organizationId} from API: ${PATIENTS_API_URL}`);
    const response = await fetch(PATIENTS_API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error("Patient list API request failed:", response.status, await response.text());
      return [];
    }
    const data = await response.json();
    console.log(`API response for organization ID ${organizationId}:`, data);
    
    // API 응답 데이터가 Patient[] 타입과 일치하는지 확인하고, 필요시 변환
    // 예: API가 patient_id, full_name 대신 id, name을 보낸다면 여기서 매핑
    return (data as any[]).map(apiPatient => ({
        ...apiPatient, // API에서 온 다른 필드들
        patient_id: apiPatient.patient_id || apiPatient.id, // API 필드명에 따라
        full_name: apiPatient.full_name || apiPatient.name, // API 필드명에 따라
        // heartRate, temperature 등은 API 응답에 최신값이 current_... 형태로 올 수 있음
        heartRate: apiPatient.current_heart_rate ?? null,
        temperature: apiPatient.current_temperature ?? null,
        fallStatus: apiPatient.current_fall_status ?? null,
        // 히스토리 데이터도 API에서 직접 받아오거나, 초기에는 빈 배열 또는 null
        heartRateHistory: Array.isArray(apiPatient.heart_rate_history) ? apiPatient.heart_rate_history : [],
        temperatureHistory: Array.isArray(apiPatient.temperature_history) ? apiPatient.temperature_history : [],
        // Patient 타입에 정의된 다른 모든 필드들을 API 응답에 맞춰 채워야 함
    })) as Patient[];

  } catch (error) {
    console.error("Network or other error during patient list API call:", error);
    return [];
  }
}


// --- 대시보드 내용을 표시하는 내부 컴포넌트 ---
function DashboardView({ onLogout, currentUser, authToken }: {
  onLogout: () => void;
  currentUser: User | null;
  authToken: string | null;
}) {
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(true);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortCriteria, setSortCriteria] = useState<string>('risk');
  const [currentTimeIndex, setCurrentTimeIndex] = useState<number>(0); // 시계열 목업 데이터용 인덱스

  // 환자 데이터 로딩 (컴포넌트 마운트 또는 사용자 변경 시)
  useEffect(() => {
    const loadPatients = async () => {
      if (currentUser && authToken) {
        setIsLoadingPatients(true);
        let patientsDataToSet: Patient[] = [];
        const currentOrganizationId = currentUser.organization?.id;

        if (currentOrganizationId === 1) { // 기관 ID 1번이면 목업 데이터 조합
          console.log("Org ID 1: Loading and combining mock patient profiles and time series data.");
          patientsDataToSet = initialPatientProfiles.map(profile => {
            const series = timeSeriesData[profile.patient_id as keyof typeof timeSeriesData];
            return {
              ...profile, // 기본 프로필 정보 (patient_id, full_name 등 Patient 타입과 일치해야 함)
              // patientInfoMockData.js의 initialPatientProfiles의 필드들이 Patient 인터페이스와 일치해야 함!
              // 예를 들어, initialPatientProfiles에 heartRate, temperature 최신값이 이미 있다면 그걸 사용.
              // 없다면 여기서 null이나 기본값 설정.
              heartRate: profile.heartRate ?? null,
              temperature: profile.temperature ?? null,
              heartRateHistory: series?.heartRate || [],
              temperatureHistory: series?.temperature || [],
            } as Patient; // Patient 타입으로 단언
          });
          setCurrentTimeIndex(0); // 목업 데이터용 타임 인덱스 초기화
        } else if (currentOrganizationId) { // 다른 기관 ID는 API 호출
          console.log(`Org ID ${currentOrganizationId}: Fetching data from API.`);
          patientsDataToSet = await fetchAllPatientsFromAPI(authToken, currentOrganizationId);
        } else {
          console.warn("Current user has no organization ID. Cannot load patient data.");
        }
        
        setAllPatients(patientsDataToSet);
        setIsLoadingPatients(false);
      } else {
        setAllPatients([]); // 로그아웃 상태 등에서는 빈 배열
        setIsLoadingPatients(false);
      }
    };
    loadPatients();
  }, [currentUser, authToken]);

  // 새로고침 함수
  const handleRefreshPatients = async () => {
    if (currentUser && authToken) {
      setIsLoadingPatients(true);
      let patientsDataToSet: Patient[] = [];
      const currentOrganizationId = currentUser.organization?.id;

      if (currentOrganizationId === 1) {
        console.log("Refresh: Org ID 1 - Reloading and combining mock data.");
        await new Promise(resolve => setTimeout(resolve, 300)); // 인위적 딜레이
        patientsDataToSet = initialPatientProfiles.map(profile => {
          const series = timeSeriesData[profile.patient_id as keyof typeof timeSeriesData];
          return { ...profile, heartRate: profile.heartRate ?? null, temperature: profile.temperature ?? null, heartRateHistory: series?.heartRate || [], temperatureHistory: series?.temperature || [] } as Patient;
        });
        setCurrentTimeIndex(0);
      } else if (currentOrganizationId) {
        console.log(`Refresh: Org ID ${currentOrganizationId} - Refetching API data.`);
        patientsDataToSet = await fetchAllPatientsFromAPI(authToken, currentOrganizationId);
      }
      setAllPatients(patientsDataToSet);
      setIsLoadingPatients(false);
    }
  };

  // 시계열 목업 데이터 업데이트 시뮬레이션 (기관 ID 1번 전용)
  useEffect(() => {
    if (currentUser?.organization?.id !== 1 || allPatients.length === 0 || isLoadingPatients) {
      return; 
    }

    const interval = setInterval(() => {
      setAllPatients(prevPatients =>
        prevPatients.map(p => {
          if (p.organization_id !== 1) return p; // 기관 ID 1번 환자만 시뮬레이션

          const series = timeSeriesData[p.patient_id as keyof typeof timeSeriesData];
          if (series && Array.isArray(series.heartRate) && Array.isArray(series.temperature)) {
            const timeSeriesLength = Math.min(series.heartRate.length, series.temperature.length);
            if (currentTimeIndex >= timeSeriesLength) {
              console.log(`Patient ${p.patient_id}: End of mock time series data. Resetting index.`);
              setCurrentTimeIndex(0); // 인덱스 초기화 또는 다른 처리
              return { // 마지막 값으로 고정 또는 다른 값으로 초기화
                ...p,
                heartRate: series.heartRate[timeSeriesLength -1] || null,
                temperature: series.temperature[timeSeriesLength -1] || null,
                lastUpdated: 'No new data',
              };
            }

            const newHeartRate = series.heartRate[currentTimeIndex];
            const newTemperature = series.temperature[currentTimeIndex];

            let newRisk: Patient['risk'] = p.risk;
            if ((newHeartRate || 0) > 100 || (newTemperature || 0) > 38.5) newRisk = 'high';
            else if ((newHeartRate || 0) > 85 || (newTemperature || 0) > 37.5) newRisk = 'medium';
            else newRisk = 'low';

            return {
              ...p,
              heartRate: newHeartRate,
              temperature: newTemperature,
              risk: newRisk,
              lastUpdated: 'just now',
              // 히스토리 배열은 이미 전체 시계열을 가지고 있으므로, 여기서는 업데이트 안 함
              // heartRateHistory, temperatureHistory는 카드에서 잘라서 보여준다고 가정
            };
          }
          return p;
        })
      );
      setCurrentTimeIndex(prevIndex => prevIndex + 1);
    }, 2000); // 2초마다 업데이트

    return () => clearInterval(interval);
  }, [currentUser, allPatients, currentTimeIndex, isLoadingPatients]);


  const displayedPatients: Patient[] = useMemo(() => {
    let filtered: Patient[] = allPatients;
    if (searchTerm) {
      filtered = filtered.filter((patient: Patient) =>
        (patient.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    const sorted: Patient[] = [...filtered];
    if (sortCriteria === 'risk') {
      const riskOrder: { [key in Patient['risk']]: number } = { high: 0, medium: 1, low: 2 };
      sorted.sort((a: Patient, b: Patient) => (riskOrder[a.risk] ?? 2) - (riskOrder[b.risk] ?? 2));
    } else if (sortCriteria === 'name') {
      sorted.sort((a: Patient, b: Patient) => (a.full_name || '').localeCompare(b.full_name || ''));
    } else if (sortCriteria === 'heart') {
      sorted.sort((a: Patient, b: Patient) => (b.heartRate ?? -Infinity) - (a.heartRate ?? -Infinity));
    } else if (sortCriteria === 'temp') {
      sorted.sort((a: Patient, b: Patient) => (b.temperature ?? -Infinity) - (a.temperature ?? -Infinity));
    }
    return sorted;
  }, [allPatients, searchTerm, sortCriteria]);

  const selectedPatient: Patient | null = useMemo(() => {
    if (selectedPatientId === null) return null;
    return allPatients.find((p: Patient) => p.patient_id === selectedPatientId) || null;
  }, [allPatients, selectedPatientId]);

  useEffect(() => {
    if (!isLoadingPatients && displayedPatients.length > 0) {
      const firstPatient = displayedPatients[0] as Patient | undefined;
      if (!selectedPatientId || !displayedPatients.find((p: Patient) => p.patient_id === selectedPatientId)) {
        if (firstPatient) {
          setSelectedPatientId(firstPatient.patient_id);
        }
      }
    } else if (!isLoadingPatients && displayedPatients.length === 0) {
      setSelectedPatientId(null);
    }
  }, [isLoadingPatients, displayedPatients, selectedPatientId]);

  const handleSelectPatient = (patient: Patient) => setSelectedPatientId(patient.patient_id);
  const handleSort = (criteria: string) => setSortCriteria(criteria);

  if (isLoadingPatients && currentUser) {
    return (
      <MyCustomLayout currentUser={currentUser}>
        <div className="flex items-center justify-center h-full w-full text-xl p-8">
          환자 목록을 불러오는 중입니다...
        </div>
      </MyCustomLayout>
    );
  }

  return (
    <MyCustomLayout currentUser={currentUser}>
      <>
        <div className="w-[320px] border-r border-gray-200 bg-white flex flex-col shrink-0">
          <div className="p-4 border-b space-y-2">
            <button onClick={onLogout} className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600">
                로그아웃
            </button>
            {/* <button onClick={handleRefreshPatients} className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                환자 목록 새로고침
            </button> */}
          </div>
          <PatientList
            patients={displayedPatients}
            onSelectPatient={handleSelectPatient}
            selectedPatientId={selectedPatientId}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSort={handleSort}
            activeSort={sortCriteria}
            onRefresh={handleRefreshPatients} // PatientList 내부 버튼용
          />
        </div>
        <div className="flex-1 bg-gray-50 flex flex-col overflow-y-auto">
          {selectedPatient ? (
            <PatientDetail patient={selectedPatient} />
          ) : (
            <div className="p-6 flex-1 flex items-center justify-center">
              <p className="text-gray-500">
                {allPatients.length > 0 && displayedPatients.length === 0 ? '검색 결과가 없습니다.' :
                 allPatients.length === 0 && currentUser ? '표시할 환자 데이터가 없습니다.' :
                 !currentUser ? '' :
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
export default function MainPageController() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem('authToken');
      const storedUserJson = localStorage.getItem('currentUser');

      if (storedToken && storedUserJson) {
        try {
          const parsedUser = JSON.parse(storedUserJson) as User;
          setCurrentUser(parsedUser);
          setAuthToken(storedToken);
          setIsAuthenticated(true);
        } catch (e) {
          console.error("저장된 사용자 정보 파싱 오류, 로그아웃 처리:", e);
          localStorage.clear();
          setIsAuthenticated(false);
          setCurrentUser(null);
          setAuthToken(null);
        }
      } else {
        if (window.location.pathname !== '/login') {
          router.replace('/login');
        }
      }
      setIsLoadingAuth(false);
    }
  }, [router]);

  const handleLoginSuccess = (token: string, userData: User) => {
    setIsAuthenticated(true);
    setCurrentUser(userData);
    setAuthToken(token);
    if (typeof window !== "undefined") {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(userData));
    }
    router.push('/');
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setAuthToken(null);
    router.replace('/login');
  };

  if (isLoadingAuth) {
    return <div className="flex items-center justify-center min-h-screen text-xl">인증 상태 확인 중...</div>;
  }

  if (!isAuthenticated) {
    if (typeof window !== "undefined" && window.location.pathname !== '/login') {
        return <div className="flex items-center justify-center min-h-screen text-xl">로그인 페이지로 이동 중...</div>;
    }
    return null;
  }

  return <DashboardView onLogout={handleLogout} currentUser={currentUser} authToken={authToken} />;
}
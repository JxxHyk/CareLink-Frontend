// src/app/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
// ✨ 변경된 타입 정의 파일에서 필요한 인터페이스들은 index.ts에서 import
import {
  Patient,
  UserProfile,
  CurrentUser,
  IdNamePair,
} from '@/types';

// ✨ Enum들은 enums.ts에서 직접 import
import {
  UserRole,
  UserStatus, // UserStatus 추가 import
  AlertType,
  AlertSeverity,
} from '@/types/enums'; // 이제 enums.ts에서 가져옴

// 컴포넌트 import
import MyCustomLayout from '@/components/Layout';
import PatientList from '@/components/PatientList';
import PatientDetail from '@/components/PatientDetail';

// 목업 데이터 import
import { initialPatientProfiles } from '@/lib/patientInfoMockData';
import { timeSeriesData } from '@/lib/timeSeriesMockData';

// --- 데이터를 FastAPI 백엔드에서 가져오는 비동기 함수 ---
async function fetchAllPatientsFromAPI(token: string | null, organizationInfo: IdNamePair | undefined | null): Promise<Patient[]> {
  if (!token) {
    console.warn("Auth token not found, cannot fetch patients from API.");
    return [];
  }
  if (!organizationInfo || organizationInfo.id === undefined || organizationInfo.id === null) {
    console.warn("Organization ID not found, cannot fetch patients for a specific organization.");
    return [];
  }

  const organizationId = organizationInfo.id;
  const PATIENTS_API_URL = `http://127.0.0.1:8000/api/v1/patients/?organization_id=${organizationId}`;

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

    return (data as any[]).map(apiPatient => {
      const patient: Patient = {
          patient_id: apiPatient.patient_id,
          full_name: apiPatient.full_name,
          organization_id: apiPatient.organization_id,
          patient_code: apiPatient.patient_code,
          created_at: apiPatient.created_at || new Date().toISOString(),
          updated_at: apiPatient.updated_at || new Date().toISOString(),
          
          ...apiPatient, 
          
          current_heart_rate: apiPatient.current_heart_rate ?? null,
          current_temperature: apiPatient.current_temperature ?? null,
          current_fall_status: apiPatient.current_fall_status ?? null,
          current_gps_latitude: apiPatient.current_gps_latitude ?? null,
          current_gps_longitude: apiPatient.current_gps_longitude ?? null,
          current_step_count: apiPatient.current_step_count ?? null,
          current_acceleration_x: apiPatient.current_acceleration_x ?? null,
          current_acceleration_y: apiPatient.current_acceleration_y ?? null,
          current_acceleration_z: apiPatient.current_acceleration_z ?? null,
          current_gyro_x: apiPatient.current_gyro_x ?? null,
          current_gyro_y: apiPatient.current_gyro_y ?? null,
          current_gyro_z: apiPatient.current_gyro_z ?? null,
          current_battery_level: apiPatient.current_battery_level ?? null,

          heart_rate_history: Array.isArray(apiPatient.heart_rate_history) ? apiPatient.heart_rate_history : [],
          temperature_history: Array.isArray(apiPatient.temperature_history) ? apiPatient.temperature_history : [],
          acceleration_history: Array.isArray(apiPatient.acceleration_history) ? apiPatient.acceleration_history : [],
          gyro_history: Array.isArray(apiPatient.gyro_history) ? apiPatient.gyro_history : [],
          gps_history: Array.isArray(apiPatient.gps_history) ? apiPatient.gps_history : [],

          risk: apiPatient.risk ?? null, 
          age: apiPatient.age ?? null,
          lastUpdated: apiPatient.updated_at ?? null, 
      };
      return patient;
    }) as Patient[];

  } catch (error) {
    console.error("Network or other error during patient list API call:", error);
    return [];
  }
}


// --- 대시보드 내용을 표시하는 내부 컴포넌트 ---
function DashboardView({ onLogout, currentUser, authToken }: {
  onLogout: () => void;
  currentUser: CurrentUser | null;
  authToken: string | null;
}) {
  console.log("DashboardView - RECEIVED currentUser prop:", currentUser); 
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(true);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortCriteria, setSortCriteria] = useState<string>('risk');
  const [currentTimeIndex, setCurrentTimeIndex] = useState<number>(0); 

  // 환자 데이터 로딩 (컴포넌트 마운트 또는 사용자 변경 시)
  useEffect(() => {
    const loadPatients = async () => {
      if (currentUser && authToken) {
        setIsLoadingPatients(true);
        let patientsDataToSet: Patient[] = [];
        const currentOrganization = currentUser.organization;

        if (currentOrganization) {
          console.log(`Org ID ${currentOrganization.id}: Fetching patient data from API.`);
          const fetchedPatientsFromAPI = await fetchAllPatientsFromAPI(authToken, currentOrganization);

          patientsDataToSet = fetchedPatientsFromAPI.map(patient => {
            const patientIdNumber = patient.patient_id;
            const series = timeSeriesData[patientIdNumber as keyof typeof timeSeriesData] || timeSeriesData[String(patientIdNumber) as unknown as keyof typeof timeSeriesData];

            if (!series) {
                console.warn(`No mock time series data found for patient ID: ${patientIdNumber}. Using default nulls.`);
            }

            return {
              ...patient, 
              
              current_heart_rate: series?.heartRate?.[0] ?? null,
              current_temperature: series?.temperature?.[0] ?? null,
              current_fall_status: null, 
              current_gps_latitude: null, 
              current_gps_longitude: null, 
              current_step_count: null,
              current_acceleration_x: null, 
              current_acceleration_y: null, 
              current_acceleration_z: null, 
              current_gyro_x: null, 
              current_gyro_y: null, 
              current_gyro_z: null, 
              current_battery_level: null, 

              heart_rate_history: series?.heartRate || [],
              temperature_history: series?.temperature || [],
              acceleration_history: [], 
              gyro_history: [], 
              gps_history: [], 

              risk: patient.risk ?? 'low', 
              age: patient.age ?? null, 
              lastUpdated: patient.updated_at ?? null, 
            } as Patient;
          });
          setCurrentTimeIndex(0); 

        } else {
          console.warn("Current user or organization ID not found. Cannot load patient data.");
          patientsDataToSet = []; 
        }

        setAllPatients(patientsDataToSet);
        setIsLoadingPatients(false);
      } else {
        setAllPatients([]); 
        setIsLoadingPatients(false);
      }
    };
    loadPatients();
  }, [currentUser, authToken]);

  // 새로고침 함수 (handleRefreshPatients)도 동일하게 수정합니다.
  const handleRefreshPatients = async () => {
    if (currentUser && authToken) {
      setIsLoadingPatients(true);
      let patientsDataToSet: Patient[] = [];
      const currentOrganization = currentUser.organization;

      if (currentOrganization) {
        console.log(`Refresh: Org ID ${currentOrganization.id} - Refetching API data and injecting mock sensors.`);
        const fetchedPatientsFromAPI = await fetchAllPatientsFromAPI(authToken, currentOrganization);

        patientsDataToSet = fetchedPatientsFromAPI.map(patient => {
          const patientIdNumber = patient.patient_id;
          const series = timeSeriesData[patientIdNumber as keyof typeof timeSeriesData] || timeSeriesData[String(patientIdNumber) as unknown as keyof typeof timeSeriesData];

          if (!series) {
              console.warn(`No mock time series data found for patient ID: ${patientIdNumber} during refresh. Using default nulls.`);
          }

          return {
            ...patient,
            current_heart_rate: series?.heartRate?.[0] ?? null,
            current_temperature: series?.temperature?.[0] ?? null,
            current_fall_status: null,
            current_gps_latitude: null,
            current_gps_longitude: null,
            current_step_count: null,
            current_acceleration_x: null,
            current_acceleration_y: null,
            current_acceleration_z: null,
            current_gyro_x: null,
            current_gyro_y: null,
            current_gyro_z: null,
            current_battery_level: null,
            heart_rate_history: series?.heartRate || [],
            temperature_history: series?.temperature || [],
            acceleration_history: [],
            gyro_history: [],
            gps_history: [],
            risk: patient.risk ?? 'low',
            age: patient.age ?? null,
            lastUpdated: patient.updated_at ?? null,
          } as Patient;
        });
        setCurrentTimeIndex(0);
      } else {
        console.warn("Current user or organization ID not found for refresh. Cannot load patient data.");
        patientsDataToSet = [];
      }
      setAllPatients(patientsDataToSet);
      setIsLoadingPatients(false);
    }
  };

  // 시계열 목업 데이터 업데이트 시뮬레이션 (이 부분은 계속 센서 목업 데이터를 사용)
  useEffect(() => {
    if (!currentUser || allPatients.length === 0 || isLoadingPatients) {
      return;
    }

    const interval = setInterval(() => {
      setAllPatients(prevPatients =>
        prevPatients.map(p => {
          const patientIdNumber = p.patient_id;
          const series = timeSeriesData[patientIdNumber as keyof typeof timeSeriesData] || timeSeriesData[String(patientIdNumber) as unknown as keyof typeof timeSeriesData];
          
          if (!series || !Array.isArray(series.heartRate) || !Array.isArray(series.temperature)) {
             return p;
          }

          const timeSeriesLength = Math.min(series.heartRate.length, series.temperature.length);
          const nextIndex = (currentTimeIndex + 1) % timeSeriesLength; 
          
          const newHeartRate = series.heartRate[nextIndex];
          const newTemperature = series.temperature[nextIndex];

          let newRisk: Patient['risk'] = p.risk;
          if ((newHeartRate || 0) > 100 || (newTemperature || 0) > 38.5) newRisk = 'high';
          else if ((newHeartRate || 0) > 85 || (newTemperature || 0) > 37.5) newRisk = 'medium';
          else newRisk = 'low';

          return {
            ...p,
            current_heart_rate: newHeartRate,
            current_temperature: newTemperature,
            risk: newRisk,
            lastUpdated: 'just now',
          };
        })
      );
      setCurrentTimeIndex(prevIndex => (prevIndex + 1)); 
    }, 1000); 

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
      const riskOrder: { [key in 'high' | 'medium' | 'low']: number } = {
        high: 0,
        medium: 1,
        low: 2,
      };
      const defaultRiskValueForSort: 'low' = 'low';

      sorted.sort((a: Patient, b: Patient) => {
        const aRisk = a.risk ?? defaultRiskValueForSort;
        const bRisk = b.risk ?? defaultRiskValueForSort;
        return riskOrder[aRisk] - riskOrder[bRisk];
      });
    } else if (sortCriteria === 'name') {
      sorted.sort((a: Patient, b: Patient) => (a.full_name || '').localeCompare(b.full_name || ''));
    } else if (sortCriteria === 'heart') {
      sorted.sort((a: Patient, b: Patient) => (b.current_heart_rate ?? -Infinity) - (a.current_heart_rate ?? -Infinity));
    } else if (sortCriteria === 'temp') {
      sorted.sort((a: Patient, b: Patient) => (b.current_temperature ?? -Infinity) - (a.current_temperature ?? -Infinity));
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
          </div>
          <PatientList
            patients={displayedPatients}
            onSelectPatient={handleSelectPatient}
            selectedPatientId={selectedPatientId}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSort={handleSort}
            activeSort={sortCriteria}
            onRefresh={handleRefreshPatients}
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
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem('authToken');
      const storedUserJson = localStorage.getItem('currentUser');

      if (storedToken && storedUserJson) {
        try {
          // 백엔드에서 받은 Raw 데이터 (role 필드 포함)
          // UserProfile에 있는 모든 필수 필드를 포함하도록 정의
          const rawParsedUser: {
            id: number;
            username: string; // 실제 백엔드에 이 필드가 있다면 활용
            full_name: string;
            email?: string | null;
            phone_number?: string | null;
            role: string; // 백엔드에서 'role'로 내려오는 필드
            organization?: IdNamePair | null;
            // status, last_login 등 UserProfile의 다른 필드도 여기에 추가 (optional로)
            status?: string | null;
            last_login?: string | null;
            password_hash?: string; // 백엔드에서 넘겨주지 않겠지만, 타입 일관성 위해 추가
            created_at: string; // 백엔드에서 제공한다고 가정
            updated_at: string; // 백엔드에서 제공한다고 가정
            is_superuser?: boolean | null; // ✨ is_superuser 필드 추가
          } = JSON.parse(storedUserJson);

          // UserProfile 타입에 맞게 매핑
          const parsedUser: UserProfile = {
            id: rawParsedUser.id,
            username: rawParsedUser.username, // username이 없으면 full_name 사용
            full_name: rawParsedUser.full_name,
            email: rawParsedUser.email ?? null,
            phone_number: rawParsedUser.phone_number ?? null,
            user_type: rawParsedUser.role as UserRole, // ✨ role 필드를 user_type으로 매핑
            organization_id: rawParsedUser.organization?.id ?? 0, // organization 객체에서 id 추출
            organization: rawParsedUser.organization ?? null,
            created_at: rawParsedUser.created_at,
            updated_at: rawParsedUser.updated_at,
            status: (rawParsedUser.status as UserStatus) ?? UserStatus.ACTIVE,
            last_login: rawParsedUser.last_login ?? null,
            is_superuser: rawParsedUser.is_superuser ?? false, // is_superuser 할당
          };

          // UserProfile에서 CurrentUser로 매핑 (CurrentUser는 UserProfile의 부분집합)
          const appUser: CurrentUser = { ...parsedUser };
          setCurrentUser(appUser);
          setAuthToken(storedToken);
          setIsAuthenticated(true);
          console.log("MainPageController - AFTER SETTING currentUser (useEffect):", appUser); 
                
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

  // handleLoginSuccess 함수도 백엔드에서 받는 rawUserData의 타입을 정확히 명시해야 합니다.
  const handleLoginSuccess = (token: string, rawUserData: {
    id: number;
    username: string;
    full_name: string;
    email?: string | null;
    phone_number?: string | null;
    role: string; // 백엔드에서 'role'로 내려오는 필드
    organization?: IdNamePair | null;
    created_at: string;
    updated_at: string;
    status?: string | null;
    last_login?: string | null;
    password_hash?: string; // 백엔드에서 넘겨주지 않겠지만, 타입 일관성 위해 추가
    is_superuser?: boolean | null; // ✨ is_superuser 필드 추가
  }) => {
    setIsAuthenticated(true);
    setAuthToken(token);

    // rawUserData를 UserProfile 타입에 맞게 매핑
    const parsedUser: UserProfile = {
      id: rawUserData.id,
      username: rawUserData.username || rawUserData.full_name,
      full_name: rawUserData.full_name,
      email: rawUserData.email ?? null,
      phone_number: rawUserData.phone_number ?? null,
      user_type: rawUserData.role as UserRole, // ✨ role 필드를 user_type으로 매핑
      organization_id: rawUserData.organization?.id ?? 0,
      organization: rawUserData.organization ?? null,
      created_at: rawUserData.created_at,
      updated_at: rawUserData.updated_at,
      status: (rawUserData.status as UserStatus) ?? UserStatus.ACTIVE, // rawUserData.status를 UserStatus로 단언하고, 없으면 UserStatus.ACTIVE 할당
      last_login: rawUserData.last_login ?? null,
      is_superuser: rawUserData.is_superuser ?? false, // is_superuser 할당
    };

    // UserProfile에서 CurrentUser로 매핑
    const appUser: CurrentUser = { ...parsedUser };
    setCurrentUser(appUser);

    if (typeof window !== "undefined") {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(parsedUser)); // parsedUser를 저장
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
    return (
      <div className="flex items-center justify-center min-h-screen text-xl">
        인증 상태 확인 중...
      </div>
    );
  }

  if (!isAuthenticated) {
    if (typeof window !== "undefined" && window.location.pathname !== '/login') {
      return (
        <div className="flex items-center justify-center min-h-screen text-xl">
          로그인 페이지로 이동 중...
        </div>
      );
    }
    return null;
  }

  return <DashboardView onLogout={handleLogout} currentUser={currentUser} authToken={authToken} />;
}
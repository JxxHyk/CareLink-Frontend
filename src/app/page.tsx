// src/app/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Patient,
  UserProfile,
  CurrentUser,
  IdNamePair,
} from '@/types'; //
import {
  UserRole,
  UserStatus,
  AlertType,
  AlertSeverity,
  Gender,     // Patient 타입에서 사용
  PatientStatus // Patient 타입에서 사용
} from '@/types/enums'; //
import MyCustomLayout from '@/components/Layout'; //
import PatientList from '@/components/PatientList'; //
import PatientDetail from '@/components/PatientDetail'; //
import { timeSeriesData } from '@/lib/timeSeriesMockData'; // ✨ 모의 데이터 import

async function fetchAllPatientsFromAPI(token: string | null, organizationInfo: IdNamePair | undefined | null): Promise<Patient[]> {
  if (!token || !organizationInfo?.id) {
    console.warn("fetchAllPatientsFromAPI: Auth token or Organization ID not found.");
    return [];
  }
  const organizationId = organizationInfo.id;
  const BASE_API_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';
  const PATIENTS_API_URL = `${BASE_API_URL}/api/v1/patients/?organization_id=${organizationId}`;

  try {
    console.log(`[1단계-API호출] organization ID ${organizationId} 환자 정보 요청: ${PATIENTS_API_URL}`);
    const response = await fetch(PATIENTS_API_URL, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.error(`fetchAllPatientsFromAPI: API request failed with status ${response.status}`, await response.text());
      return [];
    }
    const rawApiPatients = await response.json();
    console.log(`[1단계-API응답] organization ID ${organizationId} raw 환자 정보:`, rawApiPatients);

    return (rawApiPatients as any[]).map(apiPatient => {
      const patientFromDB: Patient = {
        patient_id: apiPatient.patient_id,
        organization_id: apiPatient.organization_id,
        patient_code: apiPatient.patient_code,
        full_name: apiPatient.full_name,
        date_of_birth: apiPatient.date_of_birth,
        gender: apiPatient.gender as Gender,
        address: apiPatient.address,
        contact_number: apiPatient.contact_number,
        emergency_contact: apiPatient.emergency_contact,
        emergency_number: apiPatient.emergency_number,
        medical_notes: apiPatient.medical_notes,
        status: apiPatient.status as PatientStatus,
        registration_date: apiPatient.registration_date,
        created_at: apiPatient.created_at || new Date().toISOString(),
        updated_at: apiPatient.updated_at || new Date().toISOString(),
        current_heart_rate: apiPatient.current_heart_rate ?? null,
        current_temperature: apiPatient.current_temperature ?? null,
        current_fall_status: apiPatient.current_fall_status ?? null,
        current_gps_latitude: apiPatient.current_gps_latitude ?? null, //
        current_gps_longitude: apiPatient.current_gps_longitude ?? null, //
        current_step_count: apiPatient.current_step_count ?? null, //
        current_acceleration_x: apiPatient.current_acceleration_x ?? null, //
        current_acceleration_y: apiPatient.current_acceleration_y ?? null, //
        current_acceleration_z: apiPatient.current_acceleration_z ?? null, //
        current_gyro_x: apiPatient.current_gyro_x ?? null, //
        current_gyro_y: apiPatient.current_gyro_y ?? null, //
        current_gyro_z: apiPatient.current_gyro_z ?? null, //
        current_battery_level: apiPatient.current_battery_level ?? null, //
        heart_rate_history: Array.isArray(apiPatient.heart_rate_history) ? apiPatient.heart_rate_history : [], //
        temperature_history: Array.isArray(apiPatient.temperature_history) ? apiPatient.temperature_history : [], //
        acceleration_history: Array.isArray(apiPatient.acceleration_history) ? apiPatient.acceleration_history : [], //
        gyro_history: Array.isArray(apiPatient.gyro_history) ? apiPatient.gyro_history : [], //
        gps_history: Array.isArray(apiPatient.gps_history) ? apiPatient.gps_history : [], //
        age: apiPatient.age ?? null,
        risk: apiPatient.risk ?? 'low',
        lastUpdated: apiPatient.updated_at ?? new Date().toISOString(),
        gyro: apiPatient.gyro || { x: 0, y: 0, z: 0 }, //
        lastMovement: apiPatient.lastMovement || "N/A", //
        movementPattern: apiPatient.movementPattern || "N/A", //
        gps: apiPatient.gps || { lat: "N/A", long: "N/A", address: "N/A", timestamp: "N/A" }, //
      };
      return patientFromDB;
    });
  } catch (error) {
    console.error("fetchAllPatientsFromAPI: Error fetching patients:", error);
    return [];
  }
}

function DashboardView({ onLogout, currentUser, authToken }: {
  onLogout: () => void;
  currentUser: CurrentUser | null;
  authToken: string | null;
}) {
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(true);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortCriteria, setSortCriteria] = useState<string>('risk');

  useEffect(() => {
    const loadInitialDataAndCombineWithMock = async () => {
      if (currentUser && authToken && currentUser.organization) {
        setIsLoadingPatients(true);
        console.log("[1단계-데이터로딩 시작] 현재 사용자:", currentUser.username, "기관 ID:", currentUser.organization.id);
        const patientsFromDB = await fetchAllPatientsFromAPI(authToken, currentUser.organization);

        if (patientsFromDB.length > 0) {
          console.log("[1단계-DB환자정보 수신 완료] 환자 수:", patientsFromDB.length, "첫번째 환자:", patientsFromDB[0]?.full_name);
        } else {
          console.warn("[1단계-DB환자정보 없음 또는 API 로드 실패]");
        }

        const patientsCombinedWithMock = patientsFromDB.map(patient => {
          const patientIdKey = patient.patient_id; // 숫자형 ID
          const mockSensorSeries = timeSeriesData[patientIdKey as keyof typeof timeSeriesData];

          let initialCurrentHeartRate = patient.current_heart_rate; // API 값을 우선
          let initialCurrentTemperature = patient.current_temperature; // API 값을 우선
          let heartRateHistoryForCard = patient.heart_rate_history || []; // API 값을 우선
          let temperatureHistoryForCard = patient.temperature_history || []; // API 값을 우선

          if (mockSensorSeries) {
            console.log(`[1단계-모의데이터 매칭] 환자 ID ${patientIdKey} (${patient.full_name}): 모의 데이터 발견`);
            // API에서 history가 비어있다면 모의 데이터로 채움
            if (heartRateHistoryForCard.length === 0) {
              heartRateHistoryForCard = mockSensorSeries.heartRate || [];
            }
            if (temperatureHistoryForCard.length === 0) {
              temperatureHistoryForCard = mockSensorSeries.temperature || [];
            }
            // API에서 current 값이 없다면, 모의 히스토리의 첫 값(최신)으로 설정
            if (initialCurrentHeartRate === null && heartRateHistoryForCard.length > 0) {
              initialCurrentHeartRate = heartRateHistoryForCard[0]; // 최신 데이터
            }
            if (initialCurrentTemperature === null && temperatureHistoryForCard.length > 0) {
              initialCurrentTemperature = temperatureHistoryForCard[0]; // 최신 데이터
            }
          } else {
            console.log(`[1단계-모의데이터 매칭] 환자 ID ${patientIdKey} (${patient.full_name}): 모의 데이터 없음`);
          }

          return {
            ...patient,
            current_heart_rate: initialCurrentHeartRate,
            current_temperature: initialCurrentTemperature,
            heart_rate_history: heartRateHistoryForCard,
            temperature_history: temperatureHistoryForCard,
          };
        });

        console.log("[1단계-최종 결합 데이터]", patientsCombinedWithMock.map(p => ({ id: p.patient_id, name: p.full_name, hr: p.current_heart_rate, temp: p.current_temperature, hrHistoryCount: p.heart_rate_history?.length, tempHistoryCount: p.temperature_history?.length })));
        setAllPatients(patientsCombinedWithMock);
        setIsLoadingPatients(false);
        console.log("[1단계-데이터로딩 및 결합 완료]");
      } else {
        console.log("[1단계-데이터로딩 조건 미충족] 사용자 또는 토큰 또는 기관 정보 없음:", { currentUserExists: !!currentUser, authTokenExists: !!authToken, organizationExists: !!currentUser?.organization });
        setAllPatients([]);
        setIsLoadingPatients(false);
      }
    };

    loadInitialDataAndCombineWithMock();
  }, [currentUser, authToken]);


  const displayedPatients: Patient[] = useMemo(() => { //
    let filtered: Patient[] = allPatients; //
    if (searchTerm) { //
      filtered = filtered.filter((patient: Patient) => //
        (patient.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) //
      );
    }
    const sorted: Patient[] = [...filtered]; //
    if (sortCriteria === 'risk') { //
      const riskOrder: { [key in 'high' | 'medium' | 'low']: number } = { high: 0, medium: 1, low: 2, }; //
      const defaultRiskValueForSort: 'low' = 'low'; //
      sorted.sort((a: Patient, b: Patient) => { //
        const aRisk = a.risk ?? defaultRiskValueForSort; //
        const bRisk = b.risk ?? defaultRiskValueForSort; //
        return riskOrder[aRisk] - riskOrder[bRisk]; //
      });
    } else if (sortCriteria === 'name') { //
      sorted.sort((a: Patient, b: Patient) => (a.full_name || '').localeCompare(b.full_name || '')); //
    } else if (sortCriteria === 'heart') { //
      sorted.sort((a: Patient, b: Patient) => (b.current_heart_rate ?? -Infinity) - (a.current_heart_rate ?? -Infinity)); //
    } else if (sortCriteria === 'temp') { //
      sorted.sort((a: Patient, b: Patient) => (b.current_temperature ?? -Infinity) - (a.current_temperature ?? -Infinity)); //
    }
    return sorted; //
  }, [allPatients, searchTerm, sortCriteria]);

  const selectedPatient: Patient | null = useMemo(() => { //
    if (selectedPatientId === null) return null; //
    const foundPatient = allPatients.find((p: Patient) => p.patient_id === selectedPatientId) || null; //
    if (foundPatient) {
      console.log("[1단계-선택된 환자 정보 업데이트됨]", { id: foundPatient.patient_id, name: foundPatient.full_name, hr: foundPatient.current_heart_rate, temp: foundPatient.current_temperature, hrHistoryCount: foundPatient.heart_rate_history?.length });
    }
    return foundPatient;
  }, [allPatients, selectedPatientId]);

  useEffect(() => { //
    if (!isLoadingPatients && displayedPatients.length > 0) { //
      const firstPatient = displayedPatients[0]; //
      if ((selectedPatientId === null || !displayedPatients.find(p => p.patient_id === selectedPatientId)) && firstPatient) { //
        setSelectedPatientId(firstPatient.patient_id); //
        console.log("[1단계-초기 환자 자동 선택]", { id: firstPatient.patient_id, name: firstPatient.full_name });
      }
    } else if (!isLoadingPatients && displayedPatients.length === 0) { //
      setSelectedPatientId(null); //
    }
  }, [isLoadingPatients, displayedPatients, selectedPatientId]);

  const handleSelectPatient = (patient: Patient) => { //
    setSelectedPatientId(patient.patient_id); //
    console.log("[1단계-사용자 환자 선택]", { id: patient.patient_id, name: patient.full_name });
  }
  const handleSort = (criteria: string) => setSortCriteria(criteria); //

  const handleRefreshPatients = async () => { //
    if (currentUser && authToken && currentUser.organization) { //
      setIsLoadingPatients(true); //
      console.log("[1단계-새로고침 시작]");
      const patientsFromDB = await fetchAllPatientsFromAPI(authToken, currentUser.organization); //
      const patientsCombinedWithMock = patientsFromDB.map(patient => { //
        const patientIdKey = patient.patient_id;
        const mockSensorSeries = timeSeriesData[patientIdKey as keyof typeof timeSeriesData];
        return {
          ...patient,
          current_heart_rate: patient.current_heart_rate ?? (mockSensorSeries?.heartRate?.[0] ?? null),
          current_temperature: patient.current_temperature ?? (mockSensorSeries?.temperature?.[0] ?? null),
          heart_rate_history: mockSensorSeries?.heartRate || [],
          temperature_history: mockSensorSeries?.temperature || [],
        };
      });
      setAllPatients(patientsCombinedWithMock); //
      setIsLoadingPatients(false); //
      console.log("[1단계-새로고침 완료]");
    }
  };

  if (isLoadingPatients && currentUser) { //
    return ( //
      <MyCustomLayout currentUser={currentUser}> {/* */}
        <div className="flex items-center justify-center h-full w-full text-xl p-8"> {/* */}
          [1단계] 환자 목록 로딩 중... {/* */}
        </div>
      </MyCustomLayout>
    );
  }

  return ( //
    <MyCustomLayout currentUser={currentUser}> {/* */}
      <>
        <div className="w-[320px] border-r border-gray-200 bg-white flex flex-col shrink-0"> {/* */}
          <div className="p-4 border-b border-gray-200 space-y-2">
            <button
              onClick={onLogout} // DashboardView의 props로 onLogout 함수가 전달되어야 해
              className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              로그아웃
            </button>
          </div>

          <PatientList
            patients={displayedPatients} //
            onSelectPatient={handleSelectPatient} //
            selectedPatientId={selectedPatientId} //
            searchTerm={searchTerm} //
            setSearchTerm={setSearchTerm} //
            onSort={handleSort} //
            activeSort={sortCriteria} //
            onRefresh={handleRefreshPatients} //
          />
        </div>
        <div className="flex-1 bg-gray-50 flex flex-col overflow-y-auto"> {/* */}
          {selectedPatient ? ( //
            <PatientDetail patient={selectedPatient} /> //
          ) : ( //
            <div className="p-6 flex-1 flex items-center justify-center"> {/* */}
              <p className="text-gray-500"> {/* */}
                {allPatients.length > 0 && displayedPatients.length === 0 ? '검색 결과가 없습니다.' : //
                  allPatients.length === 0 && currentUser ? '[1단계] 표시할 환자 데이터가 없습니다.' : //
                    !currentUser ? '사용자 정보를 불러오는 중...' : //
                      '[1단계] 목록에서 환자를 선택해주세요.'} {/* */}
              </p>
            </div>
          )}
        </div>
      </>
    </MyCustomLayout>
  );
}

export default function MainPageController() { //
  const router = useRouter(); //
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); //
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true); //
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null); //
  const [authToken, setAuthToken] = useState<string | null>(null); //

  useEffect(() => { //
    if (typeof window !== "undefined") { //
      const storedToken = localStorage.getItem('authToken'); //
      const storedUserJson = localStorage.getItem('currentUser'); //

      if (storedToken && storedUserJson) { //
        try {
          const parsedUser: UserProfile = JSON.parse(storedUserJson); //
          const appUser: CurrentUser = { //
            id: parsedUser.id, //
            username: parsedUser.username, //
            full_name: parsedUser.full_name, //
            email: parsedUser.email, //
            phone_number: parsedUser.phone_number, //
            user_type: parsedUser.user_type, //
            organization_id: parsedUser.organization_id, //
            organization: parsedUser.organization, //
            created_at: parsedUser.created_at, //
            updated_at: parsedUser.updated_at, //
            is_superuser: parsedUser.is_superuser, //
          };
          setCurrentUser(appUser); //
          setAuthToken(storedToken); //
          setIsAuthenticated(true); //
        } catch (e) { //
          localStorage.clear(); //
          setIsAuthenticated(false); //
          router.replace('/login'); //
        }
      } else { //
        if (window.location.pathname !== '/login') { //
          router.replace('/login'); //
        }
      }
      setIsLoadingAuth(false); //
    }
  }, [router]);

  const handleLogout = () => { //
    if (typeof window !== "undefined") localStorage.clear(); //
    setIsAuthenticated(false); //
    setCurrentUser(null); //
    setAuthToken(null); //
    router.replace('/login'); //
  };

  if (isLoadingAuth) return <div className="flex items-center justify-center min-h-screen text-xl">인증 상태 확인 중...</div>; //
  if (!isAuthenticated && typeof window !== "undefined" && window.location.pathname !== '/login') { //
    return <div className="flex items-center justify-center min-h-screen text-xl">로그인 페이지로 이동 중...</div>; //
  }
  if (!isAuthenticated) return null; // 로그인 페이지 자체이거나 SSR 시

  return <DashboardView onLogout={handleLogout} currentUser={currentUser} authToken={authToken} />; //
}
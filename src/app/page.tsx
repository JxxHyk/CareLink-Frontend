// src/app/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation'; // useRouter import

import {
  Patient,
  UserProfile,
  CurrentUser,
  IdNamePair,
} from '@/types';
import {
  UserRole,
  UserStatus,
  AlertType,
  AlertSeverity,
  Gender,
  PatientStatus
} from '@/types/enums';
import MyCustomLayout from '@/components/Layout';
import PatientList from '@/components/PatientList';
import PatientDetail from '@/components/PatientDetail';
import { timeSeriesData } from '@/lib/timeSeriesMockData';
import HeartRateCard from '@/components/HeartRateCard';

const SIMULATION_INTERVAL = 2000; // 센서 값 업데이트 주기 (ms)

// fetchAllPatientsFromAPI 함수는 이전 단계에서 정의한 것을 그대로 사용한다고 가정
async function fetchAllPatientsFromAPI(token: string | null, organizationInfo: IdNamePair | undefined | null, router: any): Promise<Patient[]> { // router 인자 추가
  if (!token || !organizationInfo?.id) {
    console.warn("fetchAllPatientsFromAPI: Auth token or Organization ID not found.");
    return [];
  }
  const organizationId = organizationInfo.id;
  const BASE_API_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';
  const PATIENTS_API_URL = `${BASE_API_URL}/api/v1/patients/?organization_id=${organizationId}`;

  try {
    const response = await fetch(PATIENTS_API_URL, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    if (response.status === 401) { // 401 Unauthorized 응답이 왔을 때
      console.error("fetchAllPatientsFromAPI: 인증 토큰이 만료되었거나 유효하지 않습니다. 로그인 페이지로 이동합니다.");
      if (typeof window !== "undefined") {
        localStorage.clear(); // 로컬 스토리지 클리어
        router.replace('/login'); // useRouter를 사용하여 로그인 페이지로 리다이렉트
      }
      return []; // 빈 배열 반환하여 더 이상 진행하지 않음
    }

    if (!response.ok) {
      console.error(`fetchAllPatientsFromAPI: API request failed with status ${response.status}`, await response.text());
      return [];
    }
    const rawApiPatients = await response.json();

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
        age: apiPatient.age ?? null,
        risk: apiPatient.risk ?? 'low',
        lastUpdated: apiPatient.updated_at ?? new Date().toISOString(),
        gyro: apiPatient.gyro || { x: 0, y: 0, z: 0 },
        lastMovement: apiPatient.lastMovement || "N/A",
        movementPattern: apiPatient.movementPattern || "N/A",
        gps: apiPatient.gps || { lat: "N/A", long: "N/A", address: "N/A", timestamp: "N/A" },
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
  const [currentTimeIndex, setCurrentTimeIndex] = useState<number>(0);

  const router = useRouter(); // useRouter 훅 가져오기

  // 1. 초기 환자 데이터 로드 및 모의 센서 히스토리 결합 (이전 단계에서 구현)
  useEffect(() => {
    const loadInitialDataAndCombineWithMock = async () => {
      if (currentUser && authToken && currentUser.organization) {
        setIsLoadingPatients(true);
        // router 인자를 fetchAllPatientsFromAPI에 전달
        const patientsFromDB = await fetchAllPatientsFromAPI(authToken, currentUser.organization, router);

        const patientsCombinedWithMock = patientsFromDB.map(patient => {
          const patientIdKey = patient.patient_id;
          const mockSensorSeries = timeSeriesData[patientIdKey as keyof typeof timeSeriesData];

          let initialCurrentHeartRate = patient.current_heart_rate;
          let initialCurrentTemperature = patient.current_temperature;
          let heartRateHistoryForCard = patient.heart_rate_history || [];
          let temperatureHistoryForCard = patient.temperature_history || [];

          if (mockSensorSeries) {
            if (heartRateHistoryForCard.length === 0 && mockSensorSeries.heartRate) {
              heartRateHistoryForCard = [...mockSensorSeries.heartRate];
            }
            if (temperatureHistoryForCard.length === 0 && mockSensorSeries.temperature) {
              temperatureHistoryForCard = [...mockSensorSeries.temperature];
            }
            if (initialCurrentHeartRate === null && heartRateHistoryForCard.length > 0) {
              initialCurrentHeartRate = heartRateHistoryForCard[0];
            }
            if (initialCurrentTemperature === null && temperatureHistoryForCard.length > 0) {
              initialCurrentTemperature = temperatureHistoryForCard[0];
            }
          }

          return {
            ...patient,
            current_heart_rate: initialCurrentHeartRate,
            current_temperature: initialCurrentTemperature,
            heart_rate_history: heartRateHistoryForCard,
            temperature_history: temperatureHistoryForCard,
          };
        });

        setAllPatients(patientsCombinedWithMock);
        setCurrentTimeIndex(0);
        setIsLoadingPatients(false);
      } else {
        setAllPatients([]);
        setIsLoadingPatients(false);
      }
    };
    loadInitialDataAndCombineWithMock();
  }, [currentUser, authToken, router]); // router를 의존성 배열에 추가

  // ✨ 2. 실시간 센서 값 업데이트 시뮬레이션 (주기적으로 current 값 변경)
  useEffect(() => {
    if (isLoadingPatients || allPatients.length === 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setCurrentTimeIndex(prevIndex => prevIndex + 1);
    }, SIMULATION_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [isLoadingPatients, allPatients]);

  // ✨ currentTimeIndex가 변경될 때마다 allPatients의 current 값들을 업데이트
  useEffect(() => {
    if (isLoadingPatients || allPatients.length === 0 || currentTimeIndex === 0) {
      return;
    }

    setAllPatients(currentPatientList =>
      currentPatientList.map(patient => {
        const patientIdKey = patient.patient_id;
        const mockSensors = timeSeriesData[patientIdKey as keyof typeof timeSeriesData];

        if (!mockSensors || !mockSensors.heartRate || !mockSensors.temperature) {
          return patient;
        }

        const newHeartRate = mockSensors.heartRate[currentTimeIndex % mockSensors.heartRate.length];
        const newTemperature = mockSensors.temperature[currentTimeIndex % mockSensors.temperature.length];

        let updatedRisk: Patient['risk'] = 'low'; // 기본값을 'low'로 초기화

        // 🚨 이 부분 수정!
        // HeartRateCard.tsx의 위험/주의 기준을 기반으로 Risk 판단
        // TemperatureCard.tsx의 위험/주의 기준을 기반으로 Risk 판단

        // --- High Risk 조건 (심박수 또는 체온이 Critical 범위일 경우) ---
        // 심박수: 100 초과 또는 55 미만
        const isHeartRateCriticalHigh = (newHeartRate ?? 0) > 100;
        const isHeartRateCriticalLow = (newHeartRate ?? 0) < 55;

        // 체온: 38.0 이상 또는 35.7 이하
        const isTemperatureCriticalHigh = (newTemperature ?? 0) >= 38.0;
        const isTemperatureCriticalLow = (newTemperature ?? 0) <= 35.7;

        if (isHeartRateCriticalHigh || isHeartRateCriticalLow || isTemperatureCriticalHigh || isTemperatureCriticalLow) {
          updatedRisk = 'high';
        }
        // --- Medium Risk 조건 (심박수 또는 체온이 Warning 범위일 경우, High Risk가 아닐 때) ---
        else {
          // 심박수: 85 초과 (High 아님) 또는 55 이상 60 미만 (High 아님)
          const isHeartRateWarning = ((newHeartRate ?? 0) > 85 && (newHeartRate ?? 0) <= 100) || ((newHeartRate ?? 0) < 60 && (newHeartRate ?? 0) >= 55);

          // 체온: 37.5 이상 38.0 미만 (High 아님) 또는 35.7 초과 36.0 미만 (High 아님)
          const isTemperatureWarning = ((newTemperature ?? 0) >= 37.5 && (newTemperature ?? 0) < 38.0) || ((newTemperature ?? 0) < 36.0 && (newTemperature ?? 0) > 35.7);

          if (isHeartRateWarning || isTemperatureWarning) {
            updatedRisk = 'medium';
          }
          // --- Low Risk 조건 (위의 모든 조건에 해당하지 않을 경우) ---
          else {
            updatedRisk = 'low';
          }
        }
        // 🚨 수정 끝!

        return {
          ...patient,
          current_heart_rate: newHeartRate,
          current_temperature: newTemperature,
          risk: updatedRisk,
          lastUpdated: new Date().toLocaleTimeString(),
        };
      })
    );
  }, [currentTimeIndex]);


  const displayedPatients: Patient[] = useMemo(() => {
    let filtered: Patient[] = allPatients;
    if (searchTerm) {
      filtered = filtered.filter((patient: Patient) =>
        (patient.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    const sorted: Patient[] = [...filtered];
    if (sortCriteria === 'risk') {
      const riskOrder: { [key in 'high' | 'medium' | 'low']: number } = { high: 0, medium: 1, low: 2, };
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
      const firstPatient = displayedPatients[0];
      if ((selectedPatientId === null || !displayedPatients.find(p => p.patient_id === selectedPatientId)) && firstPatient) {
        setSelectedPatientId(firstPatient.patient_id);
      }
    } else if (!isLoadingPatients && displayedPatients.length === 0) {
      setSelectedPatientId(null);
    }
  }, [isLoadingPatients, displayedPatients, selectedPatientId]);

  const handleSelectPatient = (patient: Patient) => setSelectedPatientId(patient.patient_id);
  const handleSort = (criteria: string) => setSortCriteria(criteria);

  const handleRefreshPatients = async () => {
    if (currentUser && authToken && currentUser.organization) {
      setIsLoadingPatients(true);
      // router 인자를 fetchAllPatientsFromAPI에 전달
      const patientsFromDB = await fetchAllPatientsFromAPI(authToken, currentUser.organization, router);
      const patientsCombinedWithMock = patientsFromDB.map(patient => {
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
      setAllPatients(patientsCombinedWithMock);
      setCurrentTimeIndex(0);
      setIsLoadingPatients(false);
    }
  };

  if (isLoadingPatients && currentUser) {
    return (
      <MyCustomLayout currentUser={currentUser}>
        <div className="flex items-center justify-center h-full w-full text-xl p-8">
          환자 목록 로딩 중...
        </div>
      </MyCustomLayout>
    );
  }

  return (
    <MyCustomLayout currentUser={currentUser}>
      <>
        <div className="w-[320px] border-r border-gray-200 bg-white flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-200 space-y-2">
            <button
              onClick={onLogout}
              className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
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
                    !currentUser ? '사용자 정보를 불러오는 중...' :
                      '목록에서 환자를 선택해주세요.'}
              </p>
            </div>
          )}
        </div>
      </>
    </MyCustomLayout>
  );
}

// --- MainPageController (인증 로직) ---
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
          const parsedUser: UserProfile = JSON.parse(storedUserJson);
          const appUser: CurrentUser = {
            id: parsedUser.id,
            username: parsedUser.username,
            full_name: parsedUser.full_name,
            email: parsedUser.email,
            phone_number: parsedUser.phone_number,
            user_type: parsedUser.user_type,
            organization_id: parsedUser.organization_id,
            organization: parsedUser.organization,
            created_at: parsedUser.created_at,
            updated_at: parsedUser.updated_at,
            is_superuser: parsedUser.is_superuser,
          };
          setCurrentUser(appUser);
          setAuthToken(storedToken);
          setIsAuthenticated(true);
        } catch (e) {
          console.error("MainPageController - 사용자 정보 파싱 오류:", e); // 에러 로그 추가
          localStorage.clear();
          setIsAuthenticated(false);
          router.replace('/login');
        }
      } else {
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') { // /register 페이지도 로그인 필요 없으므로 추가
          router.replace('/login');
        }
      }
      setIsLoadingAuth(false);
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") localStorage.clear();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setAuthToken(null);
    router.replace('/login');
  };

  if (isLoadingAuth) return <div className="flex items-center justify-center min-h-screen text-xl">인증 상태 확인 중...</div>;
  if (!isAuthenticated && typeof window !== "undefined" && window.location.pathname !== '/login' && window.location.pathname !== '/register') { // /register 페이지도 로그인 필요 없으므로 추가
    return <div className="flex items-center justify-center min-h-screen text-xl">로그인 페이지로 이동 중...</div>;
  }
  if (!isAuthenticated && window.location.pathname !== '/login' && window.location.pathname !== '/register') { // 로그인 및 회원가입 페이지가 아니면 null 반환하지 않음
    return null; // 이미 리다이렉션 중일 수 있으므로
  }

  return <DashboardView onLogout={handleLogout} currentUser={currentUser} authToken={authToken} />;
}
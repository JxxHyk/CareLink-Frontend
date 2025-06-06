// src/app/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import {
  Patient,
  UserProfile,
  CurrentUser,
  IdNamePair,
} from '@/types';
import {
  UserType,
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

const SIMULATION_INTERVAL = 2000; // 센서 값 업데이트 주기 (ms)

async function fetchAllPatientsFromAPI(token: string | null, organizationInfo: IdNamePair | undefined | null, router: any): Promise<Patient[]> {
  if (!token || !organizationInfo?.id) {
    console.warn("fetchAllPatientsFromAPI: Auth token or Organization ID not found.");
    return [];
  }
  const organizationId = organizationInfo.id;
  const BASE_API_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';
  const PATIENTS_API_URL = `${BASE_API_URL}/api/v1/patients/?organization_id=${organizationId}`; // 이 줄을 직접 타이핑!

  try {
    const response = await fetch(PATIENTS_API_URL, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      console.error("fetchAllPatientsFromAPI: 인증 토큰이 만료되었거나 유효하지 않습니다. 로그인 페이지로 이동합니다.");
      if (typeof window !== "undefined") {
        localStorage.clear();
        router.replace('/login');
      }
      return [];
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

  const router = useRouter();

  // ✨ 이 handleLogoutClick 함수 정의를 여기 추가해 줘.
  const handleLogoutClick = async () => {
    if (authToken) {
      const BASE_API_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';
      try {
        const response = await fetch(`${BASE_API_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error("Logout API failed:", response.status, await response.text());
        }
      } catch (error) {
        console.error("Logout API call error:", error);
      }
    }
    onLogout(); // MainPageController에서 전달받은 onLogout 함수 호출
  };

    useEffect(() => {
      const loadInitialDataAndCombineWithMock = async () => {
        if (currentUser && authToken && currentUser.organization) {
          setIsLoadingPatients(true);
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
    }, [currentUser, authToken, router]);

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

          let updatedRisk: Patient['risk'] = 'low';

          const isHeartRateCriticalHigh = (newHeartRate ?? 0) > 100;
          const isHeartRateCriticalLow = (newHeartRate ?? 0) < 55;

          const isTemperatureCriticalHigh = (newTemperature ?? 0) >= 38.0;
          const isTemperatureCriticalLow = (newTemperature ?? 0) <= 35.7;

          if (isHeartRateCriticalHigh || isHeartRateCriticalLow || isTemperatureCriticalHigh || isTemperatureCriticalLow) {
            updatedRisk = 'high';
          }
          else {
            const isHeartRateWarning = ((newHeartRate ?? 0) > 85 && (newHeartRate ?? 0) <= 100) || ((newHeartRate ?? 0) < 60 && (newHeartRate ?? 0) >= 55);
            const isTemperatureWarning = ((newTemperature ?? 0) >= 37.5 && (newTemperature ?? 0) < 38.0) || ((newTemperature ?? 0) < 36.0 && (newTemperature ?? 0) > 35.7);

            if (isHeartRateWarning || isTemperatureWarning) {
              updatedRisk = 'medium';
            }
            else {
              updatedRisk = 'low';
            }
          }

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
      console.log("Filtering patients by status...");
      console.log("All patients before status filter:", allPatients.map(p => ({ id: p.patient_id, name: p.full_name, status: p.status })));
      console.log("Expected ACTIVE status value:", PatientStatus.ACTIVE);
      filtered = filtered.filter(patient => {
        const isActive = patient.status === PatientStatus.ACTIVE;
        // ✨ 이 로그를 통해 개별 환자의 상태와 일치 여부를 정확히 파악!
        console.log(`Patient ID: ${patient.patient_id}, Name: ${patient.full_name}, Current Status: "${patient.status}", Is Active Match: ${isActive}`);
        return isActive;
      });

      console.log("Patients after status filter:", filtered.map(p => ({ id: p.patient_id, name: p.full_name, status: p.status })));

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
                onClick={handleLogoutClick} // 🚨 이 부분 문제!
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
            console.error("MainPageController - 사용자 정보 파싱 오류:", e);
            localStorage.clear();
            setIsAuthenticated(false);
            router.replace('/login');
          }
        } else {
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
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
    if (!isAuthenticated && typeof window !== "undefined" && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      return <div className="flex items-center justify-center min-h-screen text-xl">로그인 페이지로 이동 중...</div>;
    }
    if (!isAuthenticated && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      return null;
    }

    return <DashboardView onLogout={handleLogout} currentUser={currentUser} authToken={authToken} />;
  }
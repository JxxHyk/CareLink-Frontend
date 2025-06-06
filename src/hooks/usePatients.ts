// src/hooks/usePatients.ts
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchPatients, fetchLatestSensorData } from '@/lib/api';
import { Patient, CurrentUser, IdNamePair } from '@/types';
import { PatientStatus } from '@/types/enums';
import { timeSeriesData } from '@/lib/timeSeriesMockData';

const SIMULATION_INTERVAL = 2000; // 목업 센서 값 업데이트 주기 (ms)
const MOBIUS_DATA_POLLING_INTERVAL = 5000; // Mobius 데이터 요청 주기 (ms) - 초기값

// Mobius 데이터를 적용할 환자 ID 목록 (추후 백엔드에서 받아오거나 설정 파일로 관리)
const MOBIUS_PATIENT_IDS = [237]; // 이제 배열로 관리!

// 지수 백오프 설정
const MAX_MOBIUS_RETRY_COUNT = 5; // Mobius 데이터 요청 최대 재시도 횟수
const INITIAL_MOBIUS_BACKOFF_TIME_MS = 2000; // 초기 백오프 시간 (2초)
const MAX_MOBIUS_BACKOFF_TIME_MS = 60 * 1000; // 최대 백오프 시간 (1분)

// 각 환자별 백오프 상태를 저장할 타입 정의
interface PatientMobiusState {
  retryCount: number;
  pollingStopped: boolean;
  nextAttemptTime: number; // 다음 시도 가능 시간 (Date.now() 기준)
}

interface UsePatientsReturn {
  allPatients: Patient[];
  displayedPatients: Patient[];
  isLoadingPatients: boolean;
  selectedPatientId: number | null;
  setSelectedPatientId: (id: number | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortCriteria: string;
  setSortCriteria: (criteria: string) => void;
  handleRefreshPatients: () => Promise<void>;
}

export function usePatients(currentUser: CurrentUser | null, authToken: string | null): UsePatientsReturn {
  const router = useRouter();
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(true);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortCriteria, setSortCriteria] = useState<string>('risk');

  // 목업 데이터 시뮬레이션용 인덱스 (ref로 관리하여 리렌더링 최소화)
  const mockDataTimeIndexRef = useRef<number>(0);

  // Mobius 요청 실패 상태를 각 환자 ID별로 관리하는 맵
  const mobiusStatesRef = useRef<Map<number, PatientMobiusState>>(new Map());

  // 백오프 상태 초기화 헬퍼 함수
  const initializeMobiusState = useCallback((patientId: number) => {
    mobiusStatesRef.current.set(patientId, {
      retryCount: 0,
      pollingStopped: false,
      nextAttemptTime: 0,
    });
  }, []);

  // 1. 환자 데이터 초기 로딩 (DB에서 가져오고, Mobius 환자 상태 초기화)
  const loadPatients = useCallback(async () => {
    if (!currentUser?.organization?.id || !authToken) {
      setAllPatients([]);
      setIsLoadingPatients(false);
      return;
    }

    setIsLoadingPatients(true);
    try {
      const patientsFromDB = await fetchPatients(authToken, currentUser.organization.id, router);

      const patientsCombinedWithData = patientsFromDB.map(patient => {
        if (MOBIUS_PATIENT_IDS.includes(patient.patient_id)) {
          // Mobius 환자는 초기 로딩 시 DB 데이터 그대로 유지
          initializeMobiusState(patient.patient_id); // 각 Mobius 환자에 대한 백오프 상태 초기화
          return { ...patient };
        } else {
          // 목업 데이터를 사용할 환자
          const patientIdKey = patient.patient_id;
          const mockSensorSeries = timeSeriesData[patientIdKey as keyof typeof timeSeriesData];

          let initialHeartRate = patient.current_heart_rate;
          let initialTemperature = patient.current_temperature;
          let heartRateHistoryForCard = patient.heart_rate_history || [];
          let temperatureHistoryForCard = patient.temperature_history || [];

          if (mockSensorSeries) {
            if (heartRateHistoryForCard.length === 0 && mockSensorSeries.heartRate) {
              heartRateHistoryForCard = [...mockSensorSeries.heartRate];
            }
            if (temperatureHistoryForCard.length === 0 && mockSensorSeries.temperature) {
              temperatureHistoryForCard = [...mockSensorSeries.temperature];
            }
            if (initialHeartRate === null && heartRateHistoryForCard.length > 0) {
              initialHeartRate = heartRateHistoryForCard[0];
            }
            if (initialTemperature === null && temperatureHistoryForCard.length > 0) {
              initialTemperature = temperatureHistoryForCard[0];
            }
          }

          return {
            ...patient,
            current_heart_rate: initialHeartRate,
            current_temperature: initialTemperature,
            heart_rate_history: heartRateHistoryForCard,
            temperature_history: temperatureHistoryForCard,
          };
        }
      });
      setAllPatients(patientsCombinedWithData);
      mockDataTimeIndexRef.current = 0; // 목업 시뮬레이션 인덱스 초기화

    } catch (error) {
      console.error("환자 데이터 로딩 중 오류 발생:", error);
      setAllPatients([]);
    } finally {
      setIsLoadingPatients(false);
    }
  }, [currentUser, authToken, router, initializeMobiusState]);

  useEffect(() => {
    if (currentUser && authToken) {
      loadPatients();
    }
  }, [currentUser, authToken, loadPatients]);


  // 2-1. 목업 데이터 업데이트 타이머 (Mobius와 독립적)
  useEffect(() => {
    // 로딩 중이거나 환자가 없으면 타이머 시작 안 함
    if (isLoadingPatients || allPatients.length === 0) {
      return;
    }

    const mockDataIntervalId = setInterval(() => {
      mockDataTimeIndexRef.current += 1;

      setAllPatients(currentPatientList =>
        currentPatientList.map(patient => {
          // Mobius 환자는 목업 데이터 업데이트에서 제외 (모든 Mobius 환자 ID에 대해)
          if (MOBIUS_PATIENT_IDS.includes(patient.patient_id)) {
            return patient;
          }

          const patientIdKey = patient.patient_id;
          const mockSensors = timeSeriesData[patientIdKey as keyof typeof timeSeriesData];

          if (!mockSensors || !mockSensors.heartRate || !mockSensors.temperature) {
            return patient;
          }

          const newHeartRate = mockSensors.heartRate[mockDataTimeIndexRef.current % mockSensors.heartRate.length];
          const newTemperature = mockSensors.temperature[mockDataTimeIndexRef.current % mockSensors.temperature.length];

          let updatedRisk: Patient['risk'] = 'low';

          const isHeartRateCriticalHigh = (newHeartRate ?? 0) > 100;
          const isHeartRateCriticalLow = (newHeartRate ?? 0) < 55;
          const isTemperatureCriticalHigh = (newTemperature ?? 0) >= 38.0;
          const isTemperatureCriticalLow = (newTemperature ?? 0) <= 35.7;

          if (isHeartRateCriticalHigh || isHeartRateCriticalLow || isTemperatureCriticalHigh || isTemperatureCriticalLow) {
            updatedRisk = 'high';
          } else {
            const isHeartRateWarning = ((newHeartRate ?? 0) > 85 && (newHeartRate ?? 0) <= 100) || ((newHeartRate ?? 0) < 60 && (newHeartRate ?? 0) >= 55);
            const isTemperatureWarning = ((newTemperature ?? 0) >= 37.5 && (newTemperature ?? 0) < 38.0) || ((newTemperature ?? 0) < 36.0 && (newTemperature ?? 0) > 35.7);

            if (isHeartRateWarning || isTemperatureWarning) {
              updatedRisk = 'medium';
            } else {
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
    }, SIMULATION_INTERVAL);

    return () => clearInterval(mockDataIntervalId);
  }, [isLoadingPatients, allPatients.length]);


  // 2-2. Mobius 데이터 폴링 타이머 (각 Mobius 환자에게 지수 백오프 독립 적용)
  useEffect(() => {
    // 로딩 중이거나 환자가 없거나 인증 토큰이 없으면 타이머 시작 안 함
    if (isLoadingPatients || allPatients.length === 0 || !authToken) {
      return;
    }

    // Mobius 데이터를 받을 환자들이 있는지 확인
    const mobiusPatientsInList = allPatients.filter(p => MOBIUS_PATIENT_IDS.includes(p.patient_id));
    if (mobiusPatientsInList.length === 0) {
        return; // Mobius 데이터를 받을 환자가 없으면 폴링 시작 안 함
    }

    const mobiusPollingIntervalId = setInterval(async () => {
      const now = Date.now();

      for (const patient of mobiusPatientsInList) {
        // Map에서 해당 환자의 상태를 가져오거나, 없으면 초기화 (로딩 후 추가될 수 있으므로)
        let patientMobiusState = mobiusStatesRef.current.get(patient.patient_id);
        if (!patientMobiusState) {
            initializeMobiusState(patient.patient_id);
            patientMobiusState = mobiusStatesRef.current.get(patient.patient_id)!; // 초기화 후 다시 가져오기
        }

        // 해당 환자의 요청이 중단되었는지 확인 및 재시도 시간 도래 여부 확인
        if (patientMobiusState.pollingStopped && now < patientMobiusState.nextAttemptTime) {
            // console.log(`Mobius 폴링 일시 중단 중 (환자 ID: ${patient.patient_id}). 다음 시도까지 대기...`);
            continue; // 아직 재시도 대기 시간 중, 다음 환자로 넘어감
        }

        // 재시도 시간 도래 시, 상태 초기화 후 재시도
        if (patientMobiusState.pollingStopped && now >= patientMobiusState.nextAttemptTime) {
            patientMobiusState.pollingStopped = false;
            patientMobiusState.retryCount = 0; // 재시도 카운트 초기화하여 다시 시작
            patientMobiusState.nextAttemptTime = 0;
            console.log(`Mobius 폴링 재개 시도 (환자 ID: ${patient.patient_id})...`);
        }

        // Mobius 데이터 요청 시도 (try-catch 블록으로 감싸기)
        try {
          const mobiusData = await fetchLatestSensorData(patient.patient_id, authToken, router);

          if (mobiusData) {
            setAllPatients(prevPatients => prevPatients.map(p => {
              if (p.patient_id === patient.patient_id) { // 현재 순회 중인 Mobius 환자에게만 업데이트
                const updatedPatient = {
                  ...p,
                  current_heart_rate: mobiusData.current_heart_rate ?? p.current_heart_rate,
                  current_temperature: mobiusData.current_temperature ?? p.current_temperature,
                  current_fall_status: mobiusData.current_fall_status ?? p.current_fall_status,
                  current_gps_latitude: mobiusData.current_gps_latitude ?? p.current_gps_latitude,
                  current_gps_longitude: mobiusData.current_gps_longitude ?? p.current_gps_longitude,
                  current_step_count: mobiusData.current_step_count ?? p.current_step_count,
                  current_acceleration_x: mobiusData.current_acceleration_x ?? p.current_acceleration_x,
                  current_acceleration_y: mobiusData.current_acceleration_y ?? p.current_acceleration_y,
                  current_acceleration_z: mobiusData.current_acceleration_z ?? p.current_acceleration_z,
                  current_gyro_x: mobiusData.current_gyro_x ?? p.current_gyro_x,
                  current_gyro_y: mobiusData.current_gyro_y ?? p.current_gyro_y,
                  current_gyro_z: mobiusData.current_gyro_z ?? p.current_gyro_z,
                  current_battery_level: mobiusData.current_battery_level ?? p.current_battery_level,
                  lastUpdated: mobiusData.lastUpdated || new Date().toLocaleTimeString(),
                  heart_rate_history: mobiusData.heart_rate_history && mobiusData.heart_rate_history.length > 0 ? mobiusData.heart_rate_history : p.heart_rate_history,
                  temperature_history: mobiusData.temperature_history && mobiusData.temperature_history.length > 0 ? mobiusData.temperature_history : p.temperature_history,
                };

                let updatedRisk: Patient['risk'] = 'low';
                const hr = updatedPatient.current_heart_rate ?? 0;
                const temp = updatedPatient.current_temperature ?? 0;

                const isHeartRateCriticalHigh = hr > 100;
                const isHeartRateCriticalLow = hr < 55;
                const isTemperatureCriticalHigh = temp >= 38.0;
                const isTemperatureCriticalLow = temp <= 35.7;

                if (isHeartRateCriticalHigh || isHeartRateCriticalLow || isTemperatureCriticalHigh || isTemperatureCriticalLow) {
                  updatedRisk = 'high';
                } else {
                  const isHeartRateWarning = (hr > 85 && hr <= 100) || (hr < 60 && hr >= 55);
                  const isTemperatureWarning = (temp >= 37.5 && temp < 38.0) || (temp < 36.0 && temp > 35.7);
                  if (isHeartRateWarning || isTemperatureWarning) {
                    updatedRisk = 'medium';
                  } else {
                    updatedRisk = 'low';
                  }
                }
                updatedPatient.risk = updatedRisk;
                return updatedPatient;
              }
              return p;
            }));

            // 성공하면 해당 환자의 재시도 카운트 초기화
            patientMobiusState.retryCount = 0;
            patientMobiusState.pollingStopped = false;
            patientMobiusState.nextAttemptTime = 0;

          } else {
            // mobiusData가 null인 경우 (404 Not Found 등 API는 성공했으나 데이터 없음)
            patientMobiusState.retryCount += 1;
            console.warn(`Mobius 데이터 요청 실패 (환자 ID: ${patient.patient_id}, 재시도 횟수: ${patientMobiusState.retryCount})`);

            if (patientMobiusState.retryCount >= MAX_MOBIUS_RETRY_COUNT) {
              patientMobiusState.pollingStopped = true;
              let backoffTime = Math.min(
                INITIAL_MOBIUS_BACKOFF_TIME_MS * Math.pow(2, patientMobiusState.retryCount - 1),
                MAX_MOBIUS_BACKOFF_TIME_MS
              );
              patientMobiusState.nextAttemptTime = now + backoffTime;
              console.error(`Mobius 데이터 요청 중단 (환자 ID: ${patient.patient_id}): 최대 재시도 횟수(${MAX_MOBIUS_RETRY_COUNT}) 초과. 다음 시도: ${new Date(patientMobiusState.nextAttemptTime).toLocaleTimeString()} (${backoffTime / 1000}초 후)`);
            }
          }
        } catch (error: any) {
          // 네트워크 오류 등 예외 발생 시
          patientMobiusState.retryCount += 1;
          console.error(`Mobius 데이터 요청 중 오류 발생 (환자 ID: ${patient.patient_id}, 재시도 횟수: ${patientMobiusState.retryCount}):`, error.message);

          if (patientMobiusState.retryCount >= MAX_MOBIUS_RETRY_COUNT) {
            patientMobiusState.pollingStopped = true;
            let backoffTime = Math.min(
              INITIAL_MOBIUS_BACKOFF_TIME_MS * Math.pow(2, patientMobiusState.retryCount - 1),
              MAX_MOBIUS_BACKOFF_TIME_MS
            );
            patientMobiusState.nextAttemptTime = now + backoffTime;
            console.error(`Mobius 데이터 요청 중단 (환자 ID: ${patient.patient_id}): 최대 재시도 횟수(${MAX_MOBIUS_RETRY_COUNT}) 초과. 다음 시도: ${new Date(patientMobiusState.nextAttemptTime).toLocaleTimeString()} (${backoffTime / 1000}초 후)`);
          }
        }
      } // for loop end
    }, MOBIUS_DATA_POLLING_INTERVAL);

    return () => clearInterval(mobiusPollingIntervalId);
  }, [isLoadingPatients, allPatients.length, authToken, router, initializeMobiusState]);


  // 3. 검색 및 정렬 로직 (기존과 동일)
  const displayedPatients: Patient[] = useMemo(() => {
    let filtered: Patient[] = allPatients;

    if (searchTerm) {
      filtered = filtered.filter((patient: Patient) =>
        (patient.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered = filtered.filter(patient => patient.status === PatientStatus.ACTIVE);

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

  // 4. 선택된 환자 ID 동기화 (기존과 동일)
  useEffect(() => {
    if (!isLoadingPatients && displayedPatients.length > 0) {
      const firstPatient = displayedPatients[0];
      if (selectedPatientId === null || !displayedPatients.find(p => p.patient_id === selectedPatientId)) {
        setSelectedPatientId(firstPatient.patient_id);
      }
    } else if (!isLoadingPatients && displayedPatients.length === 0) {
      setSelectedPatientId(null);
    }
  }, [isLoadingPatients, displayedPatients, selectedPatientId]);

  const handleRefreshPatients = useCallback(async () => {
    // 새로고침 시 모든 Mobius 환자의 재시도 카운트 및 중단 상태 초기화
    MOBIUS_PATIENT_IDS.forEach(initializeMobiusState);
    await loadPatients();
  }, [loadPatients, initializeMobiusState]);

  return {
    allPatients,
    displayedPatients,
    isLoadingPatients,
    selectedPatientId,
    setSelectedPatientId,
    searchTerm,
    setSearchTerm,
    sortCriteria,
    setSortCriteria,
    handleRefreshPatients,
  };
}
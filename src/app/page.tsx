// src/app/page.tsx

"use client"; // React 훅과 이벤트 핸들러 사용 위함

import { useState, useEffect, useMemo } from 'react';
import PatientList from '@/components/PatientList';
import PatientDetail from '@/components/PatientDetail';
import { initialPatients } from '@/lib/mockData'; // 목업 데이터 import

// 환자 데이터 타입 정의 (필요에 따라 더 구체적으로)
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
  }
}

export default function DashboardPage() {
  // --- 상태 변수들 ---
  const [allPatients, setAllPatients] = useState<Patient[]>(initialPatients as Patient[]); // 모든 환자 데이터 (원본)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null); // 선택된 환자의 ID
  const [searchTerm, setSearchTerm] = useState<string>(''); // 검색어
  const [sortCriteria, setSortCriteria] = useState<string>('risk'); // 정렬 기준 (기본: 위험도순)

  // --- 파생 상태 (검색 및 정렬된 환자 목록) ---
  const displayedPatients = useMemo(() => {
    let filtered = allPatients;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 정렬
    const sorted = [...filtered]; // 복사본으로 정렬
    if (sortCriteria === 'risk') {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      sorted.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);
    } else if (sortCriteria === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortCriteria === 'heart') {
      sorted.sort((a, b) => b.heartRate - a.heartRate); // 높은 값부터
    } else if (sortCriteria === 'temp') {
      sorted.sort((a, b) => b.temperature - a.temperature); // 높은 값부터
    }
    return sorted;
  }, [allPatients, searchTerm, sortCriteria]);

  // --- 선택된 환자 객체 ---
  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return allPatients.find(p => p.id === selectedPatientId) || null;
  }, [allPatients, selectedPatientId]);

  // --- 효과 (Effects) ---
  // 1. 초기 환자 선택 (displayedPatients가 준비되면)
  useEffect(() => {
    if (displayedPatients.length > 0) {
      // 현재 선택된 환자가 없거나, 현재 목록에 없다면 첫 번째 환자로 선택
      if (!selectedPatientId || !displayedPatients.find(p => p.id === selectedPatientId)) {
        setSelectedPatientId(displayedPatients[0].id);
      }
    } else {
      setSelectedPatientId(null); // 목록이 비면 선택 해제
    }
  }, [displayedPatients, selectedPatientId]); // displayedPatients가 바뀔 때마다 실행

  // 2. (시뮬레이션) 실시간 데이터 업데이트 로직
  useEffect(() => {
    const interval = setInterval(() => {
      setAllPatients(prevPatients =>
        prevPatients.map(p => {
          if (Math.random() < 0.2) { // 20% 확률로 일부 환자 데이터 변경
            const newHeartRate = Math.floor(Math.random() * (130 - 50 + 1)) + 50; // 50 ~ 130
            const newTemperature = parseFloat((Math.random() * (40.0 - 35.0) + 35.0).toFixed(1)); // 35.0 ~ 40.0
            let newRisk: 'high' | 'medium' | 'low' = 'low';
            if (newHeartRate > 100 || newTemperature > 38.5) newRisk = 'high';
            else if (newHeartRate > 85 || newTemperature > 37.5) newRisk = 'medium';

            const newHeartRateHistory = [...p.heartRateHistory.slice(1), newHeartRate];
            const newTemperatureHistory = [...p.temperatureHistory.slice(1), newTemperature];

            return {
              ...p,
              heartRate: newHeartRate,
              temperature: newTemperature,
              risk: newRisk,
              lastUpdated: 'just now',
              heartRateHistory: newHeartRateHistory,
              temperatureHistory: newTemperatureHistory,
              gyro: {
                x: parseFloat((Math.random() * 1 - 0.5).toFixed(2)),
                y: parseFloat((Math.random() * 1 - 0.5).toFixed(2)),
                z: parseFloat((Math.random() * 0.4 + 0.8).toFixed(2)), // 0.8 ~ 1.2
              },
              fallStatus: (newRisk === 'high' && Math.random() < 0.3) ? 'alert' : p.fallStatus, // 위험도 높을때 가끔 낙상 알림
            };
          }
          return p;
        })
      );
    }, 5000); // 5초마다 업데이트

    return () => clearInterval(interval); // 컴포넌트 언마운트 시 인터벌 정리
  }, []); // 최초 1회만 실행

  // --- 이벤트 핸들러 ---
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatientId(patient.id);
  };

  const handleSort = (criteria: string) => {
    setSortCriteria(criteria);
  };

  // --- JSX 반환 ---
  return (
    <> {/* RootLayout의 children으로 들어가는 부분이므로 Fragment 사용 */}
      <div className="w-[320px] border-r border-gray-200 bg-white flex flex-col shrink-0">
        {/* PatientList 컴포넌트에 필요한 props 전달 */}
        <PatientList
          patients={displayedPatients}
          onSelectPatient={handleSelectPatient}
          selectedPatientId={selectedPatientId}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm} // 검색어 변경 함수 전달
          onSort={handleSort} // 정렬 함수 전달
          activeSort={sortCriteria} // 현재 정렬 기준 전달
        />
      </div>
      <div className="flex-1 bg-gray-50 flex flex-col overflow-y-auto">
        {/* PatientDetail 컴포넌트에 선택된 환자 정보 전달 */}
        {selectedPatient ? (
          <PatientDetail patient={selectedPatient} />
        ) : (
          <div className="p-6 flex-1 flex items-center justify-center">
            <p className="text-gray-500">목록에서 환자를 선택해주세요.</p>
          </div>
        )}
      </div>
    </>
  );
}
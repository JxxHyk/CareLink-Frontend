// pages/index.js
import { useState, useEffect } from 'react';
import PatientList from '@/components/PatientList';
import PatientDetail from '@/components/PatientDetail';
import { initialPatients } from '@/lib/mockData'; // 목업 데이터 가져오기

export default function DashboardPage() {
  const [patients, setPatients] = useState(initialPatients);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] = useState('risk'); // 기본 정렬: 위험도순

  // 초기 선택 환자 설정 (첫 번째 환자)
  useEffect(() => {
    if (patients.length > 0) {
      setSelectedPatient(patients[0]);
    }
  }, [patients]); // patients 데이터가 변경될 때 (예: 초기 로드)

  // 환자 검색 로직
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 환자 정렬 로직
  const sortPatients = (criteria) => {
    let sorted = [...filteredPatients];
    if (criteria === 'risk') {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      sorted.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);
    } else if (criteria === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (criteria === 'heart') {
      sorted.sort((a, b) => b.heartRate - a.heartRate);
    } else if (criteria === 'temp') {
      sorted.sort((a, b) => b.temperature - a.temperature);
    }
    setPatients(sorted); // 정렬된 결과를 patients 상태에 반영 (주의: filteredPatients가 아닌 원본을 정렬해야 할 수도 있음)
    setSortCriteria(criteria);
     // 정렬 후, selectedPatient가 리스트에 없다면 첫번째로 재설정
    if (sorted.length > 0 && (!selectedPatient || !sorted.find(p => p.id === selectedPatient.id))) {
      setSelectedPatient(sorted[0]);
    } else if (sorted.length === 0) {
      setSelectedPatient(null);
    }
  };

  // 환자 선택 핸들러
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
  };

  // (시뮬레이션) 실시간 데이터 업데이트 로직
  useEffect(() => {
    const interval = setInterval(() => {
      setPatients(prevPatients =>
        prevPatients.map(p => {
          // 랜덤하게 일부 환자 데이터 변경 (실제로는 WebSocket 등 사용)
          if (Math.random() < 0.1) { // 10% 확률로 업데이트
            const newHeartRate = Math.floor(Math.random() * (120 - 60 + 1)) + 60;
            const newTemperature = parseFloat((Math.random() * (39.5 - 36.0) + 36.0).toFixed(1));
            let newRisk = 'low';
            if (newHeartRate > 100 || newTemperature > 38.5) newRisk = 'high';
            else if (newHeartRate > 85 || newTemperature > 37.5) newRisk = 'medium';

            // 차트 데이터도 업데이트 (가장 최근 값만 변경하는 예시)
            const newHeartRateHistory = [...(p.heartRateHistory || []).slice(1), newHeartRate];
            const newTemperatureHistory = [...(p.temperatureHistory || []).slice(1), newTemperature];


            return {
              ...p,
              heartRate: newHeartRate,
              temperature: newTemperature,
              risk: newRisk,
              lastUpdated: 'just now',
              heartRateHistory: newHeartRateHistory,
              temperatureHistory: newTemperatureHistory,
              gyro: { // 자이로 값도 랜덤하게 업데이트
                x: parseFloat((Math.random() * (0.5 - (-0.5)) + (-0.5)).toFixed(2)),
                y: parseFloat((Math.random() * (0.5 - (-0.5)) + (-0.5)).toFixed(2)),
                z: parseFloat((Math.random() * (1.0 - 0.8) + 0.8).toFixed(2)),
              }
            };
          }
          return p;
        })
      );
    }, 5000); // 5초마다 업데이트

    return () => clearInterval(interval); // 컴포넌트 언마운트 시 인터벌 정리
  }, []);

  // 선택된 환자 정보가 업데이트되면 PatientDetail에도 반영
  useEffect(() => {
    if (selectedPatient) {
      const updatedSelectedPatient = patients.find(p => p.id === selectedPatient.id);
      if (updatedSelectedPatient) {
        setSelectedPatient(updatedSelectedPatient);
      }
    }
  }, [patients, selectedPatient?.id]);


  return (
    <> {/* Layout 컴포넌트가 _app.js에 있으므로 여기서는 Fragment 사용 */}
      <div className="w-[320px] border-r border-gray-200 bg-white flex flex-col">
        <PatientList
          patients={filteredPatients} // 검색어에 따라 필터링된 환자 목록 전달
          onSelectPatient={handleSelectPatient}
          selectedPatientId={selectedPatient?.id}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSort={sortPatients}
          activeSort={sortCriteria}
        />
      </div>
      <div className="flex-1 bg-gray-50 flex flex-col">
        {selectedPatient ? (
          <PatientDetail patient={selectedPatient} />
        ) : (
          <div className="p-6 flex-1 flex items-center justify-center">
            <p className="text-gray-500">환자를 선택해주세요.</p>
          </div>
        )}
      </div>
    </>
  );
}
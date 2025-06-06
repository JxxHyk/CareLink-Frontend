// src/components/PatientDetail.tsx
import React, { useState } from 'react'; // React와 useState 훅 import
import HeartRateCard from './HeartRateCard';
import TemperatureCard from './TemperatureCard';
import FallDetectionCard from './FallDetectionCard';
import GPSCard from './GPSCard';
import AlertHistory from './AlertHistory'; // AlertHistory도 .tsx로 바뀌었으니 확인!
import MedicalNotesModal from './MedicalNotesModal';
import EmergencyManualModal from './EmergencyManualModal';

import type { Patient } from '@/types'; // Patient 타입 import

// PatientDetail 컴포넌트가 받을 props 타입 정의
interface PatientDetailProps {
  patient: Patient | null; // patient prop은 Patient 타입이거나 null일 수 있음
}

const PatientDetail = ({ patient }: PatientDetailProps) => { // props에 타입 적용
  const [isMedicalNotesModalOpen, setIsMedicalNotesModalOpen] = useState(false);
  const [isEmergencyManualModalOpen, setIsEmergencyManualModalOpen] = useState(false);

  if (!patient) {
    return <div className="p-6">환자 정보가 없습니다.</div>;
  }

  // patient 객체의 필드들을 구조 분해 할당
  const {
    full_name,
    patient_code,
    date_of_birth,
    current_heart_rate,
    heart_rate_history,
    current_temperature,
    temperature_history,
    current_fall_status, // FallDetectionCard에서 사용
    current_gps_latitude, // GPSCard에서 사용될 수 있으나 현재는 gps 객체 사용
    current_gps_longitude, // GPSCard에서 사용될 수 있으나 현재는 gps 객체 사용
    gps, // GPSCard로 직접 전달
    medical_notes,
    contact_number,
    emergency_contact,
    emergency_number,
    // 시뮬레이션용 mockData에서 사용되는 필드 (Patient 타입에 정의되어 있지 않은 경우를 대비하여 추가)
    gyro, // Patient 타입에 정의됨
    lastMovement, // Patient 타입에 정의됨
    movementPattern, // Patient 타입에 정의됨
    lastUpdated, // Patient 타입에 정의됨
  } = patient;

  return (
    <div className="p-6 flex-1 overflow-y-auto scrollbar-hide">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{full_name}</h2>
          <div className="flex items-center mt-1">
            <span className="text-sm text-gray-500 mr-4">ID: {patient_code}</span>
            <span className="text-sm text-gray-500 mr-4">생년월일: {date_of_birth ? new Date(date_of_birth).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsMedicalNotesModalOpen(true)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-button text-gray-700 hover:bg-gray-50 whitespace-nowrap">
            <i className="ri-file-list-3-line mr-1"></i>의료 특이사항
          </button>
          <button
            onClick={() => setIsEmergencyManualModalOpen(true)}
            className="px-3 py-2 bg-red-100 border border-red-200 rounded-button text-red-600 hover:bg-red-200 whitespace-nowrap">
            <i className="ri-alarm-warning-line mr-1"></i>응급상황
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <HeartRateCard
          currentValue={current_heart_rate ?? null}
          historyData={heart_rate_history || []}
          lastUpdated={lastUpdated ?? null} // lastUpdated가 string | null 타입으로 Patient에 정의되어 있어야 함
        />
        <TemperatureCard
          currentValue={current_temperature ?? null}
          historyData={temperature_history || []}
          lastUpdated={lastUpdated ?? null}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <FallDetectionCard
            gyro={gyro || {x:0,y:0,z:0}} // gyro가 null일 경우를 대비하여 기본값 설정
            lastMovement={lastMovement || 'N/A'}
            movementPattern={movementPattern || 'N/A'}
            fallStatus={current_fall_status || 'N/A'} // Patient 타입에 현재 필드명과 일치하는지 확인
        />
        <GPSCard gpsData={gps}/>
      </div>

      <AlertHistory /> {/* props 없이 사용 */}

      <MedicalNotesModal
        isOpen={isMedicalNotesModalOpen}
        onClose={() => setIsMedicalNotesModalOpen(false)}
        notes={medical_notes || '작성된 의료 특이사항이 없습니다.'}
      />

      <EmergencyManualModal
        isOpen={isEmergencyManualModalOpen}
        onClose={() => setIsEmergencyManualModalOpen(false)}
        patientName={full_name}
        gpsLocation={gps?.address || '확인 불가'}
        contactNumber={contact_number || '정보 없음'}
        emergencyContact={emergency_contact || '정보 없음'}
        emergencyNumber={emergency_number || '정보 없음'}
        medicalNotes={medical_notes || '특이사항 없음'}
      />
    </div>
  );
};

export default PatientDetail;
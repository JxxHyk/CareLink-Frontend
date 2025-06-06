// src/components/PatientDetail.js
import React, { useState } from 'react'; // ✨ useState import
import HeartRateCard from './HeartRateCard';
import TemperatureCard from './TemperatureCard';
import FallDetectionCard from './FallDetectionCard';
import GPSCard from './GPSCard';
import AlertHistory from './AlertHistory';
import MedicalNotesModal from './MedicalNotesModal'; // ✨ 새로 만들 모달 컴포넌트 import
import EmergencyManualModal from './EmergencyManualModal'; // ✨ 새로 만들 모달 컴포넌트 import


const PatientDetail = ({ patient }) => {
  // ✨ 팝업 모달의 열림/닫힘 상태 관리
  const [isMedicalNotesModalOpen, setIsMedicalNotesModalOpen] = useState(false);
  const [isEmergencyManualModalOpen, setIsEmergencyManualModalOpen] = useState(false);

  if (!patient) {
    return <div className="p-6">환자 정보가 없습니다.</div>;
  }

  const {
    full_name,
    patient_code,
    date_of_birth,
    current_heart_rate,
    heart_rate_history,
    current_temperature,
    temperature_history,
    gyro,
    lastMovement,
    movementPattern,
    current_fall_status,
    gps,
    lastUpdated,
    medical_notes, // ✨ patient prop에서 medical_notes 추출
    contact_number, // ✨ patient prop에서 contact_number 추출
    emergency_contact, // ✨ patient prop에서 emergency_contact 추출
    emergency_number, // ✨ patient prop에서 emergency_number 추출
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
          <button className="px-3 py-2 bg-white border border-gray-300 rounded-button text-gray-700 hover:bg-gray-50 whitespace-nowrap">
            <i className="ri-history-line mr-1"></i>이력
          </button>
          <button
            onClick={() => setIsMedicalNotesModalOpen(true)} // ✨ 클릭 시 모달 열기
            className="px-3 py-2 bg-white border border-gray-300 rounded-button text-gray-700 hover:bg-gray-50 whitespace-nowrap">
            <i className="ri-file-list-3-line mr-1"></i>의료 특이사항
          </button>
          <button
            onClick={() => setIsEmergencyManualModalOpen(true)} // ✨ 클릭 시 모달 열기
            className="px-3 py-2 bg-red-100 border border-red-200 rounded-button text-red-600 hover:bg-red-200 whitespace-nowrap">
            <i className="ri-alarm-warning-line mr-1"></i>응급상황
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <HeartRateCard
          currentValue={current_heart_rate ?? null}
          historyData={heart_rate_history || []}
          lastUpdated={lastUpdated}
        />
        <TemperatureCard
          currentValue={current_temperature ?? null}
          historyData={temperature_history || []}
          lastUpdated={lastUpdated}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <FallDetectionCard
            gyro={gyro || {x:0,y:0,z:0}}
            lastMovement={lastMovement || 'N/A'}
            movementPattern={movementPattern || 'N/A'}
            fallStatus={current_fall_status}
        />
        <GPSCard gpsData={gps}/>
      </div>

      <AlertHistory />

      {/* ✨ 의료 특이사항 모달 */}
      <MedicalNotesModal
        isOpen={isMedicalNotesModalOpen}
        onClose={() => setIsMedicalNotesModalOpen(false)}
        notes={medical_notes || '작성된 의료 특이사항이 없습니다.'} // notes prop 전달
      />

      {/* ✨ 응급상황 매뉴얼 모달 */}
      <EmergencyManualModal
        isOpen={isEmergencyManualModalOpen}
        onClose={() => setIsEmergencyManualModalOpen(false)}
        patientName={full_name}
        gpsLocation={gps?.address || '확인 불가'} // GPS 주소 또는 기본값
        contactNumber={contact_number || '정보 없음'}
        emergencyContact={emergency_contact || '정보 없음'}
        emergencyNumber={emergency_number || '정보 없음'}
        medicalNotes={medical_notes || '특이사항 없음'} // 의료 특이사항 내용
      />
    </div>
  );
};

export default PatientDetail;
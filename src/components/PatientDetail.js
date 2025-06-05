// src/components/PatientDetail.js
import HeartRateCard from './HeartRateCard'; //
import TemperatureCard from './TemperatureCard'; //
import FallDetectionCard from './FallDetectionCard'; //
import GPSCard from './GPSCard'; //
import AlertHistory from './AlertHistory'; //

const PatientDetail = ({ patient }) => {
  if (!patient) {
    return <div className="p-6">환자 정보가 없습니다.</div>; //
  }

  // patient 객체에서 필요한 값을 명시적으로 추출하거나, 직접 patient.field 형태로 사용
  const {
    full_name,
    patient_code,
    date_of_birth,
    // 센서 카드에 전달할 값들
    current_heart_rate,
    heart_rate_history,
    current_temperature,
    temperature_history,
    // 다른 카드용 데이터
    gyro,
    lastMovement,
    movementPattern,
    current_fall_status, // API 응답의 필드명과 Patient 타입을 일치시켜야 함
    gps
  } = patient;

  return (
    <div className="p-6 flex-1 overflow-y-auto scrollbar-hide"> {/* */}
      <div className="flex justify-between items-start mb-6"> {/* */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{full_name}</h2> {/* */}
          <div className="flex items-center mt-1"> {/* */}
            <span className="text-sm text-gray-500 mr-4">ID: {patient_code}</span> {/* */}
            <span className="text-sm text-gray-500 mr-4">생년월일: {date_of_birth ? new Date(date_of_birth).toLocaleDateString() : 'N/A'}</span> {/* */}
          </div>
        </div>
        {/* 버튼들 ... */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"> {/* */}
        <HeartRateCard
          currentValue={current_heart_rate ?? null}
          historyData={heart_rate_history || []}
        />
        <TemperatureCard
          currentValue={current_temperature ?? null} // ✨ TemperatureCard도 동일하게 수정 필요
          historyData={temperature_history || []}   // ✨ TemperatureCard도 동일하게 수정 필요
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"> {/* */}
        <FallDetectionCard //
            gyro={gyro || {x:0,y:0,z:0}} //
            lastMovement={lastMovement || 'N/A'} //
            movementPattern={movementPattern || 'N/A'} //
            fallStatus={current_fall_status} //
        />
        <GPSCard gpsData={gps}/> {/* */}
      </div>

      <AlertHistory /> {/* */}
    </div>
  );
};

export default PatientDetail;
// components/PatientDetail.js
import HeartRateCard from './HeartRateCard';
import TemperatureCard from './TemperatureCard';
import FallDetectionCard from './FallDetectionCard';
import GPSCard from './GPSCard';
import AlertHistory from './AlertHistory';

const PatientDetail = ({ patient }) => {
  if (!patient) {
    return <div className="p-6">환자 정보가 없습니다.</div>;
  }

  return (
    <div className="p-6 flex-1 overflow-y-auto scrollbar-hide">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{patient.full_name}</h2>
          <div className="flex items-center mt-1">
            <span className="text-sm text-gray-500 mr-4">ID: {patient.patient_code}</span>
            <span className="text-sm text-gray-500 mr-4">생년월일: {patient.date_of_birth}</span>
            {/* <span className="text-sm text-gray-500">Room: {patient.room}</span> */}
          </div>
        </div>
        <div className="flex space-x-2">
          {/* 버튼들 ... */}
          <button className="px-3 py-2 bg-white border border-gray-300 rounded-button text-gray-700 hover:bg-gray-50 whitespace-nowrap">
            <i className="ri-history-line mr-1"></i>이력
          </button>
          <button className="px-3 py-2 bg-white border border-gray-300 rounded-button text-gray-700 hover:bg-gray-50 whitespace-nowrap">
            <i className="ri-file-list-3-line mr-1"></i>의료 특이사항
          </button>
          <button className="px-3 py-2 bg-red-100 border border-red-200 rounded-button text-red-600 hover:bg-red-200 whitespace-nowrap">
            <i className="ri-alarm-warning-line mr-1"></i>응급상황
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <HeartRateCard
          heartRate={patient.heartRate}
          history={patient.heartRateHistory || []} // mockData에 history 추가 필요
        />
        <TemperatureCard
          temperature={patient.temperature}
          history={patient.temperatureHistory || []} // mockData에 history 추가 필요
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <FallDetectionCard
            gyro={patient.gyro || {x:0,y:0,z:0}}
            lastMovement={patient.lastMovement || 'N/A'}
            movementPattern={patient.movementPattern || 'N/A'}
            fallStatus={patient.fallStatus}
        />
        <GPSCard gpsData={patient.gps}/>
      </div>

      <AlertHistory /> {/* AlertHistory는 일단 고정된 내용으로 */}
    </div>
  );
};

export default PatientDetail;
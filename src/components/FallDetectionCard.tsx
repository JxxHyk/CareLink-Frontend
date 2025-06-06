// src/components/FallDetectionCard.tsx
import React from 'react';

// FallDetectionCard 컴포넌트가 받을 props들의 타입을 정의
// 이 타입들은 src/types/index.ts (또는 page.tsx)에 정의된 Patient 인터페이스의 관련 필드 타입과 일치해야 함
interface GyroData {
  x: number;
  y: number;
  z: number;
}

// ✨ 이 부분을 수정할 거야! Patient 인터페이스의 current_fall_status 타입과 일치시키자.
type FallStatusType = 'normal' | 'alert' | string | null; // Patient 타입에 맞게 string 포함!

interface FallDetectionCardProps {
  gyro: GyroData; // 자이로 데이터는 객체 형태로 가정
  lastMovement: string | null;
  movementPattern: string | null;
  fallStatus: FallStatusType; // 수정된 FallStatusType 사용
}

const FallDetectionCard = ({
  gyro,
  lastMovement,
  movementPattern,
  fallStatus,
}: FallDetectionCardProps) => {
  let fallStatusText: string;
  let fallStatusClass: string;
  let fallIndicatorDotColor: string;
  let fallIndicatorText: string;

  if (fallStatus === 'alert') {
    fallStatusText = '낙상 위험 감지';
    fallStatusClass = 'px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium alert-animation';
    fallIndicatorDotColor = 'bg-red-500';
    fallIndicatorText = '주의';
  } else if (fallStatus === 'normal') {
    fallStatusText = '정상';
    fallStatusClass = 'px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium';
    fallIndicatorDotColor = 'bg-green-500';
    fallIndicatorText = '안정적';
  } else { // fallStatus가 null이거나 다른 string 값일 경우
    fallStatusText = '데이터 없음'; // 또는 '알 수 없음'으로 표시할 수 있음
    fallStatusClass = 'px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium';
    fallIndicatorDotColor = 'bg-gray-400';
    fallIndicatorText = 'N/A';
  }

  // gyro 값도 null일 가능성을 대비하거나, 부모 컴포넌트(PatientDetail)에서 기본값을 보장해 줘야 함.
  // 여기서는 gyro 객체와 그 안의 x, y, z는 항상 존재한다고 가정 (PatientDetail에서 patient.gyro || {x:0,y:0,z:0} 처럼 처리했다고 전제)
  const gyroX = gyro?.x ?? '--';
  const gyroY = gyro?.y ?? '--';
  const gyroZ = gyro?.z ?? '--';

  return (
    <div className="sensor-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-[280px]">
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-500 mr-3">
              <i className="ri-walk-line"></i>
            </div>
            <h3 className="font-medium text-gray-800">낙상 감지</h3>
          </div>
          <div className="flex items-center">
            <span className={fallStatusClass}>{fallStatusText}</span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-x-2 text-center mb-10">
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 mb-0.5">X-axis</span>
            <span className="text-base font-medium text-gray-800">{gyroX}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 mb-0.5">Y-axis</span>
            <span className="text-base font-medium text-gray-800">{gyroY}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 mb-0.5">Z-axis</span>
            <span className="text-base font-medium text-gray-800">{gyroZ}</span>
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100 text-green-500 mr-2">
                <i className="ri-timer-line"></i>
              </div>
              <span className="text-sm text-gray-700">마지막 움직임:</span>
            </div>
            <span className="text-sm font-medium text-gray-800">{lastMovement || '--'}</span>
          </div>
        </div>
         <div className="mt-4">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div>
              움직임 패턴: <span className="font-medium text-gray-700">{movementPattern || '--'}</span>
            </div>
            <div className="flex items-center">
              <span className={`inline-block w-2 h-2 rounded-full ${fallIndicatorDotColor} mr-1.5`}></span>
              <span>{fallIndicatorText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FallDetectionCard;
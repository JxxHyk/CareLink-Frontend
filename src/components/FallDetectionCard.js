// components/FallDetectionCard.js
const FallDetectionCard = ({ gyro, lastMovement, movementPattern, fallStatus }) => {
    const fallStatusText = fallStatus === 'alert' ? '낙상 위험 감지' : '정상';
    const fallStatusClass = fallStatus === 'alert'
      ? 'px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium alert-animation' // 애니메이션 클래스 추가
      : 'px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium';

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
          <div className="flex justify-between mb-4">
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500 mb-1">X-axis</span>
              <span className="text-lg font-medium text-gray-800">{gyro.x}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500 mb-1">Y-axis</span>
              <span className="text-lg font-medium text-gray-800">{gyro.y}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500 mb-1">Z-axis</span>
              <span className="text-lg font-medium text-gray-800">{gyro.z}</span>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100 text-green-500 mr-2">
                  <i className="ri-timer-line"></i>
                </div>
                <span className="text-sm text-gray-700">마지막 움직임 감지:</span>
              </div>
              <span className="text-sm font-medium text-gray-800">{lastMovement}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <div>움직임 패턴: <span className="font-medium text-gray-700">{movementPattern}</span></div>
              <div className="flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full ${fallStatus === 'alert' ? 'bg-red-500' : 'bg-green-500'} mr-1`}></span>
                <span>{fallStatus === 'alert' ? '주의' : '안정적'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default FallDetectionCard;
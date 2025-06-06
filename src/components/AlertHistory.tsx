// src/components/AlertHistory.tsx
import React from 'react'; // React를 import 해야 JSX를 사용할 수 있어.

// HealthAlert 타입을 src/types/index.ts에서 가져와야 해.
// AlertType, AlertSeverity는 enums.ts에서 가져와도 되지만, AlertHistory 컴포넌트에서는 직접 사용하지 않으므로 주석 처리.
// import { HealthAlert, AlertType, AlertSeverity } from '@/types';

// 목업 알림 데이터 (실제 데이터와 동일하게 타입 정의)
// 현재 AlertHistory.js에 하드코딩된 alert 배열을 기반으로 타입을 정의할게.
interface DisplayAlert {
  type: string; // 'heart' | 'temp' | 'fall' 등
  title: string;
  detail: string;
  time: string;
  icon: string;
  color: 'red' | 'orange' | 'blue' | 'green' | 'gray'; // 사용하는 색상 종류에 따라
}

const AlertHistory: React.FC = () => {
  // 실제로는 API를 통해 알림 데이터를 받아와야 함
  // 현재는 목업 데이터를 사용
  const alerts: DisplayAlert[] = [
    { type: 'heart', title: '높은 심박수 경고', detail: '심박수 110 BPM 도달', time: '오늘, 10:23 AM', icon: 'ri-heart-pulse-line', color: 'red' },
    { type: 'temp', title: '체온 상승', detail: '체온 38.5°C 도달', time: '어제, 8:45 PM', icon: 'ri-temp-hot-line', color: 'orange' },
    { type: 'fall', title: '낙상 가능성 감지', detail: '급격한 움직임 감지 - 오탐지', time: '5월 21일, 3:12 PM', icon: 'ri-walk-line', color: 'blue' },
  ];

  const getIconColorClass = (color: DisplayAlert['color']) => { // 타입을 명시
      if (color === 'red') return 'bg-red-100 text-red-500';
      if (color === 'orange') return 'bg-orange-100 text-orange-500';
      if (color === 'blue') return 'bg-blue-100 text-blue-500';
      if (color === 'green') return 'bg-green-100 text-green-500'; // 초록색도 추가 (혹시 몰라서)
      return 'bg-gray-100 text-gray-500';
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">최근 알림</h3>
        <button className="text-sm text-primary hover:text-primary/80 whitespace-nowrap">모든 알림 보기</button>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {alerts.map((alert, index) => (
            <div key={index} className="p-4 flex items-center">
              <div className={`w-10 h-10 flex items-center justify-center rounded-full ${getIconColorClass(alert.color)} mr-4`}>
                <i className={alert.icon}></i>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-800">{alert.title}</h4>
                    <p className="text-sm text-gray-500">{alert.detail}</p>
                  </div>
                  <span className="text-xs text-gray-500">{alert.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlertHistory;
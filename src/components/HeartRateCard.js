// components/HeartRateCard.js
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const HeartRateCard = ({ heartRate, history }) => {
  const chartRef = useRef(null); // 차트 DOM 요소를 위한 ref
  const chartInstanceRef = useRef(null); // 차트 인스턴스를 위한 ref

  useEffect(() => {
    if (chartRef.current) {
      // 차트 인스턴스가 없으면 초기화
      if (!chartInstanceRef.current) {
        chartInstanceRef.current = echarts.init(chartRef.current);
      }

      const option = {
        animation: false,
        grid: { top: 10, right: 10, bottom: 20, left: 50 },
        xAxis: {
          type: 'category',
          data: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', 'Now'], // 시간 레이블은 고정 또는 동적으로 변경
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280', fontSize: 10 },
        },
        yAxis: {
          type: 'value', min: 50, max: 120, interval: 10,
          axisLine: { show: false },
          axisLabel: { color: '#6b7280', fontSize: 10 },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: '#e5e7eb',
          textStyle: { color: '#1f2937' },
          formatter: params => `${params[0].axisValue}<br/>${params[0].marker} 심박수: ${params[0].data} BPM`,
        },
        series: [{
          data: history, // props로 받은 history 데이터 사용
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 3, color: 'rgba(87, 181, 231, 1)' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(87, 181, 231, 0.2)' },
              { offset: 1, color: 'rgba(87, 181, 231, 0.05)' },
            ]),
          },
        }],
      };
      chartInstanceRef.current.setOption(option);
    }

    // 컴포넌트 언마운트 시 차트 인스턴스 정리
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, [history]); // history 데이터가 변경될 때마다 차트 업데이트

  // 창 크기 변경 시 차트 리사이즈
  useEffect(() => {
    const handleResize = () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  let statusText = "정상";
  let statusColor = "text-green-500";
  if (heartRate > 100) {
    statusText = "높음";
    statusColor = "text-red-500";
  } else if (heartRate > 85) {
    statusText = "주의 필요";
    statusColor = "text-yellow-500";
  }


  return (
    <div className="sensor-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-500 mr-3">
              <i className="ri-heart-pulse-line"></i>
            </div>
            <h3 className="font-medium text-gray-800">심박수</h3>
          </div>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-800 mr-2">{heartRate}</span>
            <span className="text-sm text-gray-500">BPM</span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div ref={chartRef} className="w-full h-48"></div> {/* 차트가 그려질 DOM 요소 */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <div>정상 범위: 60-100 BPM</div>
          <div className={`flex items-center ${statusColor}`}>
            <span className={`inline-block w-2 h-2 rounded-full ${
                heartRate > 100 ? 'bg-red-500' : heartRate > 85 ? 'bg-yellow-500' : 'bg-green-500'
            } mr-1`}></span>
            <span>{statusText}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeartRateCard;
// components/TemperatureCard.js
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts'; // ECharts 라이브러리 import

const TemperatureCard = ({ temperature, history }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      if (!chartInstanceRef.current) {
        chartInstanceRef.current = echarts.init(chartRef.current);
      }

      const option = {
        animation: false,
        grid: {
          top: 10,
          right: 10,
          bottom: 20,
          left: 50,
        },
        xAxis: {
          type: 'category',
          // X축 데이터는 실제 시간 데이터에 맞게 동적으로 생성하거나 props로 받아오는 게 좋아.
          // 여기서는 HeartRateCard와 동일하게 고정된 시간 레이블을 사용할게.
          data: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', 'Now'],
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280', fontSize: 10 },
        },
        yAxis: {
          type: 'value',
          min: 35, // 체온에 맞는 범위로 조정
          max: 40,
          interval: 1, // 체온에 맞는 간격으로 조정
          axisLine: { show: false },
          axisLabel: { color: '#6b7280', fontSize: 10, formatter: '{value} °C' },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: '#e5e7eb',
          textStyle: { color: '#1f2937' },
          formatter: function (params) {
            return `${params[0].axisValue}<br/>${params[0].marker} 체온: ${params[0].data} °C`;
          },
        },
        series: [{
          data: history, // props로 받은 history 데이터 사용
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 3,
            color: 'rgba(252, 141, 98, 1)', // 주황색 계열 (원래 HTML 코드 참조)
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: 'rgba(252, 141, 98, 0.2)',
              },
              {
                offset: 1,
                color: 'rgba(252, 141, 98, 0.05)',
              },
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
  let statusDotColor = "bg-green-500"; // Tailwind CSS 색상 클래스
  let statusTextColor = "text-green-600";

  if (temperature > 38.5) {
    statusText = "고온 위험";
    statusDotColor = "bg-red-500";
    statusTextColor = "text-red-600";
  } else if (temperature > 37.5) {
    statusText = "주의 필요 (미열)";
    statusDotColor = "bg-yellow-500";
    statusTextColor = "text-yellow-600";
  }

  return (
    <div className="sensor-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-100 text-orange-500 mr-3">
              <i className="ri-temp-hot-line"></i>
            </div>
            <h3 className="font-medium text-gray-800">체온</h3>
          </div>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-800 mr-2">{temperature}</span>
            <span className="text-sm text-gray-500">°C</span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div ref={chartRef} className="w-full h-48"></div> {/* 차트가 그려질 DOM 요소 */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <div>정상 범위: 36.5-37.5 °C</div>
          <div className={`flex items-center ${statusTextColor}`}>
            <span className={`inline-block w-2 h-2 rounded-full ${statusDotColor} mr-1`}></span>
            <span>{statusText}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemperatureCard;
// src/components/TemperatureCard.tsx
import React, { useEffect, useRef } from 'react'; // React와 훅들 import
import * as echarts from 'echarts/core'; // ECharts 핵심 라이브러리
import { LineChart, LineSeriesOption } from 'echarts/charts'; // 라인 차트 사용
import {
  GridComponent,
  GridComponentOption,
  TooltipComponent,
  TooltipComponentOption,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers'; // Canvas 렌더러 사용

// ECharts에 필요한 컴포넌트와 차트 등록
echarts.use([
  GridComponent,
  TooltipComponent,
  LineChart,
  CanvasRenderer,
]);

// ECharts 옵션 타입을 위한 결합 타입
type ECOption = echarts.ComposeOption<
  | LineSeriesOption
  | GridComponentOption
  | TooltipComponentOption
>;

// TemperatureCard 컴포넌트가 받을 props들의 타입을 정의
interface TemperatureCardProps {
  temperature: number | null; // 현재 체온 (null일 수 있음)
  history: number[] | null;   // 체온 기록 배열 (null일 수 있음)
}

const TemperatureCard = ({ temperature, history }: TemperatureCardProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      if (!chartInstanceRef.current) {
        chartInstanceRef.current = echarts.init(chartRef.current);
      }

      const option: ECOption = {
        animation: false,
        grid: { top: 20, right: 20, bottom: 30, left: 45 }, // 여백 조정
        xAxis: {
          type: 'category',
          data: history?.map((_, index) => index.toString()) || ['Now'], // history 길이에 맞추거나 기본값
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280', fontSize: 10 },
          boundaryGap: false,
        },
        yAxis: {
          type: 'value',
          min: 35, // 체온에 맞는 범위로 조정
          max: 41, // 약간의 여유를 둠
          interval: 1, // 체온에 맞는 간격
          axisLine: { show: false },
          axisLabel: { color: '#6b7280', fontSize: 10, formatter: '{value} °C' },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          textStyle: { color: '#1f2937', fontSize: 12 },
          padding: [8, 12],
          formatter: (params: any) => { // params 타입을 any 대신 ECharts 타입으로 지정하면 더 좋음
            if (params && params.length > 0) {
              const currentData = params[0].data;
              return `체온: <strong>${currentData}</strong> °C`;
            }
            return '';
          },
        },
        series: [{
          data: history || [], // history가 null이면 빈 배열 사용
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 2,
          lineStyle: {
            width: 2.5,
            color: 'rgba(252, 141, 98, 1)', // 주황색 계열 (원래 코드 참조)
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(252, 141, 98, 0.3)' }, // 주황색 계열 투명도
              { offset: 1, color: 'rgba(252, 141, 98, 0.05)' },
            ]),
          },
          itemStyle: {
            color: 'rgba(252, 141, 98, 1)',
          },
          emphasis: { // 마우스 올렸을 때 강조 효과
            focus: 'series',
            lineStyle: { width: 3.5 },
            itemStyle: {
              borderWidth: 2,
              borderColor: '#ffffff',
              shadowBlur: 5,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            }
          }
        }],
      };
      chartInstanceRef.current.setOption(option);
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, [history]);

  useEffect(() => {
    const handleResize = () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // temperature가 null이 아닐 때만 상태 텍스트 및 색상 계산
  let statusText = "정상";
  let statusTextColor = "text-green-600"; // Tailwind CSS 클래스
  let statusDotColor = "bg-green-500";
  let iconBgColor = "bg-green-100";
  let iconTextColor = "text-green-500";


  // 👇 typeof로 number 타입인지 명확히 확인!
  if (typeof temperature === 'number') {
    if (temperature > 38.5) {
      statusText = "고온 위험";
      statusTextColor = "text-red-600";
      statusDotColor = "bg-red-500";
      iconBgColor = "bg-red-100";
      iconTextColor = "text-red-500";
    } else if (temperature > 37.5) {
      statusText = "주의 필요 (미열)";
      statusTextColor = "text-yellow-500";
      statusDotColor = "bg-yellow-500";
      iconBgColor = "bg-yellow-100"; // 예시 (원래 코드에는 orange 계열이었음)
      iconTextColor = "text-yellow-500";
    }
    // 원래 코드의 주황색 계열을 유지하고 싶다면 아래처럼 할 수도 있어.
    // if (temperature > 37.5) { // 미열 기준
    //   iconBgColor = "bg-orange-100";
    //   iconTextColor = "text-orange-500";
    // }
  } else {
    // statusText = "데이터 없음"; // temperature가 null일 때 표시할 텍스트
    // statusTextColor = "text-gray-400";
    // statusDotColor = "bg-gray-400";
    // iconBgColor = "bg-gray-100";
    // iconTextColor = "text-gray-400";
  }
  // 원래 코드에서는 아이콘 배경/텍스트 색이 bg-orange-100 text-orange-500 로 고정되어 있었는데,
  // 이것도 상태에 따라 동적으로 바뀌도록 수정했어. 만약 항상 주황색으로 하고 싶으면 이 부분을 고정하면 돼.

  return (
    <div className="sensor-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {/* 👇 아이콘 배경색과 텍스트 색도 상태에 따라 동적으로 변경되도록 수정 */}
            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${iconBgColor} ${iconTextColor} mr-3`}>
              <i className="ri-temp-hot-line"></i>
            </div>
            <h3 className="font-medium text-gray-800">체온</h3>
          </div>
          <div className="flex items-center">
            {typeof temperature === 'number' ? temperature.toFixed(1) : '--'}
            {/* null이면 "--", 아니면 소수점 한 자리까지 */}
            <span className="text-2xl font-bold text-gray-800 mr-2">
            </span>
            {/* 👈 값이 있을 때만 단위 표시 */}
            {typeof temperature === 'number' && <span className="text-sm text-gray-500">°C</span>}
          </div>
        </div>
      </div>
      <div className="p-4">
        {(history && history.length > 0) ? (
          <div ref={chartRef} className="w-full h-48"></div>
        ) : (
          <div className="w-full h-48 flex items-center justify-center text-sm text-gray-400">
            체온 기록이 없습니다.
          </div>
        )}
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
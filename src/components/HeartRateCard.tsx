// src/components/HeartRateCard.tsx
import React, { useEffect, useRef } from 'react'; // React와 훅들 import
import * as echarts from 'echarts/core'; // ECharts 핵심 라이브러리
import { LineChart, LineSeriesOption } from 'echarts/charts'; // 라인 차트 사용
import {
  GridComponent,
  GridComponentOption,
  TooltipComponent,
  TooltipComponentOption,
  MarkLineComponent, // 예시로 MarkLine 추가해볼 수 있음
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers'; // Canvas 렌더러 사용

// ECharts에 필요한 컴포넌트와 차트 등록
echarts.use([
  GridComponent,
  TooltipComponent,
  LineChart,
  CanvasRenderer,
  MarkLineComponent, // 예시
]);

// ECharts 옵션 타입을 위한 결합 타입 (필요한 컴포넌트 옵션들을 결합)
type ECOption = echarts.ComposeOption<
  | LineSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  // | MarkLineComponentOption // MarkLine 사용 시
>;

// HeartRateCard 컴포넌트가 받을 props들의 타입을 정의
interface HeartRateCardProps {
  heartRate: number | null; // 현재 심박수 (null일 수 있음)
  history: number[] | null; // 심박수 기록 배열 (null일 수 있음)
}

const HeartRateCard = ({ heartRate, history }: HeartRateCardProps) => {
  const chartRef = useRef<HTMLDivElement>(null); // 차트 DOM 요소를 위한 ref, 타입 명시
  const chartInstanceRef = useRef<echarts.ECharts | null>(null); // 차트 인스턴스를 위한 ref, 타입 명시

  useEffect(() => {
    if (chartRef.current) {
      // 차트 인스턴스가 없으면 초기화, 있으면 기존 인스턴스 사용
      if (!chartInstanceRef.current) {
        chartInstanceRef.current = echarts.init(chartRef.current);
      }

      const option: ECOption = {
        animation: false,
        grid: { top: 20, right: 20, bottom: 30, left: 45 }, // 여백 조정
        xAxis: {
          type: 'category',
          data: history?.map((_, index) => index.toString()) || ['Now'], // history 길이에 맞추거나 기본값
          // data: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', 'Now'], // 기존 고정 레이블
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280', fontSize: 10 },
          boundaryGap: false, // 라인이 y축에 붙도록
        },
        yAxis: {
          type: 'value',
          min: 40, // 심박수 범위에 맞게 조정
          max: 140,
          interval: 20,
          axisLine: { show: false },
          axisLabel: { color: '#6b7280', fontSize: 10, formatter: '{value} bpm' },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          textStyle: { color: '#1f2937', fontSize: 12 },
          padding: [8, 12],
          // params 타입을 any 대신 ECharts에서 제공하는 타입으로 지정하면 더 좋음
          formatter: (params: any) => {
            if (params && params.length > 0) {
              // x축 데이터(시간 등)를 params[0].axisValue 또는 params[0].name 등으로 가져올 수 있음
              // 여기서는 간단히 현재 값만 표시하는 예시
              const currentData = params[0].data;
              return `심박수: <strong>${currentData}</strong> BPM`;
            }
            return '';
          },
        },
        series: [{
          data: history || [], // history가 null이면 빈 배열 사용
          type: 'line',
          smooth: true,
          symbol: 'circle', // 데이터 포인트 심볼
          symbolSize: 2,   // 심볼 크기
          lineStyle: { width: 2.5, color: '#4f46e5' }, // primary 색상 사용 (tailwind.config.js 참고)
          areaStyle: { // 영역 색상도 primary 계열로
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(79, 70, 229, 0.3)' }, // primary 색상에 투명도
              { offset: 1, color: 'rgba(79, 70, 229, 0.05)' },
            ]),
          },
          itemStyle: { // 데이터 포인트 스타일
            color: '#4f46e5',
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
  }, []); // 이 useEffect는 마운트/언마운트 시 한 번만 실행

  // heartRate가 null이 아닐 때만 상태 텍스트 및 색상 계산
  let statusText = "정상";
  let statusColor = "text-green-500"; // Tailwind CSS 클래스
  let statusDotColor = "bg-green-500";

  if (heartRate !== null) { // 👈 heartRate가 null이 아닌지 확인!
    if (heartRate > 100) {
      statusText = "높음";
      statusColor = "text-red-500";
      statusDotColor = "bg-red-500";
    } else if (heartRate > 85) {
      statusText = "주의 필요";
      statusColor = "text-yellow-500";
      statusDotColor = "bg-yellow-500";
    }
  } else {
    statusText = "데이터 없음"; // heartRate가 null일 때 표시할 텍스트
    statusColor = "text-gray-400";
    statusDotColor = "bg-gray-400";
  }

  return (
    <div className="sensor-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${heartRate !== null ? (heartRate > 100 ? 'bg-red-100 text-red-500' : heartRate > 85 ? 'bg-yellow-100 text-yellow-500' : 'bg-green-100 text-green-500') : 'bg-gray-100 text-gray-400'} mr-3`}>
              <i className="ri-heart-pulse-line"></i>
            </div>
            <h3 className="font-medium text-gray-800">심박수</h3>
          </div>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-800 mr-2">
              {heartRate !== null ? heartRate : '--'} {/* 👈 heartRate가 null이면 "--" 표시 */}
            </span>
            {heartRate !== null && <span className="text-sm text-gray-500">BPM</span>} {/* 👈 값이 있을 때만 단위 표시 */}
          </div>
        </div>
      </div>
      <div className="p-4">
        {/* 차트가 그려질 DOM 요소, history가 없거나 비어있으면 안내 메시지 표시 (선택 사항) */}
        {(history && history.length > 0) ? (
          <div ref={chartRef} className="w-full h-48"></div>
        ) : (
          <div className="w-full h-48 flex items-center justify-center text-sm text-gray-400">
            심박수 기록이 없습니다.
          </div>
        )}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <div>정상 범위: 60-100 BPM</div>
          <div className={`flex items-center ${statusColor}`}>
            <span className={`inline-block w-2 h-2 rounded-full ${statusDotColor} mr-1`}></span>
            <span>{statusText}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeartRateCard;
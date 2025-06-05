// src/components/HeartRateCard.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts'; // LineSeriesOption은 ECOption에 포함되므로 직접 import 안 해도 될 수 있음
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent, // 필요하다면 유지
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ECOption } from '@/types/echarts'; //

echarts.use([
  GridComponent,
  TooltipComponent,
  LineChart,
  CanvasRenderer,
  MarkLineComponent, // 필요하다면 유지
]);

interface HeartRateCardProps {
  currentValue: number | null;    // 실시간 현재 심박수 (page.tsx에서 내려줌)
  historyData: number[] | null; // 초기 차트용 전체 또는 부분 이력 (page.tsx에서 내려줌)
}

const MAX_DISPLAY_POINTS = 20; // 차트에 표시할 최대 데이터 포인트 수

const HeartRateCard = ({ currentValue, historyData }: HeartRateCardProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // 차트에 실제로 표시될 데이터 (최대 MAX_DISPLAY_POINTS 개), 시간 순서대로 (오래된 데이터 -> 최신 데이터)
  const [displayHistory, setDisplayHistory] = useState<number[]>([]);
  // displayHistory에 맞춰 생성될 x축 레이블 (단순히 1부터 시작하는 순번)
  const [xAxisData, setXAxisData] = useState<string[]>([]);

  // 1. 초기 historyData를 받아서 displayHistory 설정 (환자 변경 시 또는 최초 로드 시)
  useEffect(() => {
    // console.log("HeartRateCard: Initial historyData prop received.", historyData);
    if (historyData && historyData.length > 0) {
      // historyData는 최신 데이터가 0번 인덱스에 있음 (timeSeriesMockData.js에서 reverse됨)
      // 차트에는 오래된 데이터부터 보여주기 위해, historyData의 앞부분(최신 데이터들)을 가져와서 다시 reverse.
      const initialSlice = historyData.slice(0, MAX_DISPLAY_POINTS).reverse();
      setDisplayHistory(initialSlice);
      // console.log("HeartRateCard: Initial displayHistory set:", initialSlice);
    } else {
      // historyData가 없으면, currentValue만으로 시작할 수 있도록 빈 배열로 초기화.
      // 또는, currentValue가 있으면 그것부터 시작하도록 할 수도 있음.
      // 여기서는 currentValue useEffect에서 처리하도록 비워둠.
      setDisplayHistory([]);
      // console.log("HeartRateCard: Initial historyData is empty or null.");
    }
  }, [historyData]); // 환자 변경 등으로 historyData가 바뀔 때 실행

  // 2. currentValue (실시간 값) 변경 시 displayHistory 업데이트 (슬라이딩 윈도우)
  useEffect(() => {
    if (typeof currentValue === 'number') {
      // console.log("HeartRateCard: New currentValue received:", currentValue);
      setDisplayHistory(prevDisplayHistory => {
        const newHistory = [...prevDisplayHistory, currentValue];
        // MAX_DISPLAY_POINTS를 초과하면 가장 오래된 데이터(배열의 첫 번째 요소) 제거
        if (newHistory.length > MAX_DISPLAY_POINTS) {
          return newHistory.slice(newHistory.length - MAX_DISPLAY_POINTS);
        }
        return newHistory;
      });
    }
    // historyData가 없고 currentValue만 있는 초기 상태 처리:
    // 위 historyData useEffect에서 displayHistory가 []로 초기화된 후,
    // 이 useEffect가 실행되면서 currentValue가 있다면 displayHistory에 추가됨.
  }, [currentValue]);

  // 3. displayHistory가 변경되면 xAxisData 업데이트 (단순 순번 레이블)
  useEffect(() => {
    // console.log("HeartRateCard: displayHistory changed, updating xAxisData. Length:", displayHistory.length);
    setXAxisData(
      Array.from({ length: displayHistory.length }, (_, i) => `${i + 1}`)
    );
  }, [displayHistory]);

  // 4. ECharts 업데이트 (displayHistory 또는 xAxisData 변경 시)
  useEffect(() => {
    if (chartRef.current) {
      if (!chartInstanceRef.current || chartInstanceRef.current.isDisposed()) {
        // console.log("HeartRateCard: Initializing new ECharts instance.");
        chartInstanceRef.current = echarts.init(chartRef.current);
      }

      // 데이터가 없으면 차트를 클리어
      if (displayHistory.length === 0) {
        // console.log("HeartRateCard: No data to display, clearing chart.");
        chartInstanceRef.current.clear();
        return;
      }
      
      const option: ECOption = {
        animation: false, // 실시간 업데이트 시에는 false가 더 적합할 수 있음
        animationDurationUpdate: 300, // animation:false 이면 큰 의미 없을 수 있음
        grid: { top: 20, right: 20, bottom: 30, left: 45 },
        xAxis: {
          type: 'category',
          data: xAxisData, // 동적으로 생성된 x축 데이터
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280', fontSize: 10, interval: Math.floor(0) || 0 }, // 레이블 간격 조절
          boundaryGap: false, // 데이터가 x축 경계에서 시작하도록
        },
        yAxis: {
          type: 'value',
          min: 40, // 심박수 범위에 맞게 조절
          max: 140,
          interval: 20,
          axisLabel: { formatter: '{value}' },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            if (params && params.length > 0 && params[0].data !== undefined) {
              return `심박수: <strong>${params[0].data}</strong> BPM`;
            }
            return '';
          },
        },
        series: [{
          data: displayHistory, // 동적으로 업데이트되는 y축 데이터
          type: 'line',
          smooth: true,
          symbol: 'none', // 데이터 포인트에 심볼 표시 안 함 (실시간처럼 보이게)
          // symbolSize: 2,
          lineStyle: { width: 2.5, color: '#4f46e5' }, // Tailwind primary 색상
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(79, 70, 229, 0.3)' },
              { offset: 1, color: 'rgba(79, 70, 229, 0.05)' },
            ]),
          },
          // itemStyle: { color: '#4f46e5' }, // symbol: 'none'이면 크게 의미 없음
          // emphasis: { focus: 'series', lineStyle: { width: 3.5 } } // symbol: 'none'이면 크게 의미 없음
        }],
      };
      // console.log("HeartRateCard: Setting ECharts option with displayHistory:", displayHistory, "and xAxisData:", xAxisData);
      chartInstanceRef.current.setOption(option, { replaceMerge: ['series', 'xAxis'] });
    }

    // 컴포넌트 언마운트 시 차트 인스턴스 정리
    return () => {
      if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
        // console.log("HeartRateCard: Disposing ECharts instance.");
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, [displayHistory, xAxisData]); // displayHistory나 xAxisData가 바뀔 때마다 차트 다시 그리기

  // 현재 심박수 상태 표시 로직 (currentValue 사용)
  let statusText = "정상";
  let statusColor = "text-green-500";
  let statusDotColor = "bg-green-500";
  let iconBgColor = 'bg-green-100';
  let iconTextColor = 'text-green-500';

  if (typeof currentValue === 'number') {
    if (currentValue > 100) {
      statusText = "높음"; statusColor = "text-red-500"; statusDotColor = "bg-red-500";
      iconBgColor = 'bg-red-100'; iconTextColor = 'text-red-500';
    } else if (currentValue > 85) { // 60~85는 정상 범위로 간주 (일반적인 성인 안정 시)
      statusText = "주의 필요"; statusColor = "text-yellow-500"; statusDotColor = "bg-yellow-500";
      iconBgColor = 'bg-yellow-100'; iconTextColor = 'text-yellow-500';
    } else if (currentValue < 60 && currentValue >= 40) { // 60 미만도 주의 (상황에 따라 다름)
      statusText = "낮음"; statusColor = "text-blue-500"; statusDotColor = "bg-blue-500";
      iconBgColor = 'bg-blue-100'; iconTextColor = 'text-blue-500';
    } else if (currentValue < 40) {
      statusText = "매우 낮음"; statusColor = "text-red-500"; statusDotColor = "bg-red-500";
      iconBgColor = 'bg-red-100'; iconTextColor = 'text-red-500';
    }
  } else {
    statusText = "데이터 없음"; statusColor = "text-gray-400"; statusDotColor = "bg-gray-400";
    iconBgColor = 'bg-gray-100'; iconTextColor = 'text-gray-400';
  }

  return (
    <div className="sensor-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${iconBgColor} ${iconTextColor} mr-3`}>
              <i className="ri-heart-pulse-line"></i>
            </div>
            <h3 className="font-medium text-gray-800">심박수</h3>
          </div>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-800 mr-2">
              {currentValue !== null ? currentValue : '--'}
            </span>
            {currentValue !== null && <span className="text-sm text-gray-500">BPM</span>}
          </div>
        </div>
      </div>
      <div className="p-4">
        {(displayHistory && displayHistory.length > 0) ? (
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
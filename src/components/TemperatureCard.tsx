// src/components/TemperatureCard.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ECOption } from '@/types/echarts';

echarts.use([
  GridComponent,
  TooltipComponent,
  LineChart,
  CanvasRenderer,
  MarkLineComponent,
]);

interface TemperatureCardProps {
  currentValue: number | null;
  historyData: number[] | null;
  lastUpdated: string | null; // ✨ lastUpdated prop 타입 추가!
}

const MAX_DISPLAY_POINTS = 20;

const TemperatureCard = ({ currentValue, historyData, lastUpdated }: TemperatureCardProps) => { // ✨ prop 받기
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  const [displayHistory, setDisplayHistory] = useState<number[]>([]);
  const [xAxisData, setXAxisData] = useState<string[]>([]);

  // 1. 초기 historyData를 받아서 displayHistory 설정
  useEffect(() => {
    if (historyData && historyData.length > 0) {
      const initialSlice = historyData.slice(0, MAX_DISPLAY_POINTS).reverse();
      setDisplayHistory(initialSlice);
    } else {
      setDisplayHistory([]);
    }
  }, [historyData]);

  // ✨ 2. 실시간 값 업데이트 (슬라이딩 윈도우)
  useEffect(() => {
    if (typeof currentValue === 'number') {
      setDisplayHistory(prevDisplayHistory => {
        const newHistory = [...prevDisplayHistory, currentValue];
        if (newHistory.length > MAX_DISPLAY_POINTS) {
          return newHistory.slice(newHistory.length - MAX_DISPLAY_POINTS);
        }
        return newHistory;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUpdated]); // ✨ 의존성 배열을 [lastUpdated]로 변경!

  // 3. displayHistory가 변경되면 xAxisData 업데이트
  useEffect(() => {
    setXAxisData(
      Array.from({ length: displayHistory.length }, (_, i) => `${i + 1}`)
    );
  }, [displayHistory]);

  // 4. ECharts 업데이트
  useEffect(() => {
    if (chartRef.current) {
      if (!chartInstanceRef.current || chartInstanceRef.current.isDisposed()) {
        chartInstanceRef.current = echarts.init(chartRef.current);
      }
      
      if (displayHistory.length === 0) {
        chartInstanceRef.current.clear();
        return;
      }

      const option: ECOption = {
        animation: false,
        animationDurationUpdate: 300,
        grid: { top: 20, right: 20, bottom: 30, left: 45 },
        xAxis: {
          type: 'category',
          data: xAxisData,
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280', fontSize: 10, interval: Math.floor(0) || 0 },
          boundaryGap: false,
        },
        yAxis: {
          type: 'value',
          min: 34,
          max: 40,
          interval: 1,
          axisLabel: { formatter: '{value} °C' },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            if (params && params.length > 0 && params[0].data !== undefined) {
              return `체온: <strong>${params[0].data.toFixed(1)}</strong> °C`;
            }
            return '';
          },
        },
        series: [{
          data: displayHistory,
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2.5, color: 'rgba(214, 97, 157, 0.8)' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(252, 141, 98, 0.3)' },
              { offset: 1, color: 'rgba(252, 141, 98, 0.05)' },
            ]),
          },
        }],
      };
      chartInstanceRef.current.setOption(option, { replaceMerge: ['series', 'xAxis'] });
    }

    return () => {
      if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, [displayHistory, xAxisData]);

  // 현재 체온 상태 표시 로직
  let statusText = "정상";
  let statusTextColor = "text-green-600";
  let statusDotColor = "bg-green-500";
  let iconBgColor = "bg-green-100";
  let iconTextColor = "text-green-500";

  if (typeof currentValue === 'number') {
    if (currentValue >= 38.0) {
      statusText = "고온 위험"; statusTextColor = "text-red-600"; statusDotColor = "bg-red-500";
      iconBgColor = "bg-red-100"; iconTextColor = "text-red-500";
    } else if (currentValue >= 37.5) {
      statusText = "주의 필요"; statusTextColor = "text-yellow-500"; statusDotColor = "bg-yellow-500";
      iconBgColor = "bg-yellow-100"; iconTextColor = "text-yellow-500";
    } else if (currentValue < 37.5 && currentValue >= 36.0) {
      statusText = "정상"; statusTextColor = "text-green-500"; statusDotColor = "bg-green-500";
      iconBgColor = "bg-green-100"; iconTextColor = "text-green-500";
    } else if (currentValue < 36.0 && currentValue > 35.7) {
      statusText = "주의 필요"; statusTextColor = "text-blue-500"; statusDotColor = "bg-blue-500";
      iconBgColor = "bg-blue-100"; iconTextColor = "text-blue-500";
    } else if (currentValue <= 35.7) {
      statusText = "저체온 위험"; statusTextColor = "text-red-500"; statusDotColor = "bg-red-500";
      iconBgColor = "bg-red-100"; iconTextColor = "text-red-500";
    }
  } else {
    statusText = "데이터 없음"; statusTextColor = "text-gray-400"; statusDotColor = "bg-gray-400";
    iconBgColor = "bg-gray-100"; iconTextColor = "text-gray-400";
  }

  return (
    <div className="sensor-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${iconBgColor} ${iconTextColor} mr-3`}>
              <i className="ri-temp-hot-line"></i>
            </div>
            <h3 className="font-medium text-gray-800">체온</h3>
          </div>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-800 mr-2">
              {typeof currentValue === 'number' ? currentValue.toFixed(1) : '--'}
            </span>
            {typeof currentValue === 'number' && <span className="text-sm text-gray-500">°C</span>}
          </div>
        </div>
      </div>
      <div className="p-4">
        {(displayHistory && displayHistory.length > 0) ? (
          <div ref={chartRef} className="w-full h-48"></div>
        ) : (
          <div className="w-full h-48 flex items-center justify-center text-sm text-gray-400">
            체온 기록이 없습니다.
          </div>
        )}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <div>정상 범위: 36.0 ~ 37.4 °C</div>
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
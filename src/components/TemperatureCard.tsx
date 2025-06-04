// src/components/TemperatureCard.tsx
import React, { useEffect, useRef, useState } from 'react'; // 🟡 useState 추가!
import * as echarts from 'echarts/core';
import { LineChart, LineSeriesOption } from 'echarts/charts';
import {
  GridComponent,
  GridComponentOption,
  TooltipComponent,
  TooltipComponentOption,
  // MarkLineComponent, // 체온 카드에서는 MarkLine을 사용하지 않는다면 제거해도 됨
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ECOption } from '@/types/echarts'; // 우리가 만든 ECOption 타입!

echarts.use([
  GridComponent,
  TooltipComponent,
  LineChart,
  CanvasRenderer,
  // MarkLineComponent, // 사용하지 않으면 여기서도 제거
]);

interface TemperatureCardProps {
  temperature: number | null; // 🟡 실시간으로 업데이트될 "현재" 체온
  history: number[] | null;   // 🟡 초기 차트 또는 전체 이력 데이터
}

const MAX_DISPLAY_POINTS = 20; // 🟡 차트에 표시할 최대 데이터 포인트 수 (HeartRateCard와 동일하게)

const TemperatureCard = ({ temperature, history }: TemperatureCardProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  const [displayHistory, setDisplayHistory] = useState<number[]>([]);
  const [xAxisData, setXAxisData] = useState<string[]>([]);

  // 1. 초기 데이터 설정 및 환자 변경 시 history prop으로 displayHistory 와 xAxisData 초기화
  useEffect(() => {
    console.log("TemperatureCard: Initial history prop changed or component mounted.", history);
    if (history && history.length > 0) {
      const initialSlice = history.slice(-MAX_DISPLAY_POINTS);
      setDisplayHistory(initialSlice);
      setXAxisData(Array.from({ length: initialSlice.length }, (_, i) => `P${i + 1}`));
    } else {
      setDisplayHistory([]);
      setXAxisData([]);
    }
  }, [history]);

  // 2. 새로운 temperature prop 값이 들어올 때마다 displayHistory 업데이트 (슬라이딩 윈도우)
  useEffect(() => {
    if (typeof temperature === 'number') {
      console.log("TemperatureCard: New temperature prop received:", temperature);
      setDisplayHistory(prevDisplayHistory => {
        const newHistory = [...prevDisplayHistory, temperature];
        return newHistory.length > MAX_DISPLAY_POINTS
          ? newHistory.slice(newHistory.length - MAX_DISPLAY_POINTS)
          : newHistory;
      });
    }
  }, [temperature]);

  // 3. displayHistory가 변경되면 xAxisData를 업데이트하는 별도의 useEffect
  useEffect(() => {
    console.log("TemperatureCard: displayHistory changed, updating xAxisData.", displayHistory);
    setXAxisData(
      Array.from({ length: displayHistory.length }, (_, i) => `P${i + 1}`)
    );
  }, [displayHistory]);

  // 4. ECharts 업데이트 (displayHistory 또는 xAxisData가 바뀔 때마다)
  useEffect(() => {
    if (chartRef.current && (displayHistory.length > 0 || xAxisData.length > 0)) {
      if (!chartInstanceRef.current || chartInstanceRef.current.isDisposed()) {
        console.log("TemperatureCard: Initializing new ECharts instance.");
        chartInstanceRef.current = echarts.init(chartRef.current);
      } else {
        console.log("TemperatureCard: Using existing ECharts instance.");
      }

      const option: ECOption = {
        animation: false, // 🟡 네가 선호하는 설정으로!
        animationDurationUpdate: 300, // animation:false면 이 값은 크게 의미 없을 수 있어
        grid: { top: 20, right: 20, bottom: 30, left: 45 },
        xAxis: {
          type: 'category',
          data: xAxisData,
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280', fontSize: 10, interval: 'auto' },
          boundaryGap: false,
        },
        yAxis: {
          type: 'value',
          min: 35, // 체온에 맞는 범위
          max: 41,
          interval: 1,
          axisLabel: { formatter: '{value} °C' }, // 단위 °C
          splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            if (params && params.length > 0 && params[0].data !== undefined) {
              return `체온: <strong>${params[0].data.toFixed(1)}</strong> °C`; // 🟡 소수점 한자리까지
            }
            return '';
          },
        },
        series: [{
          data: displayHistory,
          type: 'line', smooth: true, symbol: 'circle', symbolSize: 2,
          lineStyle: { width: 2.5, color: 'rgba(252, 141, 98, 1)' }, // 🟠 주황색 계열
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(252, 141, 98, 0.3)' },
              { offset: 1, color: 'rgba(252, 141, 98, 0.05)' },
            ]),
          },
          itemStyle: { color: 'rgba(252, 141, 98, 1)' },
          emphasis: { focus: 'series', lineStyle: { width: 3.5 }, itemStyle: { borderWidth: 2, borderColor: '#ffffff', shadowBlur: 5, shadowColor: 'rgba(0, 0, 0, 0.3)'}}
        }],
      };
      console.log("TemperatureCard: Setting ECharts option with displayHistory:", displayHistory, "and xAxisData:", xAxisData);
      chartInstanceRef.current.setOption(option, { replaceMerge: ['series', 'xAxis'] });
    } else if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
      console.log("TemperatureCard: No data to display, clearing chart.");
      chartInstanceRef.current.clear();
    }

    return () => {
      if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
        console.log("TemperatureCard: Disposing ECharts instance.");
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, [displayHistory, xAxisData]);

  // 현재 체온 상태 표시 로직 (이전 코드와 유사하게, 필요시 HeartRateCard처럼 iconBgColor, iconTextColor 추가)
  let statusText = "정상";
  let statusTextColor = "text-green-600";
  let statusDotColor = "bg-green-500";
  let iconBgColor = "bg-green-100";
  let iconTextColor = "text-green-500";

  if (typeof temperature === 'number') {
    if (temperature > 38.5) {
      statusText = "고온 위험"; statusTextColor = "text-red-600"; statusDotColor = "bg-red-500";
      iconBgColor = "bg-red-100"; iconTextColor = "text-red-500";
    } else if (temperature > 37.5) {
      statusText = "주의 필요 (미열)"; statusTextColor = "text-yellow-500"; statusDotColor = "bg-yellow-500";
      // 이전 코드에서는 orange 계열이었는데, 일관성을 위해 yellow로 하거나, orange로 맞춰도 좋아!
      iconBgColor = "bg-yellow-100"; iconTextColor = "text-yellow-500";
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
              {typeof temperature === 'number' ? temperature.toFixed(1) : '--'}
            </span>
            {typeof temperature === 'number' && <span className="text-sm text-gray-500">°C</span>}
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
// src/components/TemperatureCard.tsx
import React, { useEffect, useRef, useState } from 'react'; // 🟡 useState 있는지 확인!
import * as echarts from 'echarts/core';
import { LineChart, LineSeriesOption } from 'echarts/charts';
import {
  GridComponent,
  GridComponentOption,
  TooltipComponent,
  TooltipComponentOption,
  MarkLineComponent, // 체온 카드에서는 MarkLine을 사용하지 않는다면 제거해도 됨
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ECOption } from '@/types/echarts'; //

echarts.use([
  GridComponent,
  TooltipComponent,
  LineChart,
  CanvasRenderer,
  MarkLineComponent, // 사용하지 않으면 여기서도 제거
]);

interface TemperatureCardProps {                         // 👈 여기부터 수정 시작
  currentValue: number | null; // 🟡 실시간으로 업데이트될 "현재" 체온 (이 prop 이름을 currentValue로 변경)
  historyData: number[] | null;   // 🟡 초기 차트 또는 전체 이력 데이터 (이 prop 이름을 historyData로 변경)
}                                                       // 👈 여기까지 Props 정의 수정

const MAX_DISPLAY_POINTS = 20; // 차트에 표시할 최대 데이터 포인트 수 (HeartRateCard와 동일하게)

const TemperatureCard = ({ currentValue, historyData }: TemperatureCardProps) => {

  const chartRef = useRef<HTMLDivElement>(null); //
  const chartInstanceRef = useRef<echarts.ECharts | null>(null); //

  const [displayHistory, setDisplayHistory] = useState<number[]>([]); // 👈 이 상태 변수들은 HeartRateCard와 동일하게 사용
  const [xAxisData, setXAxisData] = useState<string[]>([]);         // 👈 이 상태 변수들은 HeartRateCard와 동일하게 사용

  // 🟡 1. 초기 데이터 설정 및 환자 변경 시 historyData prop으로 displayHistory 와 xAxisData 초기화
  useEffect(() => {                                              // 👈 이 useEffect는 HeartRateCard의 로직과 유사하게 수정
    console.log("TemperatureCard: Initial historyData prop changed or component mounted.", historyData);
    if (historyData && historyData.length > 0) {
      const initialSlice = historyData.slice(-MAX_DISPLAY_POINTS);
      setDisplayHistory(initialSlice);
      setXAxisData(Array.from({ length: initialSlice.length }, (_, i) => `${i + 1}`));
    } else {
      setDisplayHistory([]);
      setXAxisData([]);
    }
  }, [historyData]); // 👈 의존성 배열도 historyData로 변경

  // 🟡 2. 새로운 currentValue prop 값이 들어올 때마다 displayHistory 업데이트 (슬라이딩 윈도우)
  useEffect(() => {                                              // 👈 이 useEffect는 HeartRateCard의 로직과 유사하게 수정
    if (typeof currentValue === 'number') { // 👈 temperature를 currentValue로 변경
      console.log("TemperatureCard: New currentValue prop received:", currentValue);
      setDisplayHistory(prevDisplayHistory => {
        const newHistory = [...prevDisplayHistory, currentValue]; // 👈 temperature를 currentValue로 변경
        return newHistory.length > MAX_DISPLAY_POINTS
          ? newHistory.slice(newHistory.length - MAX_DISPLAY_POINTS)
          : newHistory;
      });
    }
  }, [currentValue]); // 👈 의존성 배열도 currentValue로 변경

  // 🟡 3. displayHistory가 변경되면 xAxisData를 업데이트하는 별도의 useEffect
  useEffect(() => {                                              // 👈 이 useEffect는 HeartRateCard와 동일한 로직 사용
    console.log("TemperatureCard: displayHistory changed, updating xAxisData.", displayHistory);
    setXAxisData(
      Array.from({ length: displayHistory.length }, (_, i) => `${i + 1}`)
    );
  }, [displayHistory]);

  // 🟡 4. ECharts 업데이트 (displayHistory 또는 xAxisData가 바뀔 때마다)
  useEffect(() => {                                              // 👈 이 useEffect는 HeartRateCard의 로직과 유사하게 수정
    if (chartRef.current && (displayHistory.length > 0 || xAxisData.length > 0)) {
      if (!chartInstanceRef.current || chartInstanceRef.current.isDisposed()) {
        console.log("TemperatureCard: Initializing new ECharts instance.");
        chartInstanceRef.current = echarts.init(chartRef.current);
      } else {
        console.log("TemperatureCard: Using existing ECharts instance.");
      }

      const option: ECOption = {                                // 👈 여기 ECharts 옵션 내용 수정
        animation: false,
        animationDurationUpdate: 300,
        grid: { top: 20, right: 20, bottom: 30, left: 45 },
        xAxis: {
          type: 'category',
          data: xAxisData, // 👈 xAxisData 사용
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280', fontSize: 10, interval: 'auto' },
          boundaryGap: false,
        },
        yAxis: {                                                // 👈 yAxis 설정 체온에 맞게 변경
          type: 'value',
          min: 34, // 체온에 맞는 범위
          max: 40,
          interval: 1,
          axisLabel: { formatter: '{value} °C' }, // 단위 °C
          splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        tooltip: {                                              // 👈 tooltip formatter 체온에 맞게 변경
          trigger: 'axis',
          formatter: (params: any) => {
            if (params && params.length > 0 && params[0].data !== undefined) {
              return `체온: <strong>${params[0].data.toFixed(1)}</strong> °C`; // 소수점 한자리까지
            }
            return '';
          },
        },
        series: [{                                             // 👈 series 설정 체온에 맞게 변경 (색상 등)
          data: displayHistory, // 👈 displayHistory 사용
          type: 'line', smooth: true, symbol: 'none', // symbol: 'circle', symbolSize: 2,
          lineStyle: { width: 2.5, color: 'rgba(214, 97, 157, 0.8)' }, // 🟠 주황색 계열
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(252, 141, 98, 0.3)' },
              { offset: 1, color: 'rgba(252, 141, 98, 0.05)' },
            ]),
          },
          // itemStyle: { color: 'rgba(252, 141, 98, 1)' }, // symbol: 'none'이면 필요 없을 수 있음
        }],
      };
      console.log("TemperatureCard: Setting ECharts option with displayHistory:", displayHistory, "and xAxisData:", xAxisData);
      chartInstanceRef.current.setOption(option, { replaceMerge: ['series', 'xAxis'] });
    } else if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
      console.log("TemperatureCard: No data to display, clearing chart.");
      chartInstanceRef.current.clear();
    }

    return () => {                                            // 👈 이 부분은 HeartRateCard와 동일
      if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
        console.log("TemperatureCard: Disposing ECharts instance.");
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, [displayHistory, xAxisData]); // 👈 의존성 배열 확인

  // 현재 체온 상태 표시 로직
  let statusText = "정상"; //
  let statusTextColor = "text-green-600"; //
  let statusDotColor = "bg-green-500"; //
  let iconBgColor = "bg-green-100"; //
  let iconTextColor = "text-green-500"; //

  if (typeof currentValue === 'number') { 
    if (currentValue >= 38.0) {
      statusText = "고온 위험"; statusTextColor = "text-red-600"; statusDotColor = "bg-red-500";
      iconBgColor = "bg-red-100"; iconTextColor = "text-red-500";
    } else if (currentValue >= 37.5) {
      statusText = "주의 필요 (미열)"; statusTextColor = "text-yellow-500"; statusDotColor = "bg-yellow-500";
      iconBgColor = "bg-yellow-100"; iconTextColor = "text-yellow-500";
    } else if (currentValue < 37.5 && currentValue > 36.0) {
      statusText = "정상"; statusTextColor = "text-green-500"; statusDotColor = "bg-green-500";
      iconBgColor = "bg-green-100"; iconTextColor = "text-green-500";
    } else if (currentValue <= 36.0 && currentValue > 35.7) {
      statusText = "주의 필요"; statusTextColor = "text-blue-500"; statusDotColor = "bg-blue-500";
      iconBgColor = "bg-blue-100"; iconTextColor = "text-blue-500";
    } else if (currentValue <= 35.7) {
      statusText = "저체온 위험"; statusTextColor = "text-red-500"; statusDotColor = "bg-red-500";
      iconBgColor = "bg-red-100"; iconTextColor = "text-red-500";
    } else {
      statusText = "데이터 없음"; statusTextColor = "text-gray-400"; statusDotColor = "bg-gray-400";
      iconBgColor = "bg-gray-100"; iconTextColor = "text-gray-400";
    }
  }

  return ( // 👈 이 JSX 구조는 유지하되, currentValue를 사용하도록 수정
    <div className="sensor-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"> {/* */}
      <div className="p-4 border-b border-gray-100"> {/* */}
        <div className="flex justify-between items-center"> {/* */}
          <div className="flex items-center"> {/* */}
            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${iconBgColor} ${iconTextColor} mr-3`}> {/* */}
              <i className="ri-temp-hot-line"></i> {/* */}
            </div>
            <h3 className="font-medium text-gray-800">체온</h3> {/* */}
          </div>
          <div className="flex items-center"> {/* */}
            <span className="text-2xl font-bold text-gray-800 mr-2"> {/* */}
              {typeof currentValue === 'number' ? currentValue.toFixed(1) : '--'}
            </span>
            {typeof currentValue === 'number' && <span className="text-sm text-gray-500">°C</span>}
          </div>
        </div>
      </div>
      <div className="p-4"> {/* */}
        {(displayHistory && displayHistory.length > 0) ? ( //
          <div ref={chartRef} className="w-full h-48"></div> //
        ) : ( //
          <div className="w-full h-48 flex items-center justify-center text-sm text-gray-400"> {/* */}
            체온 기록이 없습니다. {/* */}
          </div>
        )}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500"> {/* */}
          <div>정상 범위: 36.5-37.5 °C</div> {/* */}
          <div className={`flex items-center ${statusTextColor}`}> {/* */}
            <span className={`inline-block w-2 h-2 rounded-full ${statusDotColor} mr-1`}></span> {/* */}
            <span>{statusText}</span> {/* */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemperatureCard;
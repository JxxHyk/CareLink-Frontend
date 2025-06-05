// src/components/HeartRateCard.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { LineChart, LineSeriesOption } from 'echarts/charts';
import {
  GridComponent,
  GridComponentOption,
  TooltipComponent,
  TooltipComponentOption,
  MarkLineComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ECOption } from '@/types/echarts'; // 이전에 만든 타입 가져오기

echarts.use([
  GridComponent,
  TooltipComponent,
  LineChart,
  CanvasRenderer,
  MarkLineComponent,
]);

interface HeartRateCardProps {
  heartRate: number | null; // 실시간으로 업데이트될 "현재" 심박수
  history: number[] | null; // 초기 차트 또는 전체 이력 데이터
}

const MAX_DISPLAY_POINTS = 20; // 차트에 표시할 최대 데이터 포인트 수

const HeartRateCard = ({ heartRate, history }: HeartRateCardProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  const [displayHistory, setDisplayHistory] = useState<number[]>([]);
  const [xAxisData, setXAxisData] = useState<string[]>([]);

  // 1. 초기 데이터 설정 및 환자 변경 시 history prop으로 displayHistory 와 xAxisData 초기화
  useEffect(() => {
    console.log("HeartRateCard: Initial history prop changed or component mounted.", history);
    if (history && history.length > 0) {
      const initialSlice = history.slice(-MAX_DISPLAY_POINTS);
      setDisplayHistory(initialSlice);
      // X축 레이블을 "P1", "P2", ..., "P<length>" 형식으로 초기화
      setXAxisData(Array.from({ length: initialSlice.length }, (_, i) => `${i + 1}`));
    } else {
      // history가 없거나 비어있으면 빈 배열로 시작
      setDisplayHistory([]);
      setXAxisData([]);
    }
  }, [history]); // history prop (즉, 선택된 환자)이 바뀔 때마다 실행

  // 2. 새로운 heartRate prop 값이 들어올 때마다 displayHistory 업데이트 (슬라이딩 윈도우)
  useEffect(() => {
    // heartRate가 유효한 숫자일 때만 displayHistory 업데이트
    if (typeof heartRate === 'number') {
      console.log("HeartRateCard: New heartRate prop received:", heartRate);
      setDisplayHistory(prevDisplayHistory => {
        const newHistory = [...prevDisplayHistory, heartRate];
        // MAX_DISPLAY_POINTS를 초과하면 가장 오래된 데이터 제거
        return newHistory.length > MAX_DISPLAY_POINTS
          ? newHistory.slice(newHistory.length - MAX_DISPLAY_POINTS)
          : newHistory;
      });
    }
  }, [heartRate]); // heartRate prop(현재값)이 바뀔 때마다 실행

  // 3. displayHistory가 변경되면 xAxisData를 업데이트하는 별도의 useEffect
  useEffect(() => {
    console.log("HeartRateCard: displayHistory changed, updating xAxisData.", displayHistory);
    // displayHistory의 현재 길이에 맞춰서 "P1", "P2", ... 레이블 생성
    setXAxisData(
      Array.from({ length: displayHistory.length }, (_, i) => `${i + 1}`)
    );
  }, [displayHistory]); // displayHistory가 바뀔 때 이 effect 실행

  // 4. ECharts 업데이트 (displayHistory 또는 xAxisData가 바뀔 때마다)
  useEffect(() => {
    if (chartRef.current && (displayHistory.length > 0 || xAxisData.length > 0)) { // 데이터가 있을 때만 차트 그림
      if (!chartInstanceRef.current || chartInstanceRef.current.isDisposed()) { // 🟡 인스턴스가 없거나 dispose된 경우 새로 생성
        console.log("HeartRateCard: Initializing new ECharts instance.");
        chartInstanceRef.current = echarts.init(chartRef.current);
      } else {
        console.log("HeartRateCard: Using existing ECharts instance.");
      }

      const option: ECOption = {
        animation: false,
        animationDurationUpdate: 300,
        grid: { top: 20, right: 20, bottom: 30, left: 45 },
        xAxis: {
          type: 'category',
          data: xAxisData,
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280', fontSize: 10, interval: 'auto' },
          boundaryGap: false,
        },
        yAxis: {
          type: 'value', min: 40, max: 140, interval: 20,
          axisLabel: { formatter: '{value}' },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            if (params && params.length > 0 && params[0].data !== undefined) { // 🟡 params[0].data 유효성 체크
              return `심박수: <strong>${params[0].data}</strong> BPM`;
            }
            return '';
          },
        },
        series: [{
          data: displayHistory,
          type: 'line', smooth: true, symbol: 'circle', symbolSize: 2,
          lineStyle: { width: 2.5, color: '#4f46e5' }, // Tailwind primary 색상
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(79, 70, 229, 0.3)' },
              { offset: 1, color: 'rgba(79, 70, 229, 0.05)' },
            ]),
          },
          itemStyle: { color: '#4f46e5' },
          emphasis: { focus: 'series', lineStyle: { width: 3.5 }, itemStyle: { borderWidth: 2, borderColor: '#ffffff', shadowBlur: 5, shadowColor: 'rgba(0, 0, 0, 0.3)' } }
        }],
      };
      console.log("HeartRateCard: Setting ECharts option with displayHistory:", displayHistory, "and xAxisData:", xAxisData);
      chartInstanceRef.current.setOption(option, { replaceMerge: ['series', 'xAxis'] }); // 🟡 시리즈와 xAxis 데이터만 교체/병합
    } else if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
      // 데이터가 없으면 차트를 클리어하거나 기본 메시지 표시 (선택 사항)
      console.log("HeartRateCard: No data to display, clearing chart.");
      chartInstanceRef.current.clear(); // 또는 setOption으로 빈 차트 표시
    }

    // 컴포넌트 언마운트 시 차트 인스턴스 정리
    return () => {
      if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
        console.log("HeartRateCard: Disposing ECharts instance.");
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, [displayHistory, xAxisData]); // displayHistory나 xAxisData가 바뀔 때마다 차트 다시 그리기!

  // 현재 심박수 상태 표시 로직
  let statusText = "정상";
  let statusColor = "text-green-500";
  let statusDotColor = "bg-green-500";
  let iconBgColor = 'bg-green-100'; // 🟡 아이콘 배경색 변수 추가
  let iconTextColor = 'text-green-500'; // 🟡 아이콘 텍스트색 변수 추가


  if (typeof heartRate === 'number') {
    if (heartRate > 100) {
      statusText = "높음"; statusColor = "text-red-500"; statusDotColor = "bg-red-500";
      iconBgColor = 'bg-red-100'; iconTextColor = 'text-red-500';
    } else if (heartRate > 85) {
      statusText = "주의 필요"; statusColor = "text-yellow-500"; statusDotColor = "bg-yellow-500";
      iconBgColor = 'bg-yellow-100'; iconTextColor = 'text-yellow-500';
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
            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${iconBgColor} ${iconTextColor} mr-3`}> {/* 🟡 동적 클래스 적용 */}
              <i className="ri-heart-pulse-line"></i>
            </div>
            <h3 className="font-medium text-gray-800">심박수</h3>
          </div>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-800 mr-2">
              {heartRate !== null ? heartRate : '--'}
            </span>
            {heartRate !== null && <span className="text-sm text-gray-500">BPM</span>}
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
// src/lib/timeSeriesMockData.js

/**
 * 간단한 시계열 데이터 생성 함수
 * @param {number} base 기본 값
 * @param {number} points 데이터 포인트 수
 * @param {number} fluctuation 변동 폭
 * @param {number} [min] 최소값
 * @param {number} [max] 최대값
 * @param {number} [toFixed=0] 소수점 자릿수
 * @returns {number[]} 생성된 시계열 데이터 배열 (최신 데이터가 배열의 맨 앞에 오도록 reverse됨)
 */
const generateSeries = (base, points, fluctuation, min, max, toFixed = 0) => {
  const data = [];
  let current = base;
  for (let i = 0; i < points; i++) {
    current += (Math.random() - 0.5) * fluctuation;
    if (min !== undefined) current = Math.max(min, current);
    if (max !== undefined) current = Math.min(max, current);
    data.push(toFixed > 0 ? parseFloat(current.toFixed(toFixed)) : Math.round(current));
  }
  // 최신 데이터가 0번 인덱스에 오도록 reverse()
  return data.reverse();
};

// 환자 ID별 시계열 데이터
export const timeSeriesData = {
  236: { // 홍길동 환자의 patient_id
    heartRate: generateSeries(78, 100, 6, 50, 120), // 100개의 심박수 데이터
    temperature: generateSeries(36.8, 100, 0.4, 35.0, 38.0, 1), // 100개의 체온 데이터
  },
  // 다른 환자 ID에 대한 모의 데이터 예시 (필요시 추가)
  // 1: {
  //   heartRate: generateSeries(70, 50, 5, 60, 110),
  //   temperature: generateSeries(36.5, 50, 0.3, 35.5, 38.0, 1),
  // },
};
// src/lib/timeSeriesMockData.js

// 간단한 시계열 데이터 생성 함수 (이전과 유사)
const generateSeries = (base, points, fluctuation, min, max, toFixed = 0) => {
  const data = [];
  let current = base;
  for (let i = 0; i < points; i++) {
    current += (Math.random() - 0.5) * fluctuation;
    if (min !== undefined) current = Math.max(min, current);
    if (max !== undefined) current = Math.min(max, current);
    data.push(toFixed > 0 ? parseFloat(current.toFixed(toFixed)) : Math.round(current));
  }
  return data;
};

// 환자 ID별 시계열 데이터
export const timeSeriesData = {
  "P-78542": { // 김준호 (목업) - patient_id가 문자열일 경우
    heartRate: generateSeries(75, 100, 5, 60, 110), // 100개 데이터 포인트
    temperature: generateSeries(36.8, 100, 0.5, 35.5, 38.5, 1),
  },
  "P-MOCK001": { // 김준호 (목업) - patient_id가 initialPatients에서 온 것과 일치해야 함
    heartRate: generateSeries(75, 100, 5, 60, 110), 
    temperature: generateSeries(36.8, 100, 0.5, 35.5, 38.5, 1),
  },
  // patient_id가 숫자 1일 경우
  1: { 
    heartRate: generateSeries(80, 120, 6, 50, 130),
    temperature: generateSeries(37.0, 120, 0.3, 36.0, 39.0, 1),
  },
  // 다른 목업 환자들의 시계열 데이터도 필요하다면 여기에 추가
  // "P-65431": {
  //   heartRate: generateSeries(90, 100, 8, 70, 140),
  //   temperature: generateSeries(37.5, 100, 0.6, 36.0, 39.5, 1),
  // },
};

// 사용 예시:
// const patient1HeartRateHistory = timeSeriesData["1"]?.heartRate;
// const patientP78542TemperatureHistory = timeSeriesData["P-78542"]?.temperature;
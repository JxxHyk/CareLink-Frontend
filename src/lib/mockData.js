// lib/mockData.js
export const initialPatients = [
  {
    id: 'P-78542',
    name: '김준호',
    age: 72,
    room: '304',
    risk: 'medium',
    heartRate: 92,
    temperature: 38.2,
    fallStatus: 'normal',
    lastUpdated: '2 min ago',
    // 차트용 가상 데이터 (실제로는 API에서 받아오거나 계산)
    heartRateHistory: [72, 75, 68, 73, 80, 85, 90, 88, 92],
    temperatureHistory: [36.8, 37.0, 37.2, 37.5, 37.8, 38.0, 38.1, 38.3, 38.2],
    gyro: { x: 0.12, y: 0.05, z: 0.98 },
    lastMovement: '2분 전',
    movementPattern: '정상',
    gps: {
      lat: '37.7749° N',
      long: '122.4194° W',
      address: 'Memorial Hospital, Building C, Floor 3',
      timestamp: '3분 전 업데이트'
    }
  },
  {
    id: 'P-65431',
    name: '박영자',
    age: 85,
    room: '215',
    risk: 'high',
    heartRate: 115,
    temperature: 39.1,
    fallStatus: 'alert',
    lastUpdated: '1 min ago',
    heartRateHistory: [90, 95, 100, 105, 110, 112, 115, 113, 115],
    temperatureHistory: [37.5, 38.0, 38.5, 38.8, 39.0, 39.1, 39.0, 39.1, 39.1],
    gyro: { x: -0.5, y: 1.2, z: 0.5 },
    lastMovement: '1분 전',
    movementPattern: '불안정',
    gps: {
      lat: '37.7751° N',
      long: '122.4190° W',
      address: 'General Hospital, Wing A, Floor 1',
      timestamp: '1분 전 업데이트'
    }
  },
  // ... (나머지 환자 데이터도 위와 같은 형식으로 추가)
  // 기존 HTML의 patients 배열을 여기에 옮겨주면 돼.
  // 간단하게 하기 위해 모든 환자에게 heartRateHistory, temperatureHistory 등을 추가했다고 가정할게.
  // 실제로는 이 데이터도 환자별로 다를 것이고, API를 통해 받아와야 해.
];
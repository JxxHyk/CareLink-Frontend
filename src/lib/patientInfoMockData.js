// src/lib/patientInfoMockData.js (기존 mockData.js에서 이름 변경 및 간소화 예시)
export const initialPatientProfiles = [ // 변수 이름도 변경
  {
    patient_id: 1, // 기관 ID 1번 사용자가 볼 목업 환자, ID는 숫자라고 가정
    full_name: "김준호",
    age: 72,
    // room: "304",
    risk: "medium",
    heartRate: 78, // 현재 값 (시뮬레이션 시작 값으로 사용 가능)
    temperature: 36.8, // 현재 값
    fallStatus: "normal",
    lastUpdated: "10 min ago",
    // heartRateHistory: [], // 여기서 빼거나 빈 배열로
    // temperatureHistory: [], // 여기서 빼거나 빈 배열로
    gyro: { x: 0.12, y: 0.05, z: 0.98 },
    lastMovement: "10분 전",
    movementPattern: "정상",
    gps: { lat: "37.7749° N", long: "122.4194° W", address: "테스트 병원", timestamp: "10분 전"},
    organization_id: 1,
    patient_code: "Test-001"
  },
  // ... (기관 ID 1번 사용자가 볼 다른 목업 환자들)
];
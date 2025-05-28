// src/types/index.ts (새 파일)

// 사용자 역할 타입을 위한 Enum 또는 Union 타입
export type UserRoleType = "super_admin" | "admin" | "staff" | string; // string은 혹시 모를 다른 값 대비

export interface OrganizationInfo {
  id: number; // 또는 string, 백엔드 응답에 맞춰서
  name: string;
}

export interface User {
  name: string;         // full_name 또는 username
  role: UserRoleType;   // UserRoleType 사용
  organization?: OrganizationInfo | null;
  // id?: string;
  // is_superuser?: boolean; // 필요하다면
}

export interface Patient { // Patient 타입도 여기에 정의하면 좋음
  patient_id: number;
  full_name: string;
  age: number;
  // room: string;
  risk: 'high' | 'medium' | 'low';
  heartRate: number | null;
  temperature: number | null;
  fallStatus: 'normal' | 'alert' | null;
  lastUpdated: string;
  heartRateHistory: number[] | null;
  temperatureHistory: number[] | null;
  gyro: { x: number; y: number; z: number};
  lastMovement: string;
  movementPattern: string;
  gps: { lat: string; long: string; address: string; timestamp: string; };
  organization_id?: number;
  patient_code?: string;
}

// LoginPage에서 MainPageController로 전달할 때 사용했던 UserDataForApp도 여기에 정의 가능
export interface UserDataForApp {
    name: string;
    role: UserRoleType;
    organization?: OrganizationInfo | null;
}
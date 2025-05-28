// src/types/index.ts

// 사용자 역할 타입 (이전과 동일하게 유지 또는 필요시 수정)
export type UserRoleType = "super_admin" | "admin" | "staff" | string;

export interface OrganizationInfo {
  id: number; // API 응답에서 organization.id가 숫자였음
  name: string;
}

export interface User {
  name: string;         // full_name 또는 username
  role: UserRoleType;
  organization?: OrganizationInfo | null;
  // is_superuser?: boolean;
}

// 👇 Patient 인터페이스를 실제 API 응답과 요구사항에 맞춰 수정!
export interface Patient {
  patient_id: number;               // API 응답: patient_id (number)
  full_name: string;                // API 응답: full_name (string)
  organization_id: number;          // API 응답: organization_id (number)
  patient_code: string;             // API 응답: patient_code (string)

  // --- API 응답에 있었던 필드들 (타입 및 Optional 처리) ---
  date_of_birth?: string | null;     // API 응답: "YYYY-MM-DD" (string) 또는 null
  gender?: "male" | "female" | "other" | string | null; // API 응답: "male" (string). 좀 더 유연하게 string도 허용
  address?: string | null;
  contact_number?: string | null;
  emergency_contact?: string | null;
  emergency_number?: string | null;
  medical_notes?: string | null;
  status?: "active" | "inactive" | "discharged" | string | null; // API 응답: "active" (string). PatientStatus Enum 값들
  registration_date?: string | null; // API 응답: null 또는 날짜 문자열

  organization?: OrganizationInfo | null; // API 응답: organization 객체 (id, name 포함)

  created_at: string;  // API 응답: "YYYY-MM-DDTHH:MM:SS" (string)
  updated_at: string;  // API 응답: "YYYY-MM-DDTHH:MM:SS" (string)

  // --- 모니터링에 필요한 센서 값 및 히스토리 (API 응답에 맞춰 Optional 및 null 처리) ---
  // API 응답에서 current_ 접두사가 있었으므로, 인터페이스 필드명도 맞추거나 fetch 함수에서 매핑 필요.
  // 여기서는 fetch 함수에서 매핑한다고 가정하고, 프론트엔드에서 사용할 이름으로 정의.
  heartRate?: number | null;          // API 응답: current_heart_rate (null 가능)
  temperature?: number | null;        // API 응답: current_temperature (null 가능)
  fallStatus?: 'normal' | 'alert' | string | null; // API 응답: current_fall_status (null 가능)

  heartRateHistory?: number[] | null;   // API 응답: null 가능
  temperatureHistory?: number[] | null; // API 응답: null 가능

  // --- 기존 Patient 인터페이스에 있던 다른 필드들 (API 응답 및 필요에 따라 유지/제거/수정) ---
  // room?: string; // 네가 필요 없다고 했으니 제거!
  age?: number; // API 응답에 직접 없다면, date_of_birth로 프론트에서 계산하거나, 백엔드에 추가 요청
  risk?: 'high' | 'medium' | 'low' | null; // API 응답에 없다면, 프론트에서 다른 값들로 계산하거나 Optional
  lastUpdated?: string | null; // API 응답에 없다면, updated_at을 사용하거나 Optional

  gyro?: { x: number; y: number; z: number } | null; // API 응답에 없다면 Optional 또는 null
  lastMovement?: string | null; // API 응답에 없다면 Optional 또는 null
  movementPattern?: string | null; // API 응답에 없다면 Optional 또는 null
  gps?: { lat: string; long: string; address: string; timestamp: string; } | null; // API 응답에 없다면 Optional 또는 null
}

// LoginPage 등에서 사용했던 UserDataForApp (이것도 필요하다면 유지)
export interface UserDataForApp {
  name: string;
  role: UserRoleType;
  organization?: OrganizationInfo | null;
}
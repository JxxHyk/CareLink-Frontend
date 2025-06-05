// src/types/index.ts

// --- 1. 공통 및 기본 타입 정의 ---
// ... (IdNamePair, TimestampFields, ApiErrorResponse 등은 그대로 유지) ...
export interface IdNamePair {
  id: number;
  name: string;
}

export interface TimestampFields {
  created_at: string;
  updated_at: string;
}

export interface ApiErrorResponse {
  detail: string;
}


// ✨ 2. Enum 타입은 src/types/enums.ts에서 import하여 사용합니다.
import {
  UserRole,
  UserStatus,
  OrganizationStatus,
  Gender,
  PatientStatus,
  DeviceStatus,
  AlertType, // 기존 HealthAlertType 대신 AlertType으로 이름 변경
  AlertSeverity,
  NotificationMethod,
  HealthMetricType,
  EventType,
} from './enums'; // 동일 디렉토리 내 enums.ts에서 import

// --- 3. ERD Entity 인터페이스 정의 ---

/**
 * @description ERD: Organizations 테이블 인터페이스 (백엔드 Organization 스키마 반영)
 */
export interface Organization extends TimestampFields {
  organization_id: number; // PK
  name: string;
  address?: string | null;
  contact_number?: string | null;
  email?: string | null;
  registration_date?: string | null;
  status?: OrganizationStatus | string | null; // ✨ OrganizationStatus Enum 사용
  mobius_organization_path?: string | null;
}

/**
 * @description ERD: Users 테이블 인터페이스 (백엔드 User 스키마 반영)
 */
export interface UserProfile extends TimestampFields {
  id: number;
  username: string;
  email: string | null;
  full_name: string | null;
  phone_number: string | null;
  user_type: UserRole; // ✨ UserRole Enum 사용
  status: UserStatus; // ✨ UserStatus Enum 사용
  
  organization_id: number;
  organization: IdNamePair | null;
  last_login: string | null;
  is_superuser: boolean | null;
}

/**
 * @description ERD: Patients 테이블 인터페이스 (백엔드 Patient 스키마 반영)
 */
export interface Patient extends TimestampFields {
  patient_id: number; // PK
  organization_id: number; // FK
  patient_code: string;
  full_name: string;
  date_of_birth?: string | null;
  gender?: Gender | string | null; // ✨ Gender Enum 사용
  address?: string | null;
  contact_number?: string | null;
  emergency_contact?: string | null;
  emergency_number?: string | null;
  medical_notes?: string | null;
  status?: PatientStatus | string | null; // ✨ PatientStatus Enum 사용
  registration_date?: string | null;

  // ... (현재 센서 값 필드들은 동일) ...
  current_heart_rate?: number | null;
  current_temperature?: number | null;
  current_fall_status?: 'normal' | 'alert' | string | null; // fallStatus는 FallDetectionStatus Enum으로 변경 고려
  // ... (나머지 current_ 센서 필드들) ...

  // ... (시계열 히스토리 데이터 필드들은 동일) ...

  // ... (프론트엔드에서 계산/표시용 필드들은 동일) ...
  age?: number | null;
  risk?: 'high' | 'medium' | 'low' | null;
  lastUpdated?: string | null;
}

/**
 * @description ERD: Devices 테이블 인터페이스 (백엔드 Device 스키마 반영)
 */
export interface Device extends TimestampFields {
  device_id: number; // PK
  organization_id: number; // FK
  device_uuid: string;
  device_type?: string | null;
  model_number?: string | null;
  serial_number?: string | null;
  firmware_version?: string | null;
  battery_level?: number | null;
  last_connection?: string | null;
  status?: DeviceStatus | string | null; // ✨ DeviceStatus Enum 사용
  registration_date?: string | null;
  mobius_device_path?: string | null;
}

/**
 * @description ERD: DevicePairing 테이블 인터페이스
 */
export interface DevicePairing extends TimestampFields {
  pairing_id: number; // PK
  device_id: number; // FK
  patient_id: number; // FK
  pairing_date?: string | null;
  pairing_status?: string | null; // TODO: 백엔드에 DevicePairingStatus Enum 있다면 enums.ts에 추가 후 여기서 사용
  pairing_code?: string | null;
  paired_by?: number | null;
  unpaired_date?: string | null;
  unpaired_by?: number | null;
}

/**
 * @description ERD: PatientCaregiver 테이블 인터페이스
 */
export interface PatientCaregiver extends TimestampFields {
  relation_id: number; // PK
  patient_id: number; // FK
  user_id: number; // FK
  relationship?: string | null; // TODO: 백엔드에 RelationshipType Enum 있다면 enums.ts에 추가 후 여기서 사용
  start_date?: string | null;
  end_date?: string | null;
  created_by?: number | null;
}

/**
 * @description ERD: HealthAlerts 테이블 인터페이스 (백엔드 Alert 스키마 반영)
 */
export interface HealthAlert extends TimestampFields {
  alert_id: number; // PK
  patient_id: number; // FK
  device_id?: number | null; // FK
  alert_type: AlertType; // ✨ AlertType Enum 사용 (이름 변경 주의)
  alert_severity: AlertSeverity; // ✨ AlertSeverity Enum 사용
  alert_message?: string | null;
  alert_timestamp: string;
  location_latitude?: number | null;
  location_longitude?: number | null;
  reading_value?: number | null;
  reading_unit?: string | null;
  is_acknowledged: boolean;
  acknowledged_by?: number | null;
  acknowledged_time?: string | null;
  response_action?: string | null;
  mobius_data_path?: string | null;
}

/**
 * @description ERD: NotificationSettings 테이블 인터페이스
 */
export interface NotificationSetting extends TimestampFields {
  setting_id: number; // PK
  user_id: number; // FK
  alert_type?: AlertType | string | null; // ✨ AlertType Enum 사용
  enabled: boolean;
  notification_method: NotificationMethod; // NotificationMethod Enum 사용
}

/**
 * @description ERD: HealthMetricThresholds 테이블 인터페이스
 */
export interface HealthMetricThreshold extends TimestampFields {
  threshold_id: number; // PK
  patient_id: number; // FK
  metric_type: HealthMetricType; // HealthMetricType Enum 사용
  min_threshold?: number | null;
  max_threshold?: number | null;
  created_by?: number | null;
}

/**
 * @description ERD: Events 테이블 인터페이스 (시스템 이벤트 로그)
 */
export interface SystemEvent extends TimestampFields {
  event_id: number; // PK
  organization_id?: number | null; // FK
  event_type: EventType; // EventType Enum 사용
  event_source?: string | null;
  related_id?: number | null;
  user_id?: number | null;
  event_data?: Record<string, any> | null;
  ip_address?: string | null;
  event_timestamp: string;
}

/**
 * @description ERD: Sessions 테이블 인터페이스
 */
export interface UserSession extends TimestampFields {
  session_id: string; // PK
  user_id: number; // FK
  login_timestamp: string;
  logout_timestamp?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  is_active: boolean;
  last_activity_timestamp?: string | null;
}


// --- 4. 앱 내에서 사용되는 보조 타입 ---

/**
 * @description 로그인 후 앱 전체에서 사용될 현재 사용자 정보
 * UserProfile을 기반으로 함.
 */
export type CurrentUser = Omit<UserProfile, 'password_hash' | 'status' | 'last_login'>;

// Next.js 페이지 컴포넌트에서 API 응답과 매핑될 최종 Patient 타입
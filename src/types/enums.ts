// src/types/enums.ts

// 백엔드 app/models/enums.py와 일치하도록 정의합니다.

// 사용자 역할 타입 (백엔드: UserType)
export enum UserRole {
  ADMIN = "admin",
  STAFF = "staff",
  SUPER_ADMIN = "super_admin",
}

// 사용자 계정 상태 타입 (백엔드: UserStatus)
export enum UserStatus { // ✨ AccountStatus 대신 백엔드 이름인 UserStatus로 변경
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING_APPROVAL = "pending_approval",
}

// 기관 상태 타입 (백엔드: OrganizationStatus)
export enum OrganizationStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

// 환자 성별 타입 (백엔드: Gender)
export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

// 환자 상태 타입 (백엔드: PatientStatus)
export enum PatientStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ARCHIVED = "archived",
}

// 기기 상태 타입 (백엔드: DeviceStatus)
export enum DeviceStatus { // ✨ DeviceConnectionStatus 대신 백엔드 이름인 DeviceStatus로 변경
  ACTIVE = "active",
  INACTIVE = "inactive",
  DISCONNECTED = "disconnected",
  MAINTENANCE = "maintenance",
}

// 알림 유형 (백엔드: AlertType)
export enum AlertType { // ✨ HealthAlertType 대신 백엔드 이름인 AlertType으로 변경
  HEART_RATE_HIGH = "heart_rate_high",
  HEART_RATE_LOW = "heart_rate_low",
  TEMPERATURE_HIGH = "temperature_high",
  TEMPERATURE_LOW = "temperature_low",
  FALL_DETECTED = "fall_detected",
}

// 알림 심각도 (백엔드: AlertSeverity)
export enum AlertSeverity {
  CRITICAL = "critical",
  WARNING = "warning",
  INFO = "info",
}

// ✨ 프론트엔드에서만 사용되거나, 백엔드 다른 곳에 정의된 Enum이라면 여기에 유지
// (예: HealthMetricType, EventType, NotificationMethod - ERD 기반)
// 만약 백엔드에도 동일한 Enum이 있다면, 백엔드와 일치시키거나 백엔드에서 내려주는 string 값을 직접 사용해야 합니다.
export enum NotificationMethod {
  EMAIL = "email",
  SMS = "sms",
  APP_PUSH = "app_push",
  CALL = "call",
}

export enum HealthMetricType {
  HEART_RATE = "heart_rate",
  TEMPERATURE = "temperature",
  ACCELERATION = "acceleration",
  GYROSCOPE = "gyroscope",
  STEP_COUNT = "step_count",
  LOCATION = "location",
}

export enum EventType {
  LOGIN = "login",
  LOGOUT = "logout",
  DATA_COLLECTION = "data_collection",
  ALERT_TRIGGERED = "alert_triggered",
  ALERT_ACKNOWLEDGED = "alert_acknowledged",
  DEVICE_PAIR = "device_pair",
  DEVICE_UNPAIR = "device_unpair",
  USER_CREATE = "user_create",
  PATIENT_CREATE = "patient_create",
}
// src/types/enums.ts

// 사용자 역할 타입
// 백엔드 UserType Enum: ADMIN = "admin", STAFF = "staff", SUPER_ADMIN = "super_admin"
export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  STAFF = "staff",
}
// UserRoleType은 문자열 리터럴 유니온 타입으로도 사용할 수 있어.
// export type UserRoleType = "super_admin" | "admin" | "staff";

// 사용자 계정 상태 타입
// 백엔드 UserStatus Enum: ACTIVE = "active", INACTIVE = "inactive", SUSPENDED = "suspended", PENDING_APPROVAL = "pending_approval"
export enum AccountStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING_APPROVAL = "pending_approval",
}
// export type AccountStatusType = "active" | "inactive" | "suspended" | "pending_approval";

// 기관 상태 타입
// 백엔드 OrganizationStatus Enum: ACTIVE = "active", INACTIVE = "inactive", SUSPENDED = "suspended"
export enum OrganizationStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}
// export type OrgStatusType = "active" | "inactive" | "suspended";

// 환자 성별 타입
// 백엔드 Gender Enum: MALE = "male", FEMALE = "female", OTHER = "other"
export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}
// export type GenderType = "male" | "female" | "other";

// 환자 상태 타입
// 백엔드 PatientStatus Enum: ACTIVE = "active", INACTIVE = "inactive", DISCHARGED = "discharged"
export enum PatientStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DISCHARGED = "discharged",
}
// export type PatientConditionType = "active" | "inactive" | "discharged";


// 기기 상태 타입 (예시)
// 백엔드 Device 모델에 status Enum이 있다면 그에 맞춰서
export enum DeviceConnectionStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DISCONNECTED = "disconnected",
  MAINTENANCE = "maintenance",
}
// export type DeviceConnectionStatusType = "active" | "inactive" | "disconnected" | "maintenance";


// 낙상 상태 타입 (예시 - Patient 인터페이스의 fallStatus와 연관)
export enum FallDetectionStatus {
    NORMAL = "normal",
    ALERT = "alert",
}
// export type FallDetectionStatusType = "normal" | "alert";


// 알림 유형 (예시 - HealthAlerts 모델과 연관)
export enum AlertType {
    HEART_RATE_HIGH = "heart_rate_high",
    HEART_RATE_LOW = "heart_rate_low",
    TEMPERATURE_HIGH = "temperature_high",
    TEMPERATURE_LOW = "temperature_low",
    FALL_DETECTED = "fall_detected",
}

// 알림 심각도 (예시 - HealthAlerts 모델과 연관)
export enum AlertSeverity {
    CRITICAL = "critical",
    WARNING = "warning",
    INFO = "info",
}

// 여기에 네 프로젝트에서 공통으로 사용될 다른 Enum이나 Union 타입들을 추가하면 돼!
// src/lib/api.ts (기존 내용에서 fetchAllPatientsFromAPI 관련 함수를 삭제하고 fetchPatients로 통합)

import { Patient, UserProfile, ApiErrorResponse } from '@/types';
import { PatientStatus, UserType } from '@/types/enums';
// import { NextRouter } from 'next/router'; // 이제 NextRouter는 더 이상 사용하지 않음

interface CustomRouterForApi {
  replace: (path: string) => void;
}

const BASE_API_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';

// 에러 응답 처리 헬퍼 함수
async function handleApiResponse<T>(response: Response, router?: CustomRouterForApi): Promise<T> {
  if (response.status === 401) {
    console.error("인증 토큰이 만료되었거나 유효하지 않습니다. 로그인 페이지로 이동합니다.");
    if (typeof window !== "undefined") {
      localStorage.clear();
      if (router) {
        router.replace('/login');
      } else {
        // router가 제공되지 않은 경우, window.location.href 사용 (Server Component 등에서)
        window.location.href = '/login';
      }
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json().catch(() => ({ detail: "알 수 없는 오류 발생" }));
    const errorMessage = errorData.detail || response.statusText || `API 요청 실패: ${response.status}`;
    console.error(`API 요청 실패 (상태: ${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
  return response.json();
}

// -------------------- 인증 관련 API --------------------

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export async function loginUser(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${BASE_API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleApiResponse<LoginResponse>(response);
}

export async function fetchCurrentUser(token: string, router?: CustomRouterForApi): Promise<UserProfile> {
  const response = await fetch(`${BASE_API_URL}/api/v1/auth/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleApiResponse<UserProfile>(response, router);
}

export async function logoutUser(token: string): Promise<void> {
  const response = await fetch(`${BASE_API_URL}/api/v1/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    console.error("로그아웃 API 실패:", response.status, await response.text());
    throw new Error("Logout failed");
  }
}

interface RegisterUserResponse {
  id: number;
  username: string;
  email: string | null;
}

interface RegisterUserData {
  username: string;
  email?: string | null;
  password?: string;
  full_name?: string | null;
  phone_number?: string | null;
  organization_id: number;
  user_type: UserType;
}

export async function registerUser(data: RegisterUserData): Promise<RegisterUserResponse> {
  const response = await fetch(`${BASE_API_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleApiResponse<RegisterUserResponse>(response);
}

// -------------------- 환자 관련 API --------------------

// fetchPatients 함수를 이제 직접 API 응답을 Patient 타입에 맞게 매핑하도록 할게.
export async function fetchPatients(token: string, organizationId: number, router?: CustomRouterForApi): Promise<Patient[]> {
  const response = await fetch(`${BASE_API_URL}/api/v1/patients/?organization_id=${organizationId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await handleApiResponse<any[]>(response, router);

  return data.map(apiPatient => ({
    patient_id: apiPatient.patient_id,
    organization_id: apiPatient.organization_id,
    patient_code: apiPatient.patient_code,
    full_name: apiPatient.full_name,
    date_of_birth: apiPatient.date_of_birth,
    gender: apiPatient.gender,
    address: apiPatient.address,
    contact_number: apiPatient.contact_number,
    emergency_contact: apiPatient.emergency_contact,
    emergency_number: apiPatient.emergency_number,
    medical_notes: apiPatient.medical_notes,
    status: apiPatient.status as PatientStatus,
    registration_date: apiPatient.registration_date,
    created_at: apiPatient.created_at || new Date().toISOString(),
    updated_at: apiPatient.updated_at || new Date().toISOString(),
    current_heart_rate: apiPatient.current_heart_rate ?? null,
    current_temperature: apiPatient.current_temperature ?? null,
    current_fall_status: apiPatient.current_fall_status ?? null,
    current_gps_latitude: apiPatient.current_gps_latitude ?? null,
    current_gps_longitude: apiPatient.current_gps_longitude ?? null,
    current_step_count: apiPatient.current_step_count ?? null,
    current_acceleration_x: apiPatient.current_acceleration_x ?? null,
    current_acceleration_y: apiPatient.current_acceleration_y ?? null,
    current_acceleration_z: apiPatient.current_acceleration_z ?? null,
    current_gyro_x: apiPatient.current_gyro_x ?? null,
    current_gyro_y: apiPatient.current_gyro_y ?? null,
    current_gyro_z: apiPatient.current_gyro_z ?? null,
    current_battery_level: apiPatient.current_battery_level ?? null,
    heart_rate_history: Array.isArray(apiPatient.heart_rate_history) ? apiPatient.heart_rate_history : [],
    temperature_history: Array.isArray(apiPatient.temperature_history) ? apiPatient.temperature_history : [],
    acceleration_history: Array.isArray(apiPatient.acceleration_history) ? apiPatient.acceleration_history : [],
    gyro_history: Array.isArray(apiPatient.gyro_history) ? apiPatient.gyro_history : [],
    gps_history: Array.isArray(apiPatient.gps_history) ? apiPatient.gps_history : [],
    age: apiPatient.age ?? null,
    risk: apiPatient.risk ?? 'low',
    lastUpdated: apiPatient.updated_at ?? new Date().toISOString(),
    gyro: apiPatient.gyro || { x: 0, y: 0, z: 0 },
    lastMovement: apiPatient.lastMovement || "N/A",
    movementPattern: apiPatient.movementPattern || "N/A",
    gps: apiPatient.gps || { lat: "N/A", long: "N/A", address: "N/A", timestamp: "N/A" },
  }));
}

export async function fetchPatientById(patientId: string | number, token: string, router?: CustomRouterForApi): Promise<Patient> {
  const response = await fetch(`${BASE_API_URL}/api/v1/patients/${patientId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await handleApiResponse<any>(response, router);
  return {
    patient_id: data.patient_id,
    organization_id: data.organization_id,
    patient_code: data.patient_code,
    full_name: data.full_name,
    date_of_birth: data.date_of_birth,
    gender: data.gender,
    address: data.address,
    contact_number: data.contact_number,
    emergency_contact: data.emergency_contact,
    emergency_number: data.emergency_number,
    medical_notes: data.medical_notes,
    status: data.status as PatientStatus,
    registration_date: data.registration_date,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
    current_heart_rate: data.current_heart_rate ?? null,
    current_temperature: data.current_temperature ?? null,
    current_fall_status: data.current_fall_status ?? null,
    current_gps_latitude: data.current_gps_latitude ?? null,
    current_gps_longitude: data.current_gps_longitude ?? null,
    current_step_count: data.current_step_count ?? null,
    current_acceleration_x: data.current_acceleration_x ?? null,
    current_acceleration_y: data.current_acceleration_y ?? null,
    current_acceleration_z: data.current_acceleration_z ?? null,
    current_gyro_x: data.current_gyro_x ?? null,
    current_gyro_y: data.current_gyro_y ?? null,
    current_gyro_z: data.current_gyro_z ?? null,
    current_battery_level: data.current_battery_level ?? null,
    heart_rate_history: Array.isArray(data.heart_rate_history) ? data.heart_rate_history : [],
    temperature_history: Array.isArray(data.temperature_history) ? data.temperature_history : [],
    acceleration_history: Array.isArray(data.acceleration_history) ? data.acceleration_history : [],
    gyro_history: Array.isArray(data.gyro_history) ? data.gyro_history : [],
    gps_history: Array.isArray(data.gps_history) ? data.gps_history : [],
    age: data.age ?? null,
    risk: data.risk ?? 'low',
    lastUpdated: data.updated_at ?? new Date().toISOString(),
    gyro: data.gyro || { x: 0, y: 0, z: 0 },
    lastMovement: data.lastMovement || "N/A",
    movementPattern: data.movementPattern || "N/A",
    gps: data.gps || { lat: "N/A", long: "N/A", address: "N/A", timestamp: "N/A" },
  };
}

export async function deletePatient(patientId: number, token: string, router?: CustomRouterForApi): Promise<boolean> {
  const response = await fetch(`${BASE_API_URL}/api/v1/patients/${patientId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  try {
    if (response.status === 204) {
      return true;
    }
    await handleApiResponse<void>(response, router);
    return true;
  } catch (error) {
    console.error(`환자 ID ${patientId} 삭제 실패:`, error);
    throw error;
  }
}

export type PatientUpdateData = Partial<Omit<Patient, 'patient_id' | 'organization_id' | 'created_at' | 'updated_at'>>;

export async function updatePatient(patientId: number, data: PatientUpdateData, token: string, router?: CustomRouterForApi): Promise<Patient> {
  const response = await fetch(`${BASE_API_URL}/api/v1/patients/${patientId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  const updatedData = await handleApiResponse<any>(response, router);
  return {
    patient_id: updatedData.patient_id,
    organization_id: updatedData.organization_id,
    patient_code: updatedData.patient_code,
    full_name: updatedData.full_name,
    date_of_birth: updatedData.date_of_birth,
    gender: updatedData.gender,
    address: updatedData.address,
    contact_number: updatedData.contact_number,
    emergency_contact: updatedData.emergency_contact,
    emergency_number: updatedData.emergency_number,
    medical_notes: updatedData.medical_notes,
    status: updatedData.status as PatientStatus,
    registration_date: updatedData.registration_date,
    created_at: updatedData.created_at || new Date().toISOString(),
    updated_at: updatedData.updated_at || new Date().toISOString(),
    current_heart_rate: updatedData.current_heart_rate ?? null,
    current_temperature: updatedData.current_temperature ?? null,
    current_fall_status: updatedData.current_fall_status ?? null,
    current_gps_latitude: updatedData.current_gps_latitude ?? null,
    current_gps_longitude: updatedData.current_gps_longitude ?? null,
    current_step_count: updatedData.current_step_count ?? null,
    current_acceleration_x: updatedData.current_acceleration_x ?? null,
    current_acceleration_y: updatedData.current_acceleration_y ?? null,
    current_acceleration_z: updatedData.current_acceleration_z ?? null,
    current_gyro_x: updatedData.current_gyro_x ?? null,
    current_gyro_y: updatedData.current_gyro_y ?? null,
    current_gyro_z: updatedData.current_gyro_z ?? null,
    current_battery_level: updatedData.current_battery_level ?? null,
    heart_rate_history: Array.isArray(updatedData.heart_rate_history) ? updatedData.heart_rate_history : [],
    temperature_history: Array.isArray(updatedData.temperature_history) ? updatedData.temperature_history : [],
    acceleration_history: Array.isArray(updatedData.acceleration_history) ? updatedData.acceleration_history : [],
    gyro_history: Array.isArray(updatedData.gyro_history) ? updatedData.gyro_history : [],
    gps_history: Array.isArray(updatedData.gps_history) ? updatedData.gps_history : [],
    age: updatedData.age ?? null,
    risk: updatedData.risk ?? 'low',
    lastUpdated: updatedData.updated_at ?? new Date().toISOString(),
    gyro: updatedData.gyro || { x: 0, y: 0, z: 0 },
    lastMovement: updatedData.lastMovement || "N/A",
    movementPattern: updatedData.movementPattern || "N/A",
    gps: updatedData.gps || { lat: "N/A", long: "N/A", address: "N/A", timestamp: "N/A" },
  };
}

export async function addPatient(data: Omit<Patient, 'patient_id' | 'created_at' | 'updated_at' | 'risk' | 'age' | 'lastUpdated' | 'gyro' | 'lastMovement' | 'movementPattern' | 'gps' |
'current_heart_rate' | 'current_temperature' | 'current_fall_status' | 'current_gps_latitude' | 'current_gps_longitude' | 'current_step_count' |
'current_acceleration_x' | 'current_acceleration_y' | 'current_acceleration_z' | 'current_gyro_x' | 'current_gyro_y' | 'current_gyro_z' |
'current_battery_level' | 'heart_rate_history' | 'temperature_history' | 'acceleration_history' | 'gyro_history' | 'gps_history'
>, token: string, router?: CustomRouterForApi): Promise<Patient> {
    const response = await fetch(`${BASE_API_URL}/api/v1/patients/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    const createdPatient = await handleApiResponse<any>(response, router);
    return {
        patient_id: createdPatient.patient_id,
        organization_id: createdPatient.organization_id,
        patient_code: createdPatient.patient_code,
        full_name: createdPatient.full_name,
        date_of_birth: createdPatient.date_of_birth,
        gender: createdPatient.gender,
        address: createdPatient.address,
        contact_number: createdPatient.contact_number,
        emergency_contact: createdPatient.emergency_contact,
        emergency_number: createdPatient.emergency_number,
        medical_notes: createdPatient.medical_notes,
        status: createdPatient.status as PatientStatus,
        registration_date: createdPatient.registration_date,
        created_at: createdPatient.created_at || new Date().toISOString(),
        updated_at: createdPatient.updated_at || new Date().toISOString(),
        current_heart_rate: createdPatient.current_heart_rate ?? null,
        current_temperature: createdPatient.current_temperature ?? null,
        current_fall_status: createdPatient.current_fall_status ?? null,
        current_gps_latitude: createdPatient.current_gps_latitude ?? null,
        current_gps_longitude: createdPatient.current_gps_longitude ?? null,
        current_step_count: createdPatient.current_step_count ?? null,
        current_acceleration_x: createdPatient.current_acceleration_x ?? null,
        current_acceleration_y: createdPatient.current_acceleration_y ?? null,
        current_acceleration_z: createdPatient.current_acceleration_z ?? null,
        current_gyro_x: createdPatient.current_gyro_x ?? null,
        current_gyro_y: createdPatient.current_gyro_y ?? null,
        current_gyro_z: createdPatient.current_gyro_z ?? null,
        current_battery_level: createdPatient.current_battery_level ?? null,
        heart_rate_history: Array.isArray(createdPatient.heart_rate_history) ? createdPatient.heart_rate_history : [],
        temperature_history: Array.isArray(createdPatient.temperature_history) ? createdPatient.temperature_history : [],
        acceleration_history: Array.isArray(createdPatient.acceleration_history) ? createdPatient.acceleration_history : [],
        gyro_history: Array.isArray(createdPatient.gyro_history) ? createdPatient.gyro_history : [],
        gps_history: Array.isArray(createdPatient.gps_history) ? createdPatient.gps_history : [],
        age: createdPatient.age ?? null,
        risk: createdPatient.risk ?? 'low',
        lastUpdated: createdPatient.updated_at ?? new Date().toISOString(),
        gyro: createdPatient.gyro || { x: 0, y: 0, z: 0 },
        lastMovement: createdPatient.lastMovement || "N/A",
        movementPattern: createdPatient.movementPattern || "N/A",
        gps: createdPatient.gps || { lat: "N/A", long: "N/A", address: "N/A", timestamp: "N/A" },
    };
}

// 최신 센서 데이터 가져오기 (Mobius용)
interface LatestSensorDataResponse {
  patient_id: number;
  current_heart_rate?: number | null;
  current_temperature?: number | null;
  current_fall_status?: 'normal' | 'alert' | string | null;
  current_gps_latitude?: number | null;
  current_gps_longitude?: number | null;
  current_step_count?: number | null;
  current_acceleration_x?: number | null;
  current_acceleration_y?: number | null;
  current_acceleration_z?: number | null;
  current_gyro_x?: number | null;
  current_gyro_y?: number | null;
  current_gyro_z?: number | null;
  current_battery_level?: number | null;
  // 백엔드에서 시계열 히스토리도 함께 내려준다면 여기에 추가
  heart_rate_history?: number[];
  temperature_history?: number[];
  acceleration_history?: { x: number; y: number; z: number; timestamp: string }[];
  gyro_history?: { x: number; y: number; z: number; timestamp: string }[];
  gps_history?: { lat: number; long: number; address?: string; timestamp: string }[];
  lastUpdated?: string; // 마지막 업데이트 시간
}

export async function fetchLatestSensorData(
  patientId: number,
  token: string,
  router?: CustomRouterForApi
): Promise<LatestSensorDataResponse | null> {
  const response = await fetch(`${BASE_API_URL}/api/v1/patients/${patientId}/latest_sensor_data`, { // ✨ 새로운 API 엔드포인트!
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (response.status === 404) {
    console.warn(`Patient ID ${patientId}에 대한 최신 센서 데이터가 없습니다.`);
    return null; // 데이터가 없을 경우 null 반환
  }

  return handleApiResponse<LatestSensorDataResponse>(response, router);
}
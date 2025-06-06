// src/lib/api.ts
import { Patient, UserProfile, IdNamePair, ApiErrorResponse } from '@/types'; // 필요한 타입들 import
import { PatientStatus, UserType } from '@/types/enums'; // 필요한 Enum들 import
import { NextRouter } from 'next/router'; // useRouter의 타입을 위해 import (next/navigation의 useRouter는 NextRouter 타입이 아님)

// Next.js 13+의 useRouter는 NextRouter 타입이 아니라 AppRouterInstance 타입이야.
// 그래서 router.replace를 사용할 때 타입을 맞춰줘야 해.
// 여기서는 임시적으로 any로 두거나, 정확한 타입을 import해서 사용해야 해.
// App Router에서 useRouter는 'next/navigation'에서 가져오고, 이는 NextRouter가 아님.
// 따라서 아래의 router: NextRouter는 정확하지 않고, router: any 또는 AppRouterInstance 타입이어야 해.
// 하지만 이 api.ts 파일은 순수 로직만 담고 next/navigation에 직접 의존하지 않는 것이 좋으니,
// router를 인자로 받을 때 이 api 함수를 호출하는 곳에서 (즉, 컴포넌트에서) router를 바인딩해서 넘기거나,
// 이 함수 내부에서 router를 직접 사용하지 않도록 설계하는 것이 더 좋아.
// 일단은 router를 인자로 받고, 해당 인자를 쓰는 함수들이 router의 replace 메서드를 호출할 수 있도록 해보자.

interface CustomRouterForApi {
  replace: (path: string) => void;
  // 필요한 다른 router 메서드가 있다면 여기에 추가
}

const BASE_API_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';

// 에러 응답 처리 헬퍼 함수
async function handleApiResponse<T>(response: Response, router?: CustomRouterForApi): Promise<T> {
  if (response.status === 401) {
    console.error("인증 토큰이 만료되었거나 유효하지 않습니다. 로그인 페이지로 이동합니다.");
    if (typeof window !== "undefined") {
      localStorage.clear();
      if (router) { // router가 제공되었다면 사용
        router.replace('/login');
      } else {
        // router가 제공되지 않은 경우, window.location.href 사용 (Server Component 등에서)
        window.location.href = '/login';
      }
    }
    throw new Error("Unauthorized"); // 에러를 던져서 호출자가 catch하도록 함
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
  // 로그아웃은 응답 본문이 없을 수 있으므로 status만 체크
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
  password?: string; // 보안상 비밀번호를 그대로 보내지 않지만, 스키마에 따라 일단 둠
  full_name?: string | null;
  phone_number?: string | null;
  organization_id: number;
  user_type: UserType; // UserType Enum 사용
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

export async function fetchPatients(token: string, organizationId: number, router?: CustomRouterForApi): Promise<Patient[]> {
  const response = await fetch(`${BASE_API_URL}/api/v1/patients/?organization_id=${organizationId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await handleApiResponse<any[]>(response, router); // 일단 any[]로 받고, 매핑은 호출하는 쪽에서
  
  // API 응답 형태를 Patient 타입에 맞게 매핑 (여기서 할 수도 있고, 호출하는 곳에서 할 수도 있음)
  // 여기서는 API 계층에서 최대한 클라이언트 모델에 맞추는 것을 목표로 함.
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
  // 단일 환자 응답도 Patient 타입에 맞게 매핑
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
    // 204 No Content는 본문이 없으므로 json 파싱 시도하지 않음
    if (response.status === 204) {
      return true;
    }
    // 다른 성공적인 2xx 응답도 처리할 수 있도록 handleApiResponse 사용
    await handleApiResponse<void>(response, router); // void 타입으로 지정하여 본문 파싱 안 함
    return true;
  } catch (error) {
    console.error(`환자 ID ${patientId} 삭제 실패:`, error);
    throw error; // 에러를 다시 던져서 호출하는 쪽에서 처리하도록 함
  }
}

// 환자 업데이트를 위한 데이터 타입 정의 (부분 업데이트이므로 Partial 사용)
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
  // 업데이트된 환자 정보도 Patient 타입에 맞게 매핑하여 반환
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
    // 생성된 환자 정보도 Patient 타입에 맞게 매핑하여 반환
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
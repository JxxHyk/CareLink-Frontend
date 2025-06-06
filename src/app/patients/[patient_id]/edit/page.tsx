// src/app/patients/[patient_id]/edit/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import MyCustomLayout from '@/components/Layout';
import type { Patient, UserProfile, CurrentUser } from '@/types'; // User -> UserProfile, CurrentUser
import { Gender, PatientStatus } from '@/types/enums';

// ... (fetchPatientByIdAPI, updatePatientAPI 함수는 그대로 유지) ...
// fetchPatientByIdAPI와 updatePatientAPI는 Patient 타입을 사용하고 있으므로, User 타입을 CurrentUser로 변경할 필요 없음.
// 하지만 fetchPatientByIdAPI의 리턴 타입과 내부 매핑은 Patient 인터페이스와 정확히 일치하는지 다시 한번 확인하는 게 좋아.

// 특정 환자 정보 가져오기 (상세 페이지용 또는 수정 폼 초기값용)
async function fetchPatientByIdAPI(patientId: string | number, token: string | null): Promise<Patient | null> {
    if (!token) {
      console.warn("fetchPatientByIdAPI: Auth token not found.");
      return null;
    }
    const BASE_API_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';
    const API_URL = `${BASE_API_URL}/api/v1/patients/${patientId}`; // 실제 URL로!
    try {
        const response = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) {
            console.error("환자 상세 정보 API 실패:", response.status, await response.text());
            return null;
        }
        const data = await response.json();
        // API 응답과 Patient 타입 매핑 (page.tsx의 fetchAllPatientsFromAPI 함수 참고)
        // 여기에 API 응답 필드와 Patient 타입 필드 매핑 로직을 추가해야 함.
        // 예를 들어, 백엔드에서 patient_id가 'id'로 오면 patient_id: data.id 처럼.
        return {
            patient_id: data.patient_id || data.id, // API마다 필드명이 다를 수 있으니 확인
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
            status: data.status,
            registration_date: data.registration_date,
            created_at: data.created_at,
            updated_at: data.updated_at,
            // 나머지 필드도 API 응답에 맞춰 매핑
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
            lastUpdated: data.lastUpdated || data.updated_at,
            gyro: data.gyro || { x:0, y:0, z:0 },
            lastMovement: data.lastMovement || "N/A",
            movementPattern: data.movementPattern || "N/A",
            gps: data.gps || { lat: "N/A", long: "N/A", address: "N/A", timestamp: "N/A" },
        } as Patient;
    } catch (error) { console.error("환자 상세 정보 API 오류:", error); return null; }
}

// 환자 정보 업데이트 API 호출 함수
async function updatePatientAPI(
    patientId: string | number,
    updateData: Partial<Patient>, // PatientUpdate 스키마와 유사한 부분 업데이트용 타입
    token: string | null
): Promise<Patient | null> {
    if (!token) return null;
    const BASE_API_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';
    const API_URL = `${BASE_API_URL}/api/v1/patients/${patientId}`; // 실제 URL로! (PUT 또는 PATCH)
    try {
        const response = await fetch(API_URL, {
            method: 'PUT', // 또는 'PATCH' (백엔드 API 설계에 따라)
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("환자 정보 수정 API 실패:", response.status, errorData);
            alert(`수정 실패: ${errorData.detail || response.statusText}`);
            return null;
        }
        return await response.json() as Patient;
    } catch (error) { console.error("환자 정보 수정 API 오류:", error); alert('수정 중 오류 발생'); return null; }
}


export default function EditPatientPage() {
    const router = useRouter();
    const params = useParams();
    const [patientId, setPatientId] = useState<string | null>(null);

    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null); // User -> CurrentUser
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

    const [patientData, setPatientData] = useState<Partial<Patient> | null>(null);
    const [isLoadingPatient, setIsLoadingPatient] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (params && params.patient_id) {
            const id = Array.isArray(params.patient_id) ? params.patient_id[0] : params.patient_id;
            setPatientId(id);
        } else if (params) {
            console.warn("Patient ID not found in params, but params object exists:", params);
            setError("환자 ID를 찾을 수 없습니다.");
        }
    }, [params]);

    // 인증 정보 로드 (MainPageController와 중복되지만, 페이지 직접 접근 시를 대비)
    useEffect(() => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem('authToken');
            const userJson = localStorage.getItem('currentUser');
            if (token && userJson) {
                try {
                    setAuthToken(token);
                    setCurrentUser(JSON.parse(userJson) as UserProfile); // UserProfile로 파싱
                } catch (e) {
                    console.error("사용자 정보 파싱 오류:", e);
                    localStorage.clear(); // 오류 발생 시 로컬 스토리지 정리
                    router.replace('/login');
                }
            } else {
                localStorage.clear(); // 토큰이나 유저 정보가 없으면 정리
                router.replace('/login');
            }
            setIsLoadingAuth(false);
        }
    }, [router]);

    const loadPatientDetail = useCallback(async () => {
        if (authToken && patientId) {
            setIsLoadingPatient(true);
            const fetchedPatient = await fetchPatientByIdAPI(patientId, authToken);
            if (fetchedPatient) {
                setPatientData({
                    patient_code: fetchedPatient.patient_code,
                    full_name: fetchedPatient.full_name,
                    date_of_birth: fetchedPatient.date_of_birth ? fetchedPatient.date_of_birth.split('T')[0] : '',
                    gender: fetchedPatient.gender as Gender | '' || '',
                    address: fetchedPatient.address || '',
                    contact_number: fetchedPatient.contact_number || '',
                    emergency_contact: fetchedPatient.emergency_contact || '',
                    emergency_number: fetchedPatient.emergency_number || '',
                    medical_notes: fetchedPatient.medical_notes || '',
                    status: fetchedPatient.status as PatientStatus || PatientStatus.ACTIVE,
                    registration_date: fetchedPatient.registration_date ? fetchedPatient.registration_date.split('T')[0] : '',
                });
            } else {
                setError("환자 정보를 불러오지 못했습니다.");
            }
            setIsLoadingPatient(false);
        }
    }, [authToken, patientId]);

    useEffect(() => {
        if (!isLoadingAuth && authToken && patientId) { // authToken과 patientId가 모두 있을 때 로드
            loadPatientDetail();
        }
    }, [isLoadingAuth, authToken, patientId, loadPatientDetail]); // 의존성 배열에 patientId 추가

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPatientData(prev => prev ? ({ ...prev, [name]: value }) : null);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!authToken || !patientId || !patientData) return;

        setIsSubmitting(true);
        setError(null);

        const dataToUpdate: Partial<Patient> = { ...patientData };
        if (dataToUpdate.date_of_birth === '') dataToUpdate.date_of_birth = null;
        if (dataToUpdate.registration_date === '') dataToUpdate.registration_date = null;
        if (dataToUpdate.gender === '') dataToUpdate.gender = null;


        const updatedPatient = await updatePatientAPI(patientId, dataToUpdate, authToken);

        if (updatedPatient) {
            alert('환자 정보가 성공적으로 수정되었습니다!');
            router.push('/patients');
        }
        setIsSubmitting(false);
    };

    if (isLoadingAuth || !currentUser) {
        return <MyCustomLayout currentUser={null}><div className="p-6 text-center">로딩 중 또는 인증 필요...</div></MyCustomLayout>;
    }
    if (isLoadingPatient) {
        return <MyCustomLayout currentUser={currentUser}><div className="p-6 text-center">환자 정보 로딩 중...</div></MyCustomLayout>;
    }
    if (error) {
        return <MyCustomLayout currentUser={currentUser}><div className="p-6 text-center text-red-500">{error}</div></MyCustomLayout>;
    }
    if (!patientData) {
        return <MyCustomLayout currentUser={currentUser}><div className="p-6 text-center">환자 데이터를 찾을 수 없습니다.</div></MyCustomLayout>;
    }

    return (
        <MyCustomLayout currentUser={currentUser}>
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">환자 정보 수정 (ID: {patientId})</h1>
                    <Link href="/patients" className="text-sm text-primary hover:underline">
                        환자 목록으로 돌아가기
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
                    {/* ... (폼 필드는 그대로 유지) ... */}
                    <div>
                        <label htmlFor="patient_code" className="block text-sm font-medium text-gray-700">환자 코드</label>
                        <input type="text" name="patient_code" id="patient_code" value={patientData.patient_code || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100" readOnly />
                    </div>

                    <div>
                        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">이름 <span className="text-red-500">*</span></label>
                        <input type="text" name="full_name" id="full_name" value={patientData.full_name || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">생년월일</label>
                            <input type="date" name="date_of_birth" id="date_of_birth" value={patientData.date_of_birth || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                        <div>
                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">성별</label>
                            <select name="gender" id="gender" value={patientData.gender || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white">
                                <option value="">선택안함</option>
                                <option value={Gender.MALE}>남성</option>
                                <option value={Gender.FEMALE}>여성</option>
                                <option value={Gender.OTHER}>기타</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">주소</label>
                        <input type="text" name="address" id="address" value={patientData.address || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700">연락처</label>
                            <input type="tel" name="contact_number" id="contact_number" value={patientData.contact_number || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                        <div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700">비상 연락처(이름)</label>
                            <input type="text" name="emergency_contact" id="emergency_contact" value={patientData.emergency_contact || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                        <div>
                            <label htmlFor="emergency_number" className="block text-sm font-medium text-gray-700">비상 연락처(번호)</label>
                            <input type="tel" name="emergency_number" id="emergency_number" value={patientData.emergency_number || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="medical_notes" className="block text-sm font-medium text-gray-700">의료 특이사항</label>
                        <textarea name="medical_notes" id="medical_notes" rows={3} value={patientData.medical_notes || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">환자 상태</label>
                            <select name="status" id="status" value={patientData.status || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white">
                                <option value={PatientStatus.ACTIVE}>Active</option>
                                <option value={PatientStatus.INACTIVE}>Inactive</option>
                                <option value={PatientStatus.DISCHARGED}>Discharged</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="registration_date" className="block text-sm font-medium text-gray-700">등록일</label>
                            <input type="date" name="registration_date" id="registration_date" value={patientData.registration_date || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}

                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={() => router.back()} className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                            취소
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md shadow-sm hover:bg-primary/90 disabled:opacity-50">
                            {isSubmitting ? '수정 중...' : '정보 수정'}
                        </button>
                    </div>
                </form>
            </div>
        </MyCustomLayout>
    );
}
// src/app/patients/[patient_id]/edit/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation'; // useParams 추가!
import Link from 'next/link';
import MyCustomLayout from '@/components/Layout';
import type { Patient, User, OrganizationInfo } from '@/types';
import { Gender, PatientStatus } from '@/types/enums'; // Enum 경로 확인

// --- 데이터를 FastAPI 백엔드에서 가져오는 함수들 ---
// 특정 환자 정보 가져오기 (상세 페이지용 또는 수정 폼 초기값용)
async function fetchPatientByIdAPI(patientId: string | number, token: string | null): Promise<Patient | null> {
    if (!token) return null;
    const API_URL = `http://127.0.0.1:8000/api/v1/patients/${patientId}`; // 실제 URL로!
    try {
        const response = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) { console.error("환자 상세 정보 API 실패:", response.status); return null; }
        const data = await response.json();
        // API 응답과 Patient 타입 매핑 (page.tsx의 fetchAllPatientsFromAPI 함수 참고)
        return { /* ... API data를 Patient 타입으로 매핑 ... */ ...data, patient_id: data.id || data.patient_id, full_name: data.full_name || data.name } as Patient; // 간단 예시
    } catch (error) { console.error("환자 상세 정보 API 오류:", error); return null; }
}

// 환자 정보 업데이트 API 호출 함수
async function updatePatientAPI(
    patientId: string | number,
    updateData: Partial<Patient>, // PatientUpdate 스키마와 유사한 부분 업데이트용 타입
    token: string | null
): Promise<Patient | null> {
    if (!token) return null;
    const API_URL = `http://127.0.0.1:8000/api/v1/patients/${patientId}`; // 실제 URL로! (PUT 또는 PATCH)
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
    const params = useParams(); // URL 경로에서 patient_id 가져오기
    const [patientId, setPatientId] = useState<string | null>(null); // params.patient_id는 string 또는 string[] 일 수 있음

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

    const [patientData, setPatientData] = useState<Partial<Patient> | null>(null); // 수정할 환자 데이터
    const [isLoadingPatient, setIsLoadingPatient] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- 👇 useEffect를 사용해서 params가 유효할 때 patientId 상태 설정 ---
    useEffect(() => {
        if (params && params.patient_id) {
            // params.patient_id가 string[] (문자열 배열)일 수도 있으므로, 첫 번째 요소 사용 또는 단일 문자열로 처리
            const id = Array.isArray(params.patient_id) ? params.patient_id[0] : params.patient_id;
            setPatientId(id);
        } else if (params) { // params는 있지만 patient_id가 없는 경우 (이론적으로는 잘 없음)
            console.warn("Patient ID not found in params, but params object exists:", params);
            setError("환자 ID를 찾을 수 없습니다.");
        }
        // params가 null이면 아무것도 안 함 (patientId는 null로 유지)
    }, [params]); // params 객체가 변경될 때마다 실행
    // --- 👆 patientId 상태 설정 useEffect 끝 ---

    // 인증 정보 로드
    useEffect(() => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem('authToken');
            const userJson = localStorage.getItem('currentUser');
            if (token && userJson) {
                try {
                    setAuthToken(token);
                    setCurrentUser(JSON.parse(userJson) as User);
                } catch (e) { router.replace('/login'); }
            } else {
                router.replace('/login');
            }
            setIsLoadingAuth(false);
        }
    }, [router]);

    // 수정할 환자 데이터 불러오기
    const loadPatientDetail = useCallback(async () => {
        if (authToken && patientId) {
            setIsLoadingPatient(true);
            const fetchedPatient = await fetchPatientByIdAPI(patientId, authToken);
            if (fetchedPatient) {
                setPatientData({ // 폼에 바인딩할 형태로 변환 (날짜 형식 등 주의)
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
                    // organization_id는 보통 수정하지 않음
                });
            } else {
                setError("환자 정보를 불러오지 못했습니다.");
            }
            setIsLoadingPatient(false);
        }
    }, [authToken, patientId]);

    useEffect(() => {
        if (!isLoadingAuth && authToken) { // 인증 정보 로드 완료 후 실행
            loadPatientDetail();
        }
    }, [isLoadingAuth, authToken, loadPatientDetail]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPatientData(prev => prev ? ({ ...prev, [name]: value }) : null);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!authToken || !patientId || !patientData) return;

        setIsSubmitting(true);
        setError(null);

        // PatientUpdate 스키마에 맞게 전송할 데이터 준비 (patientData에서 필요한 것만)
        const dataToUpdate: Partial<Patient> = { ...patientData };
        // 예를 들어 organization_id는 보내지 않음 (수정 불가 항목)
        // delete dataToUpdate.organization_id; // PatientUpdate 스키마에 없다면 괜찮음

        // 날짜 필드가 빈 문자열이면 null로 변환 (API가 null을 기대한다면)
        if (dataToUpdate.date_of_birth === '') dataToUpdate.date_of_birth = null;
        if (dataToUpdate.registration_date === '') dataToUpdate.registration_date = null;
        if (dataToUpdate.gender === '') dataToUpdate.gender = null;


        const updatedPatient = await updatePatientAPI(patientId, dataToUpdate, authToken);

        if (updatedPatient) {
            alert('환자 정보가 성공적으로 수정되었습니다!');
            router.push('/patients'); // 환자 관리 목록으로 돌아가기
        } else {
            // updatePatientAPI 내부에서 alert를 띄웠을 수 있음
            // setError('환자 정보 수정에 실패했습니다.'); // 중복 알림 가능성
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
                    {/* --- 환자 코드 (보통 수정 불가, 읽기 전용) --- */}
                    <div>
                        <label htmlFor="patient_code" className="block text-sm font-medium text-gray-700">환자 코드</label>
                        <input type="text" name="patient_code" id="patient_code" value={patientData.patient_code || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100" readOnly />
                    </div>

                    {/* --- 이름 --- */}
                    <div>
                        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">이름 <span className="text-red-500">*</span></label>
                        <input type="text" name="full_name" id="full_name" value={patientData.full_name || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>

                    {/* --- 생년월일, 성별 (AddPatientPage와 동일한 폼 구조 사용) --- */}
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

                    {/* --- 주소 --- */}
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">주소</label>
                        <input type="text" name="address" id="address" value={patientData.address || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>

                    {/* --- 연락처, 비상 연락처 --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700">연락처</label>
                            <input type="tel" name="contact_number" id="contact_number" value={patientData.contact_number || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                        <div>
                            {/* 연락처2 같은 추가 필드 자리 */}
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

                    {/* --- 의료 특이사항 --- */}
                    <div>
                        <label htmlFor="medical_notes" className="block text-sm font-medium text-gray-700">의료 특이사항</label>
                        <textarea name="medical_notes" id="medical_notes" rows={3} value={patientData.medical_notes || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>

                    {/* --- 환자 상태, 등록일 --- */}
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
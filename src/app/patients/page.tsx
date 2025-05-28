// src/app/patients/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MyCustomLayout from '@/components/Layout'; // 공통 레이아웃
import StatusUpdateModal from '@/components/StatusUpdateModal';
import { PatientStatus } from '@/types/enums';
import type { Patient, User } from '@/types'; // 공통 타입 import
// import { initialPatients as mockPatientData } from '@/lib/mockData'; // 목업 데이터는 이제 여기서 직접 사용 안 함

// 아이콘 사용을 위해 (예시)
import { RiEdit2Line, RiDeleteBinLine, RiToggleLine, RiEyeLine, RiRefreshLine, RiUserAddLine } from '@remixicon/react';

// 데이터를 FastAPI 백엔드에서 가져오는 함수 (page.tsx에 있던 것과 유사하게)
async function fetchPatientsForAdmin(token: string | null, organizationId: number | undefined): Promise<Patient[]> {
    if (!token || organizationId === undefined) {
        console.warn("인증 토큰 또는 기관 ID가 없어 환자 목록을 가져올 수 없습니다.");
        return [];
    }

    // !!! 중요 !!!: 실제 FastAPI 환자 목록 API 엔드포인트 주소로 변경!
    // 이 API는 특정 기관의 모든 환자 정보를 가져와야 함.
    const API_URL = `http://127.0.0.1:8000/api/v1/patients/?organization_id=${organizationId}`; // 예시

    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error("환자 관리 목록 API 요청 실패:", response.status, await response.text());
            return [];
        }
        const data = await response.json();
        console.log("API로부터 받아온 환자 관리 목록:", data);
        // API 응답과 Patient 타입 매핑 (page.tsx의 fetchAllPatientsFromAPI 함수 참고)
        return (data as any[]).map((item: any) => ({
            patient_id: item.patient_id,
            full_name: item.full_name,
            age: item.age, // API 응답에 age가 없다면 계산 또는 기본값
            room: item.room || "N/A", // API 응답에 room이 없다면 기본값
            risk: item.risk || "low",
            heartRate: item.current_heart_rate ?? null,
            temperature: item.current_temperature ?? null,
            fallStatus: item.current_fall_status ?? null,
            lastUpdated: item.lastUpdated || item.updated_at || "N/A",
            heartRateHistory: Array.isArray(item.heart_rate_history) ? item.heart_rate_history : [],
            temperatureHistory: Array.isArray(item.temperature_history) ? item.temperature_history : [],
            gyro: item.gyro || { x: 0, y: 0, z: 0 },
            lastMovement: item.lastMovement || "N/A",
            movementPattern: item.movementPattern || "N/A",
            gps: item.gps || { lat: "N/A", long: "N/A", address: "N/A", timestamp: "N/A" },
            organization_id: item.organization_id,
            patient_code: item.patient_code,
            status: item.status || "inactive", // API 응답의 status 필드 사용
            date_of_birth: item.date_of_birth,
            gender: item.gender,
            address: item.address,
            contact_number: item.contact_number,
            emergency_contact: item.emergency_contact,
            emergency_number: item.emergency_number,
            medical_notes: item.medical_notes,
            registration_date: item.registration_date,
            created_at: item.created_at,
            updated_at: item.updated_at,
        })) as Patient[];
    } catch (error) {
        console.error("환자 관리 목록 API 호출 중 오류:", error);
        return [];
    }
}

// --- 👇 환자 삭제 API 호출 함수 추가 ---
async function deletePatientAPI(patientId: number, token: string | null): Promise<boolean> {
    if (!token) {
        console.warn("인증 토큰이 없어 환자를 삭제할 수 없습니다.");
        return false;
    }

    // !!! 중요 !!!: 실제 FastAPI 환자 삭제 API 엔드포인트 주소로 변경!
    const DELETE_PATIENT_API_URL = `http://127.0.0.1:8000/api/v1/patients/${patientId}`;

    try {
        console.log(`Deleting patient ID ${patientId} via API: ${DELETE_PATIENT_API_URL}`);
        const response = await fetch(DELETE_PATIENT_API_URL, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.status === 204) { // 성공적으로 삭제 (No Content)
            console.log(`환자 ID ${patientId} 삭제 성공.`);
            return true;
        } else if (response.ok) { // 200, 202 등 다른 성공 코드도 일단 성공으로 간주
            console.log(`환자 ID ${patientId} 삭제 요청 성공 (상태 코드: ${response.status}).`);
            return true;
        }
        else {
            const errorData = await response.json().catch(() => ({ detail: "알 수 없는 오류 발생" })); // JSON 파싱 실패 대비
            console.error("환자 삭제 API 요청 실패:", response.status, errorData);
            alert(`환자 삭제에 실패했습니다: ${errorData.detail || response.statusText}`);
            return false;
        }
    } catch (error) {
        console.error("환자 삭제 API 호출 중 네트워크 또는 기타 오류:", error);
        alert('환자 삭제 중 오류가 발생했습니다. 네트워크를 확인해주세요.');
        return false;
    }
}
// --- 👆 환자 삭제 API 호출 함수 추가 끝 ---

// --- 👇 환자 상태 변경 API 호출 함수 추가 ---
async function updatePatientStatusAPI(
    patientId: number,
    newStatus: PatientStatus, // Enum 타입 사용
    token: string | null
): Promise<Patient | null> { // 업데이트된 환자 정보를 반환하거나, 성공 여부만 반환할 수도 있음
    if (!token) {
        console.warn("인증 토큰이 없어 환자 상태를 변경할 수 없습니다.");
        return null;
    }

    // !!! 중요 !!!: 실제 FastAPI 환자 상태 변경 API 엔드포인트 주소로 변경!
    // 예시: PATCH /api/v1/patients/{patient_id}/status 또는 PUT /api/v1/patients/{patient_id}
    const UPDATE_STATUS_API_URL = `http://127.0.0.1:8000/api/v1/patients/${patientId}`; // 예시 (PUT으로 전체 업데이트 가정)
    // 또는 `/${patientId}/status` (PATCH로 부분 업데이트)

    try {
        console.log(`Updating patient ID ${patientId} status to ${newStatus} via API: ${UPDATE_STATUS_API_URL}`);
        const response = await fetch(UPDATE_STATUS_API_URL, {
            method: 'PUT', // 또는 'PATCH' (API 설계에 따라)
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }), // PatientUpdate 스키마에 status 필드가 있다고 가정
        });

        if (response.ok) { // 성공 (200 OK, 202 Accepted 등)
            const updatedPatientData = await response.json();
            console.log(`환자 ID ${patientId} 상태 변경 성공. 응답:`, updatedPatientData);
            return updatedPatientData as Patient; // 업데이트된 환자 정보 반환
        } else {
            const errorData = await response.json().catch(() => ({ detail: "상태 변경 실패" }));
            console.error("환자 상태 변경 API 요청 실패:", response.status, errorData);
            alert(`환자 상태 변경에 실패했습니다: ${errorData.detail || response.statusText}`);
            return null;
        }
    } catch (error) {
        console.error("환자 상태 변경 API 호출 중 네트워크 또는 기타 오류:", error);
        alert('환자 상태 변경 중 오류가 발생했습니다. 네트워크를 확인해주세요.');
        return null;
    }
}
// --- 👆 환자 상태 변경 API 호출 함수 추가 끝 ---


export default function PatientManagementPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authToken, setAuthToken] = useState<string | null>(null);

    // --- 👇 모달 제어용 상태 추가 ---
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedPatientForStatusUpdate, setSelectedPatientForStatusUpdate] = useState<Patient | null>(null);
    // --- 👆 모달 제어용 상태 추가 끝 ---

    // 검색 및 필터링을 위한 상태 (선택 사항)
    const [searchTerm, setSearchTerm] = useState('');
    // const [statusFilter, setStatusFilter] = useState<Patient['status'] | 'all'>('all');

    // 인증 상태 및 사용자 정보 로드 (메인 페이지와 유사한 로직)
    useEffect(() => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem('authToken');
            const userJson = localStorage.getItem('currentUser');
            if (token && userJson) {
                try {
                    setAuthToken(token);
                    setCurrentUser(JSON.parse(userJson) as User);
                } catch (e) {
                    console.error("사용자 정보 파싱 오류:", e);
                    localStorage.clear();
                    router.replace('/login');
                }
            } else {
                router.replace('/login'); // 인증 정보 없으면 로그인 페이지로
            }
        }
    }, [router]);

    // 환자 데이터 로드
    useEffect(() => {
        const loadData = async () => {
            if (currentUser && authToken && currentUser.organization?.id) {
                setIsLoading(true);
                const fetchedPatients = await fetchPatientsForAdmin(authToken, currentUser.organization.id);
                setPatients(fetchedPatients);
                setIsLoading(false);
            } else if (currentUser && !currentUser.organization?.id) {
                console.warn("현재 사용자에게 소속 기관 정보가 없습니다.");
                setIsLoading(false);
                setPatients([]); // 기관 정보 없으면 빈 목록
            }
        };

        if (isAuthenticated()) { // 인증된 경우에만 데이터 로드
            loadData();
        } else if (typeof window !== "undefined" && !localStorage.getItem('authToken')) {
            // useEffect에서 router.replace가 비동기일 수 있으므로,
            // localStorage를 한번 더 체크해서 로딩 상태를 빨리 끝낼 수 있음
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, authToken]); // currentUser, authToken 변경 시 데이터 다시 로드

    // --- 환자 상태 변경 핸들러 함수 (모달에서 호출될 함수) ---
    const handleConfirmStatusUpdate = async (patientId: number, newStatus: PatientStatus) => {
        const updatedPatient = await updatePatientStatusAPI(patientId, newStatus, authToken);
        if (updatedPatient) {
            setPatients(prevPatients =>
                prevPatients.map(p => (p.patient_id === patientId ? updatedPatient : p))
            );
            alert(`환자 ID ${patientId}의 상태가 ${newStatus}(으)로 성공적으로 변경되었습니다.`);
        }
        // API 호출 실패 시의 alert는 updatePatientStatusAPI 함수 내부에서 처리한다고 가정
    };

    // 간단한 인증 확인 함수 (실제 앱에서는 더 견고한 Context나 라이브러리 사용)
    const isAuthenticated = () => {
        if (typeof window !== "undefined") {
            return !!localStorage.getItem('authToken');
        }
        return false;
    };

    // 로그아웃 핸들러 (MyCustomLayout이나 Navbar로 옮기는 것이 좋음)
    const handleLogout = () => {
        if (typeof window !== "undefined") {
            localStorage.clear();
        }
        router.replace('/login');
    };

    // --- 👇 환자 삭제 핸들러 함수 ---
    const handleDeletePatient = async (patientId: number) => {
        // 사용자에게 정말 삭제할 것인지 확인
        if (window.confirm(`정말로 ID ${patientId} 환자 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
            const success = await deletePatientAPI(patientId, authToken);
            if (success) {
                // 삭제 성공 시, 화면의 환자 목록에서 해당 환자 제거
                setPatients(prevPatients => prevPatients.filter(p => p.patient_id !== patientId));
                alert(`환자 ID ${patientId} 정보가 삭제되었습니다.`);
            }
            // 실패 시에는 deletePatientAPI 함수 내부에서 이미 alert를 띄웠거나 콘솔에 로그를 남김
        }
    };
    // --- 👆 환자 삭제 핸들러 함수 끝 ---

    const handleEditEmergencyContact = (patientId: number) => { // patientId 타입을 number로 (Patient 타입에 맞게)
        console.log(`환자 ID ${patientId}의 정보 수정 페이지로 이동합니다.`);
        router.push(`/patients/${patientId}/edit`); // 👈 이 부분이 핵심!
    };


    // 필터링된 환자 목록 (선택 사항)
    const filteredPatients = useMemo(() => {
        return patients.filter(patient =>
            (patient.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) // patient.full_name이 null일 수 있으므로
            // && (statusFilter === 'all' || patient.status === statusFilter)
        );
    }, [patients, searchTerm /*, statusFilter */]);

    // --- 👇 환자 상태 변경 핸들러 함수 ---
    const handleChangePatientStatus = async (patientId: number, newStatus: PatientStatus) => {
        // Optimistic UI update (선택 사항): API 호출 전에 화면을 먼저 바꾸고, 실패 시 롤백
        // const originalPatients = [...patients];
        // setPatients(prev => prev.map(p => p.patient_id === patientId ? {...p, status: newStatus} : p));

        const updatedPatient = await updatePatientStatusAPI(patientId, newStatus, authToken);

        if (updatedPatient) {
            // API 호출 성공 시, 상태 배열 업데이트
            setPatients(prevPatients =>
                prevPatients.map(p => (p.patient_id === patientId ? updatedPatient : p))
            );
            alert(`환자 ID ${patientId}의 상태가 ${newStatus}(으)로 변경되었습니다.`);
        } else {
            // API 호출 실패 시 (updatePatientStatusAPI 내부에서 이미 alert를 띄웠을 수 있음)
            // Optimistic UI update를 했다면 여기서 롤백
            // setPatients(originalPatients);
            // alert('환자 상태 변경에 실패했습니다.'); // 중복 알림이 될 수 있으니 API 함수와 조율
        }
    };
    // --- 👆 환자 상태 변경 핸들러 함수 끝 ---

    // --- "상태 변경" 버튼 클릭 시 모달 여는 함수 ---
    const openStatusUpdateModal = (patient: Patient) => {
        setSelectedPatientForStatusUpdate(patient);
        setIsStatusModalOpen(true);
    };


    if (!isAuthenticated() && typeof window !== "undefined" && window.location.pathname !== '/login') {
        // useEffect에서 redirect 하므로, 이 부분은 거의 보이지 않거나 짧게 보임
        return <div className="flex items-center justify-center min-h-screen">로그인 페이지로 이동 중...</div>;
    }
    if (!currentUser) { // currentUser가 로드되기 전 또는 인증 실패 시
        return <div className="flex items-center justify-center min-h-screen">사용자 정보를 불러오는 중...</div>;
    }

    return (
        <MyCustomLayout currentUser={currentUser}>
            <div className="p-6 mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">환자 관리</h1>
                    <div>
                        <button
                            onClick={async () => { // 새로고침 버튼
                                if (currentUser && authToken && currentUser.organization?.id) {
                                    setIsLoading(true);
                                    const fetchedPatients = await fetchPatientsForAdmin(authToken, currentUser.organization.id);
                                    setPatients(fetchedPatients);
                                    setIsLoading(false);
                                }
                            }}
                            className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                        >
                            <RiRefreshLine className="inline-block mr-1" /> 새로고침
                        </button>
                        <button
                            onClick={() => router.push('/patients/add')} // TODO: 환자 추가 페이지 라우트 (새로 만들어야 함)
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md shadow-sm hover:bg-primary/90"
                        >
                            <RiUserAddLine className="inline-block mr-1" /> 새 환자 등록
                        </button>
                    </div>
                </div>

                {/* 검색 및 필터 UI (선택 사항) */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="환자 이름으로 검색..."
                        className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {/*
          <select
            className="ml-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Patient['status'] | 'all')}
          >
            <option value="all">모든 상태</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="discharged">Discharged</option>
          </select>
          */}
                </div>

                {isLoading ? (
                    <p>환자 목록을 불러오는 중입니다...</p>
                ) : filteredPatients.length === 0 ? (
                    <p>관리할 환자가 없습니다. 새 환자를 등록해주세요.</p>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-lg shadow">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</th> */}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">환자 코드</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비상 연락처</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredPatients.map((patient) => (
                                    <tr key={patient.patient_id}>
                                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.patient_id}</td> */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.patient_code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{patient.full_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {/* TODO: 상태 변경 UI (예: 드롭다운) */}

                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${patient.status === 'active' ? 'bg-green-100 text-green-800' :
                                                patient.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                                                    patient.status === 'discharged' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {patient.status || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.emergency_contact || 'N/A'} / {patient.emergency_number || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            {/* <button onClick={() => router.push(`/patient-detail/${patient.patient_id}`)} className="text-indigo-600 hover:text-indigo-900" title="상세보기">
                                                <RiEyeLine size={18} />
                                            </button> */}
                                            <button onClick={() => openStatusUpdateModal(patient)} className="text-blue-600 hover:text-blue-900" title="상태 변경">
                                                <RiToggleLine size={18} />
                                            </button>
                                            <button onClick={() => handleEditEmergencyContact(patient.patient_id)} className="text-yellow-600 hover:text-yellow-900" title="정보 수정">
                                                <RiEdit2Line size={18} />
                                            </button>
                                            {/* 👇 삭제 버튼에 handleDeletePatient 함수 연결! */}
                                            <button onClick={() => handleDeletePatient(patient.patient_id)} className="text-red-600 hover:text-red-900" title="삭제">
                                                <RiDeleteBinLine size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <StatusUpdateModal
                    isOpen={isStatusModalOpen}
                    onClose={() => setIsStatusModalOpen(false)}
                    patient={selectedPatientForStatusUpdate}
                    onStatusUpdate={handleConfirmStatusUpdate}
                />
            </div>
        </MyCustomLayout>
    );
}
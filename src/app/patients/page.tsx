// src/app/patients/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MyCustomLayout from '@/components/Layout';
import StatusUpdateModal from '@/components/StatusUpdateModal';
import { PatientStatus } from '@/types/enums';
import type { Patient, CurrentUser, UserProfile } from '@/types'; // User -> CurrentUser, UserProfile
// 아이콘 사용을 위해
import { RiEdit2Line, RiDeleteBinLine, RiToggleLine, RiRefreshLine, RiUserAddLine } from '@remixicon/react';

// 데이터를 FastAPI 백엔드에서 가져오는 함수 (page.tsx에 있던 것과 유사하게)
async function fetchPatientsForAdmin(token: string | null, organizationId: number | undefined): Promise<Patient[]> {
    if (!token || organizationId === undefined) {
        console.warn("인증 토큰 또는 기관 ID가 없어 환자 목록을 가져올 수 없습니다.");
        return [];
    }

    const BASE_API_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';
    const API_URL = `${BASE_API_URL}/api/v1/patients/?organization_id=${organizationId}`;

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
        return (data as any[]).map((item: any) => ({
            patient_id: item.patient_id,
            full_name: item.full_name,
            age: item.age,
            room: item.room || "N/A",
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
            status: item.status || "inactive",
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

async function deletePatientAPI(patientId: number, token: string | null): Promise<boolean> {
    if (!token) {
        console.warn("인증 토큰이 없어 환자를 삭제할 수 없습니다.");
        return false;
    }

    const BASE_API_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';
    const DELETE_PATIENT_API_URL = `${BASE_API_URL}/api/v1/patients/${patientId}`;

    try {
        console.log(`Deleting patient ID ${patientId} via API: ${DELETE_PATIENT_API_URL}`);
        const response = await fetch(DELETE_PATIENT_API_URL, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.status === 204) {
            console.log(`환자 ID ${patientId} 삭제 성공.`);
            return true;
        } else if (response.ok) {
            console.log(`환자 ID ${patientId} 삭제 요청 성공 (상태 코드: ${response.status}).`);
            return true;
        }
        else {
            const errorData = await response.json().catch(() => ({ detail: "알 수 없는 오류 발생" }));
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

async function updatePatientStatusAPI(
    patientId: number,
    newStatus: PatientStatus,
    token: string | null
): Promise<Patient | null> {
    if (!token) {
        console.warn("인증 토큰이 없어 환자 상태를 변경할 수 없습니다.");
        return null;
    }

    const BASE_API_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';
    const UPDATE_STATUS_API_URL = `${BASE_API_URL}/api/v1/patients/${patientId}`;

    try {
        console.log(`Updating patient ID ${patientId} status to ${newStatus} via API: ${UPDATE_STATUS_API_URL}`);
        const response = await fetch(UPDATE_STATUS_API_URL, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
            const updatedPatientData = await response.json();
            console.log(`환자 ID ${patientId} 상태 변경 성공. 응답:`, updatedPatientData);
            return updatedPatientData as Patient;
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


export default function PatientManagementPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null); // User -> CurrentUser
    const [authToken, setAuthToken] = useState<string | null>(null);

    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedPatientForStatusUpdate, setSelectedPatientForStatusUpdate] = useState<Patient | null>(null);

    const [searchTerm, setSearchTerm] = useState('');

    // 인증 상태 및 사용자 정보 로드 (메인 페이지와 유사한 로직)
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
                    localStorage.clear();
                    router.replace('/login');
                }
            } else {
                localStorage.clear(); // 토큰이나 유저 정보가 없으면 정리
                router.replace('/login');
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
                setPatients([]);
            } else {
                // currentUser나 authToken이 아직 로드되지 않았으면 대기
                setIsLoading(true);
            }
        };

        if (authToken) { // authToken이 존재할 때만 데이터 로드를 시도
            loadData();
        } else if (!isLoading) { // authToken이 없는데, 로딩 상태가 아니면 (인증 실패로 간주하고)
            // 이미 useEffect 위에서 router.replace('/login')을 호출했을 가능성 있음
            // 또는 초기 로드 중인 경우 (isLoading이 true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, authToken]);

    const handleConfirmStatusUpdate = async (patientId: number, newStatus: PatientStatus) => {
        const updatedPatient = await updatePatientStatusAPI(patientId, newStatus, authToken);
        if (updatedPatient) {
            setPatients(prevPatients =>
                prevPatients.map(p => (p.patient_id === patientId ? updatedPatient : p))
            );
            alert(`환자 ID ${patientId}의 상태가 ${newStatus}(으)로 성공적으로 변경되었습니다.`);
        }
    };

    const isAuthenticated = () => {
        if (typeof window !== "undefined") {
            return !!localStorage.getItem('authToken');
        }
        return false;
    };

    const handleLogout = () => {
        if (typeof window !== "undefined") {
            localStorage.clear();
        }
        router.replace('/login');
    };

    const handleDeletePatient = async (patientId: number) => {
        if (window.confirm(`정말로 ID ${patientId} 환자 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
            const success = await deletePatientAPI(patientId, authToken);
            if (success) {
                setPatients(prevPatients => prevPatients.filter(p => p.patient_id !== patientId));
                alert(`환자 ID ${patientId} 정보가 삭제되었습니다.`);
            }
        }
    };

    const handleEditEmergencyContact = (patientId: number) => {
        console.log(`환자 ID ${patientId}의 정보 수정 페이지로 이동합니다.`);
        router.push(`/patients/${patientId}/edit`);
    };

    const filteredPatients = useMemo(() => {
        return patients.filter(patient =>
            (patient.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [patients, searchTerm]);

    const openStatusUpdateModal = (patient: Patient) => {
        setSelectedPatientForStatusUpdate(patient);
        setIsStatusModalOpen(true);
    };


    if (!isAuthenticated() && typeof window !== "undefined" && window.location.pathname !== '/login') {
        return <div className="flex items-center justify-center min-h-screen">로그인 페이지로 이동 중...</div>;
    }
    if (!currentUser) {
        return <div className="flex items-center justify-center min-h-screen">사용자 정보를 불러오는 중...</div>;
    }

    return (
        <MyCustomLayout currentUser={currentUser}>
            <div className="p-6 mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">환자 관리</h1>
                    <div>
                        <button
                            onClick={async () => {
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
                            onClick={() => router.push('/patients/add')}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md shadow-sm hover:bg-primary/90"
                        >
                            <RiUserAddLine className="inline-block mr-1" /> 새 환자 등록
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="환자 이름으로 검색..."
                        className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.patient_code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{patient.full_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${patient.status === 'active' ? 'bg-green-100 text-green-800' :
                                                patient.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                                                    patient.status === 'discharged' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {patient.status || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.emergency_contact || 'N/A'} / {patient.emergency_number || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button onClick={() => openStatusUpdateModal(patient)} className="text-blue-600 hover:text-blue-900" title="상태 변경">
                                                <RiToggleLine size={18} />
                                            </button>
                                            <button onClick={() => handleEditEmergencyContact(patient.patient_id)} className="text-yellow-600 hover:text-yellow-900" title="정보 수정">
                                                <RiEdit2Line size={18} />
                                            </button>
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
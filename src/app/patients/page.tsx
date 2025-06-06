// src/app/patients/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MyCustomLayout from '@/components/Layout';
import StatusUpdateModal from '@/components/StatusUpdateModal';
import { PatientStatus } from '@/types/enums';
import type { Patient, UserProfile } from '@/types';
import { RiEdit2Line, RiDeleteBinLine, RiToggleLine, RiEyeLine, RiRefreshLine, RiUserAddLine } from '@remixicon/react';

// ✨ 새로 만든 api.ts 파일에서 환자 관련 API 함수들을 import
import { fetchPatients, deletePatient, updatePatient, PatientUpdateData } from '@/lib/api';

export default function PatientManagementPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [authToken, setAuthToken] = useState<string | null>(null);

    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedPatientForStatusUpdate, setSelectedPatientForStatusUpdate] = useState<Patient | null>(null);

    const [searchTerm, setSearchTerm] = useState('');

    // 인증 정보 로드 (기존 로직 유지)
    useEffect(() => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem('authToken');
            const userJson = localStorage.getItem('currentUser');
            if (token && userJson) {
                try {
                    setAuthToken(token);
                    setCurrentUser(JSON.parse(userJson) as UserProfile);
                } catch (e) {
                    console.error("사용자 정보 파싱 오류:", e);
                    localStorage.clear();
                    router.replace('/login');
                }
            } else {
                router.replace('/login');
            }
        }
    }, [router]);

    // 환자 목록 로드
    useEffect(() => {
        const loadData = async () => {
            if (currentUser && authToken && currentUser.organization?.id) {
                setIsLoading(true);
                // api.ts의 fetchPatients 사용
                const fetchedPatients = await fetchPatients(authToken, currentUser.organization.id, router); // ✨ 변경된 부분!
                setPatients(fetchedPatients);
                setIsLoading(false);
            } else if (currentUser && !currentUser.organization?.id) {
                console.warn("현재 사용자에게 소속 기관 정보가 없습니다.");
                setIsLoading(false);
                setPatients([]);
            }
        };

        if (currentUser && authToken) {
            loadData();
        } else if (!currentUser && typeof window !== "undefined" && !localStorage.getItem('authToken')) {
            setIsLoading(false);
        }
    }, [currentUser, authToken, router]);

    const handleConfirmStatusUpdate = async (patientId: number, newStatus: PatientStatus) => {
        // api.ts의 updatePatient 사용
        // Partial<Patient> 타입에 맞게 데이터 준비
        const updateData: PatientUpdateData = { status: newStatus }; // ✨ 변경된 부분!
        try {
            const updatedPatient = await updatePatient(patientId, updateData, authToken!, router); // ✨ 변경된 부분!
            setPatients(prevPatients =>
                prevPatients.map(p => (p.patient_id === patientId ? updatedPatient : p))
            );
            alert(`환자 ID ${patientId}의 상태가 ${newStatus}(으)로 성공적으로 변경되었습니다.`);
        } catch (error: any) {
            alert(`환자 상태 변경에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
        }
    };

    const handleDeletePatient = async (patientId: number) => {
        if (window.confirm(`정말로 ID ${patientId} 환자 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
            try {
                // api.ts의 deletePatient 사용
                const success = await deletePatient(patientId, authToken!, router); // ✨ 변경된 부분!
                if (success) {
                    setPatients(prevPatients => prevPatients.filter(p => p.patient_id !== patientId));
                    alert(`환자 ID ${patientId} 정보가 삭제되었습니다.`);
                }
            } catch (error: any) {
                alert(`환자 삭제에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
            }
        }
    };

    const handleEditEmergencyContact = (patientId: number) => {
        console.log(`환자 ID ${patientId}의 정보 수정 페이지로 이동합니다.`);
        router.push(`/patients/${patientId}/edit`);
    };

    // 검색 필터링 로직 (기존 로직 유지)
    const filteredPatients = useMemo(() => {
        return patients.filter(patient =>
            (patient.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [patients, searchTerm]);

    const openStatusUpdateModal = (patient: Patient) => {
        setSelectedPatientForStatusUpdate(patient);
        setIsStatusModalOpen(true);
    };

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
                                    // api.ts의 fetchPatients 사용
                                    const fetchedPatients = await fetchPatients(authToken, currentUser.organization.id, router); // ✨ 변경된 부분!
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
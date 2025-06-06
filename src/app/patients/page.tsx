// src/app/patients/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MyCustomLayout from '@/components/Layout';
import StatusUpdateModal from '@/components/StatusUpdateModal';
import { PatientStatus } from '@/types/enums';
import type { Patient, UserProfile } from '@/types';
import { RiEdit2Line, RiDeleteBinLine, RiToggleLine, RiEyeLine, RiRefreshLine, RiUserAddLine } from '@remixicon/react';

import { fetchPatients, deletePatient, updatePatient, PatientUpdateData } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth'; // useAuth 훅 import

export default function PatientManagementPage() {
    const router = useRouter();
    const { currentUser, isLoadingAuth, authToken } = useAuth(); // useAuth 훅 사용!

    const [patients, setPatients] = useState<Patient[]>([]);// API에서 불러온 전체 환자 목록
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedPatientForStatusUpdate, setSelectedPatientForStatusUpdate] = useState<Patient | null>(null);

    const [searchTerm, setSearchTerm] = useState('');

    // 환자 목록 로드
    useEffect(() => {
        const loadData = async () => {
            if (!currentUser?.organization?.id || !authToken) { // currentUser.organization.id가 없을 경우 로딩 중단
                setIsLoading(false);
                setPatients([]); // 환자 목록 비우기
                return;
            }

            setIsLoading(true);
            try {
                const fetchedPatients = await fetchPatients(authToken, currentUser.organization.id, router);
                setPatients(fetchedPatients);
            } catch (error) {
                console.error("환자 목록 로딩 중 오류:", error);
                // useAuth에서 Unauthorized 에러는 리다이렉트 처리하므로, 여기서는 네트워크/기타 오류만 처리
                alert(`환자 목록을 불러오는 데 실패했습니다: ${(error as Error).message || '알 수 없는 오류'}`);
                setPatients([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (!isLoadingAuth && currentUser) { // 인증 로딩이 끝나고 currentUser가 있을 때만 데이터 로드
            loadData();
        } else if (!isLoadingAuth && !currentUser) {
            router.replace('/login'); // 인증되지 않은 경우 로그인 페이지로 리다이렉트
        }
    }, [currentUser, authToken, isLoadingAuth, router]); // isLoadingAuth를 의존성 배열에 추가

    const handleConfirmStatusUpdate = async (patientId: number, newStatus: PatientStatus) => {
        if (!authToken) {
            alert("인증 정보가 없습니다. 다시 로그인해주세요.");
            return;
        }
        const updateData: PatientUpdateData = { status: newStatus };
        try {
            const updatedPatient = await updatePatient(patientId, updateData, authToken, router);
            setPatients(prevPatients =>
                prevPatients.map(p => (p.patient_id === patientId ? updatedPatient : p))
            );
            alert(`환자 ID ${patientId}의 상태가 ${newStatus}(으)로 성공적으로 변경되었습니다.`);
        } catch (error: any) {
            alert(`환자 상태 변경에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
        }
    };

    const handleDeletePatient = async (patientId: number) => {
        if (!authToken) {
            alert("인증 정보가 없습니다. 다시 로그인해주세요.");
            return;
        }
        if (window.confirm(`정말로 ID ${patientId} 환자 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
            try {
                const success = await deletePatient(patientId, authToken, router);
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

    const handleRefreshPatients = async () => {
        if (currentUser && authToken && currentUser.organization?.id) {
            setIsLoading(true);
            try {
                const fetchedPatients = await fetchPatients(authToken, currentUser.organization.id, router);
                setPatients(fetchedPatients);
            } catch (error) {
                console.error("환자 목록 새로고침 중 오류:", error);
                alert(`환자 목록 새로고침 실패: ${(error as Error).message || '알 수 없는 오류'}`);
            } finally {
                setIsLoading(false);
            }
        }
    };


    const filteredPatients = useMemo(() => {
        return patients.filter(patient =>
            (patient.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (patient.patient_code?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [patients, searchTerm]);

    const openStatusUpdateModal = (patient: Patient) => {
        setSelectedPatientForStatusUpdate(patient);
        setIsStatusModalOpen(true);
    };

    if (isLoadingAuth || !currentUser) { // 인증 로딩 중이거나 사용자 정보가 없으면 로딩 화면
        return <div className="flex items-center justify-center min-h-screen">사용자 정보를 불러오는 중...</div>;
    }

    return (
        <MyCustomLayout currentUser={currentUser}>
            <div className="p-6 mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">환자 관리</h1>
                    <div>
                        <button
                            onClick={handleRefreshPatients}
                            className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                            disabled={isLoading}
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
                        placeholder="환자 이름 또는 코드로 검색..."
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
                                                    patient.status === 'archived' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
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
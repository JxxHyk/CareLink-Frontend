// src/app/patients/[patient_id]/edit/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import MyCustomLayout from '@/components/Layout';
import type { Patient, UserProfile } from '@/types';
import { Gender, PatientStatus } from '@/types/enums';
import { fetchPatientById, updatePatient, PatientUpdateData } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth'; // useAuth 훅 import

export default function EditPatientPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = Array.isArray(params.patient_id) ? params.patient_id[0] : params.patient_id;

    const { currentUser, isLoadingAuth, authToken } = useAuth(); // useAuth 훅 사용!

    const [patientData, setPatientData] = useState<Partial<Patient> | null>(null);
    const [isLoadingPatient, setIsLoadingPatient] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadPatientDetail = useCallback(async () => {
        if (!authToken || !patientId) {
            setError("인증 정보 또는 환자 ID가 누락되었습니다.");
            setIsLoadingPatient(false);
            return;
        }
        setIsLoadingPatient(true);
        try {
            const fetchedPatient = await fetchPatientById(parseInt(patientId, 10), authToken, router);
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
        } catch (err: any) {
            setError(err.message || "환자 정보를 불러오지 못했습니다.");
        } finally {
            setIsLoadingPatient(false);
        }
    }, [authToken, patientId, router]);

    useEffect(() => {
        if (!isLoadingAuth && currentUser && patientId) {
            loadPatientDetail();
        } else if (!isLoadingAuth && !currentUser) {
            router.replace('/login'); // 인증되지 않은 상태면 로그인 페이지로
        }
    }, [isLoadingAuth, currentUser, patientId, loadPatientDetail, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPatientData(prev => prev ? ({ ...prev, [name]: value }) : null);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!authToken || !patientId || !patientData) {
            setError("필요한 정보가 누락되었습니다.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const dataToUpdate: PatientUpdateData = { ...patientData };
        if (dataToUpdate.date_of_birth === '') dataToUpdate.date_of_birth = null;
        if (dataToUpdate.registration_date === '') dataToUpdate.registration_date = null;
        if (dataToUpdate.gender === '') dataToUpdate.gender = null;
        if (dataToUpdate.address === '') dataToUpdate.address = null;
        if (dataToUpdate.contact_number === '') dataToUpdate.contact_number = null;
        if (dataToUpdate.emergency_contact === '') dataToUpdate.emergency_contact = null;
        if (dataToUpdate.emergency_number === '') dataToUpdate.emergency_number = null;
        if (dataToUpdate.medical_notes === '') dataToUpdate.medical_notes = null;

        try {
            const updatedPatient = await updatePatient(parseInt(patientId, 10), dataToUpdate, authToken, router);
            if (updatedPatient) {
                alert('환자 정보가 성공적으로 수정되었습니다!');
                router.push('/patients');
            }
        } catch (err: any) {
            setError(err.message || '정보 수정 중 오류 발생');
        } finally {
            setIsSubmitting(false);
        }
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
                                <option value={PatientStatus.ARCHIVED}>Archived</option>
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
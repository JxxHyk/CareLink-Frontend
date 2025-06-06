// src/app/patients/add/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MyCustomLayout from '@/components/Layout';
import type { CurrentUser, UserProfile } from '@/types';
import { Gender, PatientStatus, UserType } from '@/types/enums';

// 새로 만든 api.ts 파일에서 addPatient 함수를 import
import { addPatient } from '@/lib/api';

// PatientCreate Pydantic 스키마와 유사하게 입력 데이터 타입을 정의
interface PatientFormData {
  patient_code: string;
  full_name: string;
  organization_id: number;
  date_of_birth: string | null;
  gender: Gender | '' | null;
  address: string | null;
  contact_number: string | null;
  emergency_contact: string | null;
  emergency_number: string | null;
  medical_notes: string | null;
  status: PatientStatus | null;
  registration_date: string | null;
}

export default function AddPatientPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  const [formData, setFormData] = useState<PatientFormData>({
    patient_code: '',
    full_name: '',
    organization_id: 0,
    date_of_birth: null,
    gender: null,
    address: null,
    contact_number: null,
    emergency_contact: null,
    emergency_number: null,
    medical_notes: null,
    status: PatientStatus.ACTIVE,
    registration_date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem('authToken');
      const userJson = localStorage.getItem('currentUser');
      if (token && userJson) {
        try {
          const parsedUser = JSON.parse(userJson) as UserProfile;
          setAuthToken(token);
          const appUser: CurrentUser = {
            id: parsedUser.id,
            username: parsedUser.username,
            full_name: parsedUser.full_name,
            email: parsedUser.email,
            phone_number: parsedUser.phone_number,
            user_type: parsedUser.user_type,
            organization_id: parsedUser.organization_id,
            organization: parsedUser.organization,
            created_at: parsedUser.created_at,
            updated_at: parsedUser.updated_at,
            is_superuser: parsedUser.is_superuser,
          };
          setCurrentUser(appUser);
          if (appUser.organization?.id) {
            setFormData(prev => ({ ...prev, organization_id: appUser.organization!.id }));
          } else {
            setError("사용자의 소속 기관 정보를 찾을 수 없습니다. 로그인을 다시 시도해주세요.");
          }
        } catch (e) {
          console.error("사용자 정보 파싱 오류:", e);
          localStorage.clear();
          router.replace('/login');
        }
      } else {
        localStorage.clear();
        router.replace('/login');
      }
      setIsLoadingAuth(false);
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // 계산된 속성 이름 오류 해결: `[name]: value === '' ? null : value` 이 구문은 문제 없음
    // 다른 에러 메시지 (ChangeEventHandler) 해결: HTMLTextAreaElement에는 HTMLInputElement에 있는 일부 속성이 없어 발생하는 문제
    // 이를 해결하기 위해 e.target을 각 타입으로 좁혀서 처리하거나, HTMLInputElement를 사용하지 않는 필드에서만 TextareaHTMLAttributes를 사용하도록 조정해야 해.
    // 여기서는 가장 간단한 해결책으로, HTMLTextAreaElement만 허용하는 onChange에 맞게 타입을 명시적으로 재정의해볼게.
    // 또는 React.ChangeEvent<HTMLInputElement | HTMLSelectElement> 와 React.ChangeEvent<HTMLTextAreaElement>를 분리해서 처리해야 해.
    setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
  };


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser || !authToken) {
      setError("인증 정보가 유효하지 않습니다. 다시 로그인해주세요.");
      return;
    }
    if (!formData.organization_id) {
        setError("사용자의 소속 기관 ID가 설정되지 않았습니다. 잠시 후 다시 시도해주세요.");
        return;
    }

    setIsSubmitting(true);
    setError(null);

    const patientDataToSubmit = {
        patient_code: formData.patient_code,
        full_name: formData.full_name,
        organization_id: formData.organization_id,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        address: formData.address,
        contact_number: formData.contact_number,
        emergency_contact: formData.emergency_contact,
        emergency_number: formData.emergency_number,
        medical_notes: formData.medical_notes,
        status: formData.status,
        registration_date: formData.registration_date ? new Date(formData.registration_date).toISOString() : null,
    };

    try {
      // api.ts의 addPatient 함수 사용
      // addPatient 함수는 'Patient' 타입에서 Omit된 필드들을 요구하므로,
      // formData에서 해당 필드들을 제외하고 전달 (즉, PatientCreate 스키마에 맞는 데이터만 전달)
      // 타입 캐스팅 'as any'는 임시 방편이므로, 더 정교한 타입 정의가 필요하다면 이 부분을 개선해야 해.
      await addPatient(patientDataToSubmit as any, authToken, router);

      alert('새로운 환자가 성공적으로 등록되었습니다!');
      router.push('/patients');
    } catch (err: any) {
      console.error("환자 등록 API 호출 중 오류:", err);
      setError(err.message || '환자 등록 중 오류가 발생했습니다. 네트워크를 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth || !currentUser) {
    return (
      <MyCustomLayout currentUser={null}>
        <div className="flex items-center justify-center min-h-screen">로딩 중...</div>
      </MyCustomLayout>
    );
  }

  return (
    <MyCustomLayout currentUser={currentUser}>
      <div className="p-6 mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">새 환자 등록</h1>
          <Link href="/patients" className="text-sm text-primary hover:underline">
            환자 목록으로 돌아가기
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="patient_code" className="block text-sm font-medium text-gray-700">환자 코드 <span className="text-red-500">*</span></label>
              <input type="text" name="patient_code" id="patient_code" value={formData.patient_code || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">이름 <span className="text-red-500">*</span></label>
              <input type="text" name="full_name" id="full_name" value={formData.full_name || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">생년월일</label>
              <input type="date" name="date_of_birth" id="date_of_birth" value={formData.date_of_birth || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">성별</label>
              <select name="gender" id="gender" value={formData.gender || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white">
                <option value="">선택하세요</option>
                <option value={Gender.MALE}>남성</option>
                <option value={Gender.FEMALE}>여성</option>
                <option value={Gender.OTHER}>기타</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">주소</label>
            <input type="text" name="address" id="address" value={formData.address || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700">연락처</label>
              <input type="tel" name="contact_number" id="contact_number" value={formData.contact_number || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder="010-1234-5678"/>
            </div>
            <div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700">비상 연락처(이름)</label>
              <input type="text" name="emergency_contact" id="emergency_contact" value={formData.emergency_contact || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
            <div>
              <label htmlFor="emergency_number" className="block text-sm font-medium text-gray-700">비상 연락처(번호)</label>
              <input type="tel" name="emergency_number" id="emergency_number" value={formData.emergency_number || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder="010-xxxx-xxxx"/>
            </div>
          </div>

          <div>
            <label htmlFor="medical_notes" className="block text-sm font-medium text-gray-700">의료 특이사항</label>
            {/* onChange 핸들러 타입 수정 */}
            <textarea
              name="medical_notes"
              id="medical_notes"
              rows={3}
              value={formData.medical_notes || ''}
              onChange={handleChange as React.ChangeEventHandler<HTMLTextAreaElement>} // ✨ 이 부분을 수정할 거야!
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="환자의 주요 질환, 알레르기, 복용 중인 약물 등 특이사항을 기록해주세요."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">환자 상태</label>
              <select name="status" id="status" value={formData.status || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white">
                <option value={PatientStatus.ACTIVE}>Active (활성)</option>
                <option value={PatientStatus.INACTIVE}>Inactive (비활성)</option>
                <option value={PatientStatus.ARCHIVED}>Archived (논리적 삭제)</option>
              </select>
            </div>
            <div>
              <label htmlFor="registration_date" className="block text-sm font-medium text-gray-700">등록일</label>
              <input type="date" name="registration_date" id="registration_date" value={formData.registration_date || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}

          <div className="flex justify-end pt-4">
            <button type="button" onClick={() => router.back()} className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              취소
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
              {isSubmitting ? '등록 중...' : '환자 등록'}
            </button>
          </div>
        </form>
      </div>
    </MyCustomLayout>
  );
}
// src/app/patients/add/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MyCustomLayout from '@/components/Layout'; // 전체 레이아웃 적용
import type { User } from '@/types'; // User 타입은 계속 사용
// Gender, PatientStatus Enum은 types/enums.ts 에서 가져온다고 가정
import { Gender, PatientStatus } from '@/types/enums';

// PatientCreate Pydantic 스키마와 유사하게 입력 데이터 타입을 정의
// 이 타입은 FastAPI의 PatientCreate 스키마와 필드 및 Optional 여부가 일치해야 함!
interface PatientFormData {
  patient_code: string;
  full_name: string;
  organization_id: number; // 로그인한 사용자의 기관 ID로 자동 설정
  date_of_birth?: string;   // YYYY-MM-DD 형식의 문자열
  gender?: Gender | '';     // Gender Enum 또는 빈 문자열
  address?: string;
  contact_number?: string;    // 👈 추가!
  emergency_contact?: string; // 👈 추가!
  emergency_number?: string;  // 👈 추가!
  medical_notes?: string;     // 👈 추가! (긴 텍스트 가능)
  status?: PatientStatus;     // PatientStatus Enum
  registration_date?: string; // YYYY-MM-DD 형식의 문자열
}

export default function AddPatientPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  const [formData, setFormData] = useState<PatientFormData>({
    patient_code: '',
    full_name: '',
    organization_id: 0, // 초기값, useEffect에서 currentUser의 값으로 설정
    date_of_birth: '',
    gender: '', // 초기값 빈 문자열 (선택하세요)
    address: '',
    contact_number: '',    // 👈 초기값 추가
    emergency_contact: '', // 👈 초기값 추가
    emergency_number: '',  // 👈 초기값 추가
    medical_notes: '',     // 👈 초기값 추가
    status: PatientStatus.ACTIVE, // 새 환자 등록 시 기본 상태
    registration_date: new Date().toISOString().split('T')[0], // 오늘 날짜 기본값
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 인증 정보 로드 및 organization_id 설정
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem('authToken');
      const userJson = localStorage.getItem('currentUser');
      if (token && userJson) {
        try {
          const parsedUser = JSON.parse(userJson) as User;
          setAuthToken(token);
          setCurrentUser(parsedUser);
          if (parsedUser.organization?.id) {
            setFormData(prev => ({ ...prev, organization_id: parsedUser.organization!.id }));
          } else {
            setError("사용자의 소속 기관 정보를 찾을 수 없습니다. 로그인을 다시 시도해주세요.");
            // 필요하다면 로그인 페이지로 보내는 등의 추가 처리
          }
        } catch (e) {
          console.error("사용자 정보 파싱 오류:", e);
          router.replace('/login');
        }
      } else {
        router.replace('/login');
      }
      setIsLoadingAuth(false);
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

    const ADD_PATIENT_API_URL = `http://127.0.0.1:8000/api/v1/patients/`; // 실제 API URL 확인!

    // FastAPI의 PatientCreate 스키마에 맞게 데이터 준비
    const patientDataToSubmit = {
        patient_code: formData.patient_code,
        full_name: formData.full_name,
        organization_id: formData.organization_id,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null, // 빈 문자열이면 null
        address: formData.address || null,
        contact_number: formData.contact_number || null,       // 👈 추가
        emergency_contact: formData.emergency_contact || null, // 👈 추가
        emergency_number: formData.emergency_number || null,   // 👈 추가
        medical_notes: formData.medical_notes || null,         // 👈 추가
        status: formData.status || PatientStatus.ACTIVE,
        registration_date: formData.registration_date ? new Date(formData.registration_date).toISOString() : null,
    };

    try {
      const response = await fetch(ADD_PATIENT_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientDataToSubmit),
      });

      if (response.status === 201) { // FastAPI에서 성공 시 보통 201 Created
        alert('새로운 환자가 성공적으로 등록되었습니다!');
        router.push('/patients'); // 환자 관리 목록 페이지로 이동
      } else {
        const errorData = await response.json();
        setError(errorData.detail || `환자 등록에 실패했습니다. (상태 코드: ${response.status})`);
      }
    } catch (err) {
      console.error("환자 등록 API 호출 중 오류:", err);
      setError('환자 등록 중 오류가 발생했습니다. 네트워크를 확인해주세요.');
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
      <div className="p-6 mx-auto"> {/* 폼 전체 너비 조절 가능 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">새 환자 등록</h1>
          <Link href="/patients" className="text-sm text-primary hover:underline">
            환자 목록으로 돌아가기
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
          {/* --- 환자 코드, 이름 --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="patient_code" className="block text-sm font-medium text-gray-700">환자 코드 <span className="text-red-500">*</span></label>
              <input type="text" name="patient_code" id="patient_code" value={formData.patient_code} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">이름 <span className="text-red-500">*</span></label>
              <input type="text" name="full_name" id="full_name" value={formData.full_name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
          </div>

          {/* --- 생년월일, 성별 --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">생년월일</label>
              <input type="date" name="date_of_birth" id="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">성별</label>
              <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white">
                <option value="">선택하세요</option>
                <option value={Gender.MALE}>남성</option>
                <option value={Gender.FEMALE}>여성</option>
                <option value={Gender.OTHER}>기타</option>
              </select>
            </div>
          </div>

          {/* --- 주소 --- */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">주소</label>
            <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
          </div>

          {/* --- 👇 연락처, 비상 연락처 이름, 비상 연락처 번호 필드 추가! --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700">연락처</label>
              <input type="tel" name="contact_number" id="contact_number" value={formData.contact_number} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder="010-1234-5678"/>
            </div>
            <div>
              {/* 이 필드는 지금 없지만, 필요하면 추가 가능 */}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700">비상 연락처(이름)</label>
              <input type="text" name="emergency_contact" id="emergency_contact" value={formData.emergency_contact} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
            <div>
              <label htmlFor="emergency_number" className="block text-sm font-medium text-gray-700">비상 연락처(번호)</label>
              <input type="tel" name="emergency_number" id="emergency_number" value={formData.emergency_number} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder="010-xxxx-xxxx"/>
            </div>
          </div>
          {/* --- 👆 연락처, 비상 연락처 필드 추가 끝 --- */}

          {/* --- 의료 특이사항 (긴 텍스트 입력 가능하도록 textarea 사용) --- */}
          <div>
            <label htmlFor="medical_notes" className="block text-sm font-medium text-gray-700">의료 특이사항</label>
            <textarea
              name="medical_notes"
              id="medical_notes"
              rows={3}
              value={formData.medical_notes}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="환자의 주요 질환, 알레르기, 복용 중인 약물 등 특이사항을 기록해주세요."
            />
          </div>
          {/* --- 의료 특이사항 끝 --- */}


          {/* --- 환자 상태, 등록일 (등록일은 자동 또는 수정 가능하게) --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">환자 상태</label>
              <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white">
                <option value={PatientStatus.ACTIVE}>Active (활성)</option>
                <option value={PatientStatus.INACTIVE}>Inactive (비활성)</option>
                <option value={PatientStatus.DISCHARGED}>Discharged (퇴원/종료)</option>
              </select>
            </div>
            <div>
              <label htmlFor="registration_date" className="block text-sm font-medium text-gray-700">등록일</label>
              <input type="date" name="registration_date" id="registration_date" value={formData.registration_date} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
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
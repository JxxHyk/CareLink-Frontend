// src/components/StatusUpdateModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import type { Patient } from '@/types'; // 공통 타입
import { PatientStatus } from '@/types/enums'; // PatientStatus Enum

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null; // 상태를 변경할 환자 정보
  onStatusUpdate: (patientId: number, newStatus: PatientStatus) => Promise<void>; // 실제 상태 업데이트 함수
}

const StatusUpdateModal = ({ isOpen, onClose, patient, onStatusUpdate }: StatusUpdateModalProps) => {
  const [selectedStatus, setSelectedStatus] = useState<PatientStatus | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 모달이 열릴 때, 현재 환자의 상태를 기본 선택값으로 설정
    if (patient && patient.status) {
      setSelectedStatus(patient.status as PatientStatus); // patient.status가 null이 아니라고 가정
    } else {
      setSelectedStatus(''); // 환자 정보가 없거나 상태가 없으면 초기화
    }
  }, [patient, isOpen]);

  if (!isOpen || !patient) {
    return null; // 모달이 열리지 않았거나 대상 환자가 없으면 아무것도 렌더링 안 함
  }

  const handleSubmit = async () => {
    if (!selectedStatus) {
      alert("새로운 상태를 선택해주세요.");
      return;
    }
    setIsSubmitting(true);
    await onStatusUpdate(patient.patient_id, selectedStatus);
    setIsSubmitting(false);
    onClose(); // 성공 여부와 관계없이 일단 모달을 닫거나, 성공 시에만 닫도록 할 수 있음
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          환자 상태 변경: <span className="text-primary">{patient.full_name}</span> (ID: {patient.patient_id})
        </h3>
        
        <div className="space-y-3 mb-6">
          <p className="text-sm text-gray-600">현재 상태: <strong>{String(patient.status || '정보 없음')}</strong></p>
          <div>
            <label htmlFor="patientStatus" className="block text-sm font-medium text-gray-700 mb-1">
              새로운 상태 선택:
            </label>
            <select
              id="patientStatus"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as PatientStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white"
              disabled={isSubmitting}
            >
              <option value="" disabled>상태를 선택하세요</option>
              {Object.values(PatientStatus).map((statusValue) => (
                <option key={statusValue} value={statusValue}>
                  {statusValue} {/* 필요하다면 한글로 변환 (예: roleDisplayNames처럼) */}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedStatus}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-indigo-700 rounded-md shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? '변경 중...' : '상태 변경 확인'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusUpdateModal;
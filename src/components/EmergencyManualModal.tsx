// src/components/EmergencyManualModal.tsx
"use client";

import React from 'react';

interface EmergencyManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  gpsLocation: string; // 환자 GPS 주소
  contactNumber: string; // 환자 연락처
  emergencyContact: string; // 보호자 성함
  emergencyNumber: string; // 보호자 연락처
  medicalNotes: string; // 의료 특이사항 내용
}

const EmergencyManualModal = ({
  isOpen,
  onClose,
  patientName,
  gpsLocation,
  contactNumber,
  emergencyContact,
  emergencyNumber,
  medicalNotes,
}: EmergencyManualModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-red-600">🚨 환자 응급상황 조치 매뉴얼</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
        <div className="space-y-4 text-gray-700">
          <p className="font-medium text-base">다음 단계를 순서대로 진행하십시오:</p>
          <ul className="list-decimal list-inside space-y-2 bg-red-50 p-4 rounded-md border border-red-100">
            <li>
              <span className="font-semibold">환자 GPS 위치 확인:</span>
              <span className="block ml-5 text-sm text-gray-600">{gpsLocation}</span>
              <span className="block ml-5 text-xs text-gray-500 italic">(GPS 카드를 통해 정확한 위치를 확인하세요.)</span>
            </li>
            <li>
              <span className="font-semibold">환자에게 연락 시도:</span>
              <span className="block ml-5 text-sm text-gray-600">{contactNumber}</span>
            </li>
            <li>
              <span className="font-semibold">보호자에게 연락 시도:</span>
              <span className="block ml-5 text-sm text-gray-600">{emergencyContact} / {emergencyNumber}</span>
            </li>
            <li>
              <span className="font-semibold">112 및 119 신고</span>
              <span className="block ml-5 text-sm text-gray-600">관할 경찰서 및 119 구급대에 즉시 연락하십시오.</span>
            </li>
            <li>
              <span className="font-semibold">특이사항:</span>
              <span className="block ml-5 text-sm text-gray-600">{medicalNotes || '작성된 의료 특이사항이 없습니다.'}</span>
            </li>
          </ul>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md shadow-sm"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyManualModal;
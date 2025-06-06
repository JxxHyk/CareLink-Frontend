// src/components/MedicalNotesModal.tsx
"use client";

import React from 'react';

interface MedicalNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: string; // 의료 특이사항 내용
}

const MedicalNotesModal = ({ isOpen, onClose, notes }: MedicalNotesModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">의료 특이사항</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
        <div className="bg-gray-50 p-4 rounded-md overflow-y-auto max-h-60 mb-4 text-gray-700 text-sm leading-relaxed">
          {notes.split('\n').map((line, index) => ( // 줄바꿈 처리
            <p key={index} className="mb-1">{line}</p>
          ))}
          {notes === '작성된 의료 특이사항이 없습니다.' && (
            <p className="text-gray-400 italic">작성된 의료 특이사항이 없습니다.</p>
          )}
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicalNotesModal;
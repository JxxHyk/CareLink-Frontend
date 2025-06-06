// src/components/PatientList.tsx
import React from 'react';
import PatientListItem from './PatientListItem';
import type { Patient } from '@/types';

interface PatientListProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  selectedPatientId: number | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSort: (criteria: string) => void;
  activeSort: string;
  onRefresh: () => void;
}

const PatientList = ({
  patients,
  onSelectPatient,
  selectedPatientId,
  searchTerm,
  setSearchTerm,
  onSort,
  activeSort,
  onRefresh,
}: PatientListProps) => {

  const sortButtonClass = (criteria: string) =>
    `px-3 py-1.5 text-xs rounded-full whitespace-nowrap ${
      activeSort === criteria
        ? 'bg-primary text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;

  const currentPatients = patients || [];

  return (
    <>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">환자 목록</h2>
          <div className="flex space-x-1">
            <button
              onClick={onRefresh}
              className="px-2 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-button"
            >
              <i className="ri-refresh-line mr-1"></i>새로고침
            </button>
          </div>
        </div>
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="환자 검색..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="ri-search-line text-gray-400"></i>
          </div>
        </div>
        <div className="flex space-x-2 mb-2">
          <button onClick={() => onSort('name')} className={sortButtonClass('name')}><i className="ri-sort-alphabet-line mr-1"></i>이름순</button>
          <button onClick={() => onSort('risk')} className={sortButtonClass('risk')}><i className="ri-alert-line mr-1"></i>위험도순</button>
          <button onClick={() => onSort('heart')} className={sortButtonClass('heart')}><i className="ri-heart-pulse-line mr-1"></i>심박수</button>
          <button onClick={() => onSort('temp')} className={sortButtonClass('temp')}><i className="ri-temp-hot-line mr-1"></i>체온</button>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>총 {currentPatients.length}명의 환자</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="divide-y divide-gray-100">
          {currentPatients.map((patient: Patient) => ( // ✨ 여기 괄호가 아니라 소괄호여야 해!
            <PatientListItem
              key={patient.patient_id}
              patient={patient}
              onSelectPatient={onSelectPatient}
              isSelected={patient.patient_id === selectedPatientId}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default PatientList;
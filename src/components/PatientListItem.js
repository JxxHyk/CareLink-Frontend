// components/PatientListItem.js
const PatientListItem = ({ patient, onSelectPatient, isSelected }) => {
  let riskIcon, riskText, riskColorClass;
  if (patient.risk === 'high') {
    riskIcon = 'ri-alarm-warning-fill';
    riskText = '고위험';
    riskColorClass = 'text-red-500';
  } else if (patient.risk === 'medium') {
    riskIcon = 'ri-error-warning-fill';
    riskText = '중위험';
    riskColorClass = 'text-yellow-500';
  } else {
    riskIcon = 'ri-checkbox-circle-fill';
    riskText = '저위험';
    riskColorClass = 'text-green-500';
  }

  const heartRateColor = patient.heartRate > 100 ? 'bg-red-100 text-red-500' : patient.heartRate > 85 ? 'bg-yellow-100 text-yellow-500' : 'bg-green-100 text-green-500';
  const tempColor = patient.temperature > 38.5 ? 'bg-red-100 text-red-500' : patient.temperature > 37.5 ? 'bg-yellow-100 text-yellow-500' : 'bg-green-100 text-green-500';
  const fallColor = patient.fallStatus === 'alert' ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500';


  return (
    <div
      className={`risk-${patient.risk} p-4 hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-primary/10' : ''}`}
      onClick={() => onSelectPatient(patient)}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
            <i className="ri-user-line text-gray-600"></i>
          </div>
          <div>
            <h3 className="font-medium text-gray-800">{patient.full_name}</h3>
            <div className="flex items-center text-xs text-gray-500 mt-0.5">
              <span className="mr-2">ID: {patient.patient_code}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center mb-1">
            <i className={`${riskIcon} mr-1 text-xs ${riskColorClass}`}></i>
            <span className={`text-xs ${riskColorClass}`}>{riskText}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="flex items-center p-1.5 bg-gray-50 rounded">
          <div className={`w-6 h-6 flex items-center justify-center rounded-full ${heartRateColor} mr-2`}>
            <i className="ri-heart-pulse-line text-xs"></i>
          </div>
          <div>
            <span className="text-xs text-gray-500">Heart</span>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-800">
                {patient.heartRate !== null ? patient.heartRate : '--'}
              </span>
              <span className="text-xs text-gray-500 ml-1">BPM</span>
            </div>
          </div>
        </div>
        <div className="flex items-center p-1.5 bg-gray-50 rounded">
          <div className={`w-6 h-6 flex items-center justify-center rounded-full ${tempColor} mr-2`}>
            <i className="ri-temp-hot-line text-xs"></i>
          </div>
          <div>
            <span className="text-xs text-gray-500">Temp</span>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-800">
                {patient.temperature !== null ? patient.temperature : '--'}
              </span>
              <span className="text-xs text-gray-500 ml-1">°C</span>
            </div>
          </div>
        </div>
        <div className="flex items-center p-1.5 bg-gray-50 rounded">
          <div className={`w-6 h-6 flex items-center justify-center rounded-full ${fallColor} mr-2`}>
            <i className="ri-walk-line text-xs"></i>
          </div>
          <div>
            <span className="text-xs text-gray-500">Fall</span>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-800">
                {patient.fallStatus !== null ? (patient.fallStatus === 'alert' ? 'Alert' : 'OK') : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientListItem;
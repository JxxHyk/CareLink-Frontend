// components/GPSCard.js
import { useState } from 'react';

const GPSCard = ({ gpsData = {} }) => {
  const [showGPS, setShowGPS] = useState(false);
  const { lat = 'N/A', long = 'N/A', address = 'N/A', timestamp = 'N/A' } = gpsData;

  return (
    <div className="sensor-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-500 mr-3">
              <i className="ri-map-pin-line"></i>
            </div>
            <h3 className="font-medium text-gray-800">GPS 위치</h3>
          </div>
          <div className="flex items-center">
            <label className="custom-switch mr-2">
              <input type="checkbox" checked={showGPS} onChange={() => setShowGPS(!showGPS)} />
              <span className="slider"></span>
            </label>
            <span className="text-xs text-gray-500">위치 표시</span>
          </div>
        </div>
      </div>
      {showGPS ? (
        <div className="p-4">
          <div className="relative w-full h-[180px] rounded-lg overflow-hidden">
            {/* 실제 지도 API (예: Google Maps, Naver Maps, Kakao Maps) 연동 필요 */}
            <img src="https://public.readdy.ai/gen_page/map_placeholder_1280x720.png" alt="Map" className="absolute w-full h-full object-cover object-top" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <i className="ri-user-location-fill text-white"></i>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">현재 위치:</span>
              <span className="text-xs text-gray-500">{timestamp}</span>
            </div>
            <div className="bg-gray-50 p-2 rounded text-sm text-gray-800">
              <div className="flex justify-between">
                <span>Lat: {lat}</span>
                <span>Long: {long}</span>
              </div>
              <div className="mt-1 text-xs text-gray-600">{address}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 flex flex-col items-center justify-center h-[200px]">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-3">
            <i className="ri-lock-line text-2xl"></i>
          </div>
          <p className="text-sm text-gray-500 text-center">개인정보 보호를 위해 위치 정보가 숨겨져 있습니다.</p>
          <p className="text-xs text-gray-400 text-center mt-1">위치 정보를 보려면 위의 스위치를 켜주세요.</p>
        </div>
      )}
    </div>
  );
};

export default GPSCard;
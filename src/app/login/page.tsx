// src/app/login/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// import Image from 'next/image'; // 로고 이미지를 사용한다면

// ✨ 필요한 타입들을 src/types/index.ts 와 src/types/enums.ts 에서 import
import {
  UserProfile,
  IdNamePair,
  ApiErrorResponse, // ✨ ApiErrorResponse를 index.ts에서 import
} from '@/types'; // 인터페이스들은 계속 index.ts에서 가져옴

import { // ✨ enums.ts에서 필요한 Enum들을 가져옴
  UserType,
  UserStatus, // ✨ UserStatus도 import
  // AlertType, // 현재 로그인 페이지에서 사용되지 않으므로 제거 가능
  // AlertSeverity, // 현재 로그인 페이지에서 사용되지 않으므로 제거 가능
} from '@/types/enums';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    const BASE_API_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';
    const LOGIN_API_URL = `${BASE_API_URL}/api/v1/auth/login`;
    const ME_API_URL = `${BASE_API_URL}/api/v1/auth/me`;

    try {
      // 1. 로그인 요청 -> 토큰 받기
      const loginResponse = await fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username, password: password }),
      });

      // 로그인 응답도 에러 케이스를 명확히 처리하기 위해 먼저 JSON 파싱
      const loginResult = await loginResponse.json();

      if (!loginResponse.ok) {
        // ✨ 로그인 실패 응답일 경우 ApiErrorResponse 타입으로 단언
        const errorResult = loginResult as ApiErrorResponse;
        setError(errorResult.detail || '로그인에 실패했습니다. 아이디 또는 비밀번호를 확인해주세요.');
        setIsLoading(false);
        return;
      }

      // 로그인 성공 시 응답에서 access_token 추출 (성공 응답 타입도 정확히 정의하면 좋음)
      const accessToken = (loginResult as { access_token: string }).access_token;
      if (!accessToken) {
        setError('로그인 토큰을 받지 못했습니다. 서버 응답을 확인해주세요.');
        setIsLoading(false);
        return;
      }

      // 2. 토큰을 사용해서 /me 엔드포인트에서 사용자 상세 정보 가져오기
      const meResponse = await fetch(ME_API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      // ✨ /me API 응답 결과를 먼저 받아서 성공/실패 여부에 따라 다른 타입으로 처리
      const meResultJson = await meResponse.json();

      if (!meResponse.ok) {
        // ✨ /me API 실패 응답일 경우 ApiErrorResponse 타입으로 단언
        const errorResult = meResultJson as ApiErrorResponse;
        setError(errorResult.detail || '사용자 정보를 가져오는 데 실패했습니다. 토큰이 유효한지 확인해주세요.');
        setIsLoading(false);
        return;
      }

      // ✨ 성공 응답일 경우, rawUserDataFromMe 변수에 할당 (UserProfile 스키마에 맞춰 Optional 필드 포함)
      const rawUserDataFromMe: {
        id?: number;
        username?: string;
        full_name?: string;
        email?: string | null;
        phone_number?: string | null;
        user_type?: string; // 백엔드 UserType Enum의 문자열 값
        organization?: IdNamePair | null;
        created_at?: string;
        updated_at?: string;
        status?: string | null; // 백엔드 UserStatus Enum의 문자열 값
        last_login?: string | null;
        is_superuser?: boolean | null; // ✨ is_superuser 필드 추가 (UserProfile에 필수)
      } = meResultJson; // meResponse.json()의 결과가 성공 응답 구조와 일치한다고 가정

      // rawUserDataFromMe를 UserProfile 타입으로 매핑 (UserProfile의 모든 필수 필드를 채워야 함)
      const userProfileForStorage: UserProfile = {
        id: rawUserDataFromMe.id ?? 0, // 백엔드 UserProfile에 id가 필수로 있음을 가정. 없다면 0으로 할당
        username: rawUserDataFromMe.username ?? rawUserDataFromMe.full_name ?? "UnknownUser",
        full_name: rawUserDataFromMe.full_name ?? rawUserDataFromMe.username ?? "알 수 없는 사용자",
        user_type: (rawUserDataFromMe.user_type as UserType) ?? UserType.STAFF, // user_type 없으면 STAFF
        organization_id: rawUserDataFromMe.organization?.id ?? 0, // FK는 ERD에서 필수이므로 기본값 설정
        organization: rawUserDataFromMe.organization ?? null,
        email: rawUserDataFromMe.email ?? null,
        phone_number: rawUserDataFromMe.phone_number ?? null,
        created_at: rawUserDataFromMe.created_at || new Date().toISOString(),
        updated_at: rawUserDataFromMe.updated_at || new Date().toISOString(),
        status: (rawUserDataFromMe.status as UserStatus) ?? UserStatus.ACTIVE, // ✨ UserStatus Enum 사용 및 기본값 할당
        last_login: rawUserDataFromMe.last_login ?? null,
        is_superuser: rawUserDataFromMe.is_superuser ?? false, // ✨ is_superuser 필드 할당 및 기본값
      };

      // 로그인 성공: localStorage에 정보 저장하고 메인 페이지로 이동
      if (typeof window !== "undefined") {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authToken', accessToken);
        // ✨ UserProfile 타입으로 완전히 매핑된 객체를 localStorage에 저장
        localStorage.setItem('currentUser', JSON.stringify(userProfileForStorage));
      }
      
      console.log("LoginPage - Login Success! Navigating to dashboard.");
      router.push('/');

    } catch (err) {
      console.error('로그인 과정 중 네트워크 또는 기타 오류 발생:', err);
      setError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/70 via-primary to-secondary/80 p-4">
      <div className="p-8 sm:p-10 bg-white shadow-2xl rounded-xl w-full max-w-md transform transition-all hover:scale-[1.01]">
        <div className="flex justify-center mb-6">
          <Link href="/" className="text-4xl font-pacifico text-primary">
            CareLink
          </Link>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          모니터링 시스템 로그인
        </h2>
        <p className="text-center text-gray-500 mb-8 text-sm">
          기관 관리자 계정으로 로그인해주세요.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">
              아이디
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
              placeholder="아이디를 입력하세요"
              disabled={isLoading}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
              placeholder="비밀번호를 입력하세요"
              disabled={isLoading}
              required
            />
          </div>
          {error && (
            <p className="text-xs text-red-600 bg-red-100 p-2 rounded-md text-center mb-4">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-primary hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-150 ease-in-out disabled:opacity-75"
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <div className="mt-8 text-center">
          <Link href="/register" className="text-sm text-primary hover:text-indigo-700 hover:underline">
            계정이 없으신가요? 회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
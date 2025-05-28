// src/app/login/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// import Image from 'next/image'; // 로고 이미지를 사용한다면

// MainPageController(src/app/page.tsx) 또는 공통 타입 파일과 일치해야 하는 타입 정의
interface OrganizationInfo {
  id: number; // 또는 string, 백엔드 응답에 맞춰서
  name: string;
}

interface UserDataForApp {
  name: string;
  role: string;
  organization?: OrganizationInfo | null;
  // id?: string;
  // is_superuser?: boolean;
}

export default function LoginPage() { // 컴포넌트 이름을 ActualLoginPage에서 LoginPage로 변경 (일반적)
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    // !!! 중요 !!!: 아래 URL들을 실제 FastAPI 엔드포인트 주소로 사용하고 있는지 확인!
    const LOGIN_API_URL = 'http://127.0.0.1:8000/api/v1/auth/login';
    const ME_API_URL = 'http://127.0.0.1:8000/api/v1/auth/me';

    try {
      // 1. 로그인 요청 -> 토큰 받기
      const loginResponse = await fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username, password: password }), // FastAPI LoginRequest 스키마에 맞게
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        setError(loginData.detail || '로그인에 실패했습니다. 아이디 또는 비밀번호를 확인해주세요.');
        setIsLoading(false);
        return;
      }

      const accessToken = loginData.access_token;
      if (!accessToken) {
        setError('로그인 토큰을 받지 못했습니다. 서버 응답을 확인해주세요.');
        setIsLoading(false);
        return;
      }

      // 2. 토큰을 사용해서 /me 엔드포인트에서 사용자 상세 정보 가져오기
      const meResponse = await fetch(ME_API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`, // Bearer 토큰 인증 헤더
        },
      });

      const userDataFromMe = await meResponse.json();

      if (!meResponse.ok) {
        setError(userDataFromMe.detail || '사용자 정보를 가져오는 데 실패했습니다. 토큰이 유효한지 확인해주세요.');
        setIsLoading(false);
        return;
      }

      // FastAPI /me 엔드포인트 응답에서 필요한 정보 추출
      // (실제 FastAPI UserSchema 반환값의 필드명과 일치해야 함!)
      const appUserData: UserDataForApp = {
        name: userDataFromMe.full_name || userDataFromMe.username || "사용자",
        role: userDataFromMe.user_type || "담당자", // FastAPI User 모델의 user_type 사용 가정
        organization: userDataFromMe.organization 
                        ? { id: userDataFromMe.organization.id, name: userDataFromMe.organization.name } 
                        : null,
        // is_superuser: userDataFromMe.is_superuser || false, // /me 응답에 is_superuser가 있다면
      };

      // 로그인 성공: localStorage에 정보 저장하고 메인 페이지로 이동
      if (typeof window !== "undefined") {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('currentUser', JSON.stringify(appUserData)); // 사용자 정보 (기관 정보 포함) 저장
      }
      router.push('/'); // 메인 페이지로 리다이렉트

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
          {/* public 폴더에 로고 이미지가 있다면 Image 컴포넌트 사용 가능 */}
          {/* <Image src="/logo.png" width={120} height={60} alt="CareLink Logo" /> */}
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
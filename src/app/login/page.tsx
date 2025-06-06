// src/app/login/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// import Image from 'next/image'; // 로고 이미지를 사용한다면

// 필요한 타입들을 src/types/index.ts 와 src/types/enums.ts 에서 import
// import { UserProfile, IdNamePair, ApiErrorResponse } from '@/types';
// import { UserType, UserStatus } from '@/types/enums';

// ✨ 새로 만든 api.ts 파일에서 인증 관련 함수들을 import
import { loginUser, fetchCurrentUser } from '@/lib/api';

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

    try {
      // 1. 로그인 요청 -> 토큰 받기 (api.ts의 loginUser 사용)
      const loginData = await loginUser(username, password); // ✨ 변경된 부분!

      const accessToken = loginData.access_token;
      if (!accessToken) {
        setError('로그인 토큰을 받지 못했습니다. 서버 응답을 확인해주세요.');
        setIsLoading(false);
        return;
      }

      // 2. 토큰을 사용해서 /me 엔드포인트에서 사용자 상세 정보 가져오기 (api.ts의 fetchCurrentUser 사용)
      // fetchCurrentUser 함수에 router를 넘겨서 401 에러 시 리다이렉트 처리 위임
      const userProfileForStorage = await fetchCurrentUser(accessToken, router); // ✨ 변경된 부분!

      // 로그인 성공: localStorage에 정보 저장하고 메인 페이지로 이동
      if (typeof window !== "undefined") {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authToken', accessToken);
        // UserProfile 타입으로 완전히 매핑된 객체를 localStorage에 저장
        localStorage.setItem('currentUser', JSON.stringify(userProfileForStorage));
      }
      
      console.log("LoginPage - Login Success! Navigating to dashboard.");
      router.push('/');

    } catch (err: any) { // err 타입을 any로 명시 (에러 객체는 다양한 형태일 수 있으므로)
      console.error('로그인 과정 중 네트워크 또는 기타 오류 발생:', err);
      // api.ts에서 던진 에러 메시지를 그대로 표시
      setError(err.message || '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
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
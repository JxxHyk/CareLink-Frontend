// src/app/login/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// import Image from 'next/image';

// MainPageController로 전달할 사용자 정보 타입
interface UserDataForApp {
  name: string;
  role: string;
}

// MainPageController의 handleLoginSuccess 타입과 맞춰야 함
// 여기서는 handleLoginSuccess가 token과 userData를 받으므로,
// LoginPage는 onLoginSuccess를 호출할 때 해당 인자들을 전달해야 함.
// 하지만 LoginPage 자체는 onLoginSuccess의 구체적인 인자 타입을 알 필요는 없음.
// 부모 컴포넌트(MainPageController)가 정의한 타입의 함수를 그냥 호출만 하면 됨.
// 더 명확하게 하려면 LoginPageProps의 onLoginSuccess 타입을 MainPageController와 동일하게 정의.
interface LoginPageProps {
  onLoginSuccess: (token: string, userData: UserDataForApp) => void;
}

// 이 LoginPage 컴포넌트는 MainPageController가 아닌, Next.js 라우터에 의해 직접 렌더링됨
// 따라서 onLoginSuccess prop을 직접 받지 않음.
// 대신, 로그인 성공 후 MainPageController의 상태를 변경하고 라우팅하는 로직이 필요.
// --> 이전에 MainPageController 안에 LoginPage를 조건부 렌더링했을 때와 로직이 달라져야 함.

// 이 파일은 /login 경로를 위한 독립적인 페이지이므로, MainPageController의 상태를 직접 업데이트 할 수 없음.
// 로그인 성공 후, 상태를 (예: Context 또는 localStorage) 업데이트하고, router.push('/')를 해야 함.
// MainPageController는 useEffect에서 localStorage를 보고 인증 상태를 설정.

export default function ActualLoginPage() { // 컴포넌트 이름 변경 (혼동 방지)
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    const LOGIN_API_URL = 'http://127.0.0.1:8000/api/v1/auth/login'; // !!! 실제 URL로 변경 !!!
    const ME_API_URL = 'http://127.0.0.1:8000/api/v1/auth/me';    // !!! 실제 URL로 변경 !!!

    try {
      const loginResponse = await fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        setError(loginData.detail || '로그인 실패');
        setIsLoading(false);
        return;
      }
      const accessToken = loginData.access_token;
      if (!accessToken) {
        setError('토큰을 받지 못함');
        setIsLoading(false);
        return;
      }

      const meResponse = await fetch(ME_API_URL, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const userDataFromMe = await meResponse.json();

      if (!meResponse.ok) {
        setError(userDataFromMe.detail || '사용자 정보 가져오기 실패');
        setIsLoading(false);
        return;
      }

      const appUserData: UserDataForApp = {
        name: userDataFromMe.full_name || userDataFromMe.username || "사용자",
        role: userDataFromMe.role || "담당자",
      };

      // 로그인 성공: localStorage에 정보 저장하고 메인 페이지로 이동
      if (typeof window !== "undefined") {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('currentUser', JSON.stringify(appUserData));
      }
      router.push('/'); // 메인 페이지로 리다이렉트

    } catch (err) {
      console.error('로그인 오류:', err);
      setError('오류 발생');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // LoginPage JSX (이전 답변의 LoginPage.tsx의 return 부분과 동일하게)
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/70 via-primary to-secondary/80 p-4">
      <div className="p-8 sm:p-10 bg-white shadow-2xl rounded-xl w-full max-w-md transform transition-all hover:scale-[1.01]">
        <div className="flex justify-center mb-6">
          <span className="text-4xl font-pacifico text-primary">CareLink</span>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          모니터링 시스템 로그인
        </h2>
        {/* ... (나머지 폼 UI는 이전과 동일) ... */}
        <form onSubmit={handleSubmit}>
          {/* 아이디, 비밀번호 입력 필드, 에러 메시지, 로그인 버튼 */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">아이디</label>
            <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors" placeholder="아이디를 입력하세요" disabled={isLoading} />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">비밀번호</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors" placeholder="비밀번호를 입력하세요" disabled={isLoading} />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-100 p-2 rounded-md text-center mb-4">{error}</p>}
          <button type="submit" className="w-full bg-primary hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-150 ease-in-out disabled:opacity-75" disabled={isLoading}>
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
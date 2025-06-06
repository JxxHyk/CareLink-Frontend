// src/app/register/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { UserType } from '@/types/enums';
import { registerUser } from '@/lib/api'; // registerUser 함수는 useAuth에 포함시키지 않고 api.ts에서 직접 호출

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [userType, setUserType] = useState('staff');

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    const registrationData = {
      username,
      email: email === '' ? null : email,
      password,
      full_name: fullName === '' ? null : fullName,
      phone_number: phoneNumber === '' ? null : phoneNumber,
      organization_id: parseInt(organizationId, 10),
      user_type: userType as UserType,
    };

    try {
      await registerUser(registrationData);

      setSuccessMessage('회원가입에 성공했습니다! 로그인 페이지로 이동합니다.');
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setPhoneNumber('');
      setOrganizationId('');
      setUserType('staff');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      console.error('회원가입 중 오류 발생:', err);
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/70 via-primary to-secondary/80 p-4">
      <div className="p-8 sm:p-10 bg-white shadow-2xl rounded-xl w-full max-w-lg transform transition-all">
        <div className="flex justify-center mb-6">
          <Link href="/" className="text-4xl font-pacifico text-primary">
            CareLink
          </Link>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          관리자 계정 등록
        </h2>
        <p className="text-center text-gray-500 mb-8 text-sm">
          새로운 기관 관리자 계정을 생성합니다.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">아이디 (Username)</label>
            <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50" disabled={isLoading}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">이메일</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50" disabled={isLoading}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">비밀번호</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50" disabled={isLoading}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">비밀번호 확인</label>
            <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50" disabled={isLoading}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fullName">이름 (Full Name)</label>
            <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50" disabled={isLoading}/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phoneNumber">
              핸드폰 번호 (선택 사항)
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              placeholder="010-1234-5678"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="organizationId">소속 기관 ID</label>
            <input type="number" id="organizationId" value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50" placeholder="숫자로 입력" disabled={isLoading}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="userType">사용자 유형</label>
            <select id="userType" value={userType} onChange={(e) => setUserType(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 bg-white" disabled={isLoading}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-100 p-2 rounded-md text-center">{error}</p>}
          {successMessage && <p className="text-xs text-green-600 bg-green-100 p-2 rounded-md text-center">{successMessage}</p>}

          <button type="submit" className="w-full mt-2 bg-primary hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-150 ease-in-out disabled:opacity-75" disabled={isLoading}>
            {isLoading ? '등록 중...' : '계정 등록하기'}
          </button>
        </form>
        <div className="mt-8 text-center">
          <Link href="/login" className="text-sm text-primary hover:text-indigo-700 hover:underline">
            이미 계정이 있으신가요? 로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
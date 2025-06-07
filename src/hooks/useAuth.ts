// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCurrentUser, logoutUser, loginUser as apiLoginUser } from '@/lib/api'; // apiLoginUser로 별칭 부여
import { UserProfile, CurrentUser } from '@/types'; // 필요한 타입들 import

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  currentUser: CurrentUser | null;
  authToken: string | null;
  login: (username: string, password: string) => Promise<void>; // ✨ 매개변수 타입 명시!
  logout: () => void;
  // 필요한 경우 register 함수도 여기에 추가할 수 있어.
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const logoutAndRedirect = useCallback(async () => {
    if (authToken) {
      // try {
      //   await logoutUser(authToken);
      //   console.log("백엔드 로그아웃 성공");
      // } catch (error) {
      //   console.error("백엔드 로그아웃 실패:", error);
      // }
    }
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setAuthToken(null);
    router.replace('/login');
  }, [authToken, router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoadingAuth(false);
      return;
    }

    const storedToken = localStorage.getItem('authToken');
    const storedUserJson = localStorage.getItem('currentUser');

    const initializeAuth = async () => {
      if (storedToken && storedUserJson) {
        try {
          const parsedUser: UserProfile = JSON.parse(storedUserJson);
          const appUser: CurrentUser = {
            id: parsedUser.id,
            username: parsedUser.username,
            full_name: parsedUser.full_name,
            email: parsedUser.email,
            phone_number: parsedUser.phone_number,
            user_type: parsedUser.user_type,
            organization_id: parsedUser.organization_id,
            organization: parsedUser.organization,
            created_at: parsedUser.created_at,
            updated_at: parsedUser.updated_at,
            is_superuser: parsedUser.is_superuser,
          };
          setCurrentUser(appUser);
          setAuthToken(storedToken);
          setIsAuthenticated(true);

          try {
            await fetchCurrentUser(storedToken, router);
          } catch (e) {
            console.error("저장된 토큰이 유효하지 않습니다:", e);
            logoutAndRedirect();
          }

        } catch (e) {
          console.error("useAuth - 사용자 정보 파싱 오류 또는 토큰 유효성 검사 실패:", e);
          logoutAndRedirect();
        }
      } else {
        setIsAuthenticated(false);
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          router.replace('/login');
        }
      }
      setIsLoadingAuth(false);
    };

    initializeAuth();
  }, [router, logoutAndRedirect]);

  const login = useCallback(async (username: string, password: string) => { // ✨ 매개변수 타입 명시!
    setIsLoadingAuth(true);
    try {
      const loginData = await apiLoginUser(username, password);
      const accessToken = loginData.access_token;

      if (!accessToken) {
        throw new Error('로그인 토큰을 받지 못했습니다.');
      }

      const userProfile = await fetchCurrentUser(accessToken, router);

      if (typeof window !== "undefined") {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('currentUser', JSON.stringify(userProfile));
      }
      setCurrentUser(userProfile);
      setAuthToken(accessToken);
      setIsAuthenticated(true);
      router.push('/');
    } catch (err: any) {
      console.error('useAuth - 로그인 실패:', err);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setIsLoadingAuth(false);
    }
  }, [router]);

  return { isAuthenticated, isLoadingAuth, currentUser, authToken, login, logout: logoutAndRedirect };
}
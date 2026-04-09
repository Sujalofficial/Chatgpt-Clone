import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/auth-store';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    if (token && userId) {
      // Manually set session info in store
      (useAuthStore.getState() as any).setSessionFromPassport(token, { id: userId });
      navigate('/');
    } else {
      navigate('/login?error=invalid_callback');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#16171d]">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 font-black animate-pulse uppercase tracking-[0.2em] text-xs">Finalizing Secure Session...</p>
      </div>
    </div>
  );
}

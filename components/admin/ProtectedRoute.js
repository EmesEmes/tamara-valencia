'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
      }
      setLoading(false);
    };

    checkSession();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    return null;
  }

  return children;
}
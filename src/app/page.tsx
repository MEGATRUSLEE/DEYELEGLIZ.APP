
"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import NextImage from 'next/image';

export default function RootPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    // Don't do anything until Firebase auth state is resolved
    if (loading) {
      return;
    }

    // If we have a user, redirect to the main app homepage
    if (user) {
      router.replace('/home');
    } else {
      // If there is no user, redirect to the authentication page
      router.replace('/auth');
    }
  }, [user, loading, router]);

  // While loading, show a full-screen loader with the logo
  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 splash-bg text-white">
        <div className="relative w-[200px] h-[200px] mb-5">
            <NextImage
                src="/assets/icons/deyelegliz-logo-512.png"
                alt="Logo Deye Legliz"
                fill
                className="object-contain"
                sizes="200px"
                priority
            />
        </div>
        <Loader2 className="mt-6 h-8 w-8 animate-spin" />
    </div>
  );
}

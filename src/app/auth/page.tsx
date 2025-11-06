
"use client"
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import NextImage from 'next/image';
import { AuthTabs } from '@/components/auth-tabs';

export default function AuthPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'login';


  useEffect(() => {
    // If user is already logged in, redirect them to the home page
    if (user) {
      router.replace('/home');
    }
  }, [user, router]);

  const handleLoginSuccess = () => {
    // Check if the user is a new user to redirect to onboarding
    const isNewUser = true; // This should be determined by your auth logic (e.g. from Firebase result)
    if(isNewUser) {
        router.push('/onboarding');
    } else {
        router.push('/home');
    }
  }

  if (loading || user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Ap verifye...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen p-4 md:p-6 bg-background">
      <div className="flex flex-col items-center justify-center flex-1 min-h-0">
            <Link href="/" className="mb-8">
                 <div className="relative w-[80px] h-[80px]">
                    <NextImage
                        src="/assets/icons/deyelegliz-logo-192.png"
                        alt="Logo Deye Legliz"
                        fill
                        className="rounded-full object-contain"
                        sizes="80px"
                    />
                </div>
            </Link>
            <AuthTabs onLoginSuccess={handleLoginSuccess} defaultTab={defaultTab} />
         </div>
    </div>
  );
}

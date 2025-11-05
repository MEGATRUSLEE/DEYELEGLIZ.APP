
"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function SplashPage() {
    const [user, authLoading] = useAuthState(auth);
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'redirecting' | 'auth_options'>('loading');

    useEffect(() => {
        // This effect runs only once to decide the initial flow.
        const onboardingComplete = typeof window !== 'undefined' && localStorage.getItem('onboardingComplete') === 'true';
        
        if (!onboardingComplete) {
            // First time visitor, redirect to onboarding.
            setStatus('redirecting');
            router.replace('/onboarding');
            return;
        }

        // It's a returning user, now we wait for Firebase auth state.
        if (!authLoading) {
            if (user) {
                // User is logged in, show welcome and then redirect.
                setStatus('redirecting');
                const timer = setTimeout(() => {
                   router.replace('/home');
                }, 1500); // A small delay to show welcome message
                return () => clearTimeout(timer);
            } else {
                // User is not logged in, show login/signup options.
                setStatus('auth_options');
            }
        }
    }, [authLoading, user, router]);


    if (status === 'loading' || status === 'redirecting') {
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
                 {status === 'redirecting' && user && (
                    <h1 className="text-2xl font-bold" style={{ textShadow: '1px 2px 3px #00000055' }}>
                        Byenveni {user.displayName || ''}!
                    </h1>
                )}
                <Loader2 className="mt-6 h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    // This will only be rendered if status is 'auth_options'
    return (
        <div className="flex flex-col items-center justify-center h-screen p-6 splash-bg text-white">
            <div className="flex flex-col items-center justify-center text-center space-y-8">
                 <div className="relative w-[250px] h-[250px] animate-scale-up">
                    <NextImage
                        src="/assets/icons/deyelegliz-logo-512.png"
                        alt="Logo Deye Legliz"
                        fill
                        className="object-contain"
                        sizes="250px"
                        priority
                    />
                </div>

                <div className="space-y-4 pt-4 w-full max-w-[280px] animate-fade-in">
                    <Button asChild className="w-full h-[50px] rounded-full text-lg border border-white/40 bg-white/20 backdrop-blur-sm hover:bg-white/30">
                        <Link href="/account?tab=login">Konekte</Link>
                    </Button>
                    <Button asChild className="w-full h-[50px] rounded-full text-lg border border-white/40 bg-white/30 backdrop-blur-sm hover:bg-white/40">
                        <Link href="/account?tab=signup">Kreye kont</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

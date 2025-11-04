
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
    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    const [isFirstVisit, setIsFirstVisit] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const onboardingComplete = localStorage.getItem('onboardingComplete');
            if (!onboardingComplete) {
                setIsFirstVisit(true);
                router.replace('/onboarding');
            }
        }
    }, [router]);

    useEffect(() => {
        if (loading || isFirstVisit) return;

        if (user) {
            const timer = setTimeout(() => {
                router.replace('/home');
            }, 1500); 
            return () => clearTimeout(timer);
        }
    }, [user, loading, router, isFirstVisit]);

    // If it's a first visit, the redirection to /onboarding will handle the view.
    // This component will just show a loader.
    if (isFirstVisit || loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-6 splash-bg text-white">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );
    }
    
    // If the user is logged in, show a welcome message before redirecting
    if (user) {
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
                <h1 className="text-2xl font-bold" style={{ textShadow: '1px 2px 3px #00000055' }}>
                    Byenveni {user.displayName || ''}!
                </h1>
                <p className="text-sm mt-2">Ap redireksyone w...</p>
                 <Loader2 className="mt-6 h-6 w-6 animate-spin" />
            </div>
        )
    }

    // If not a first visit and not logged in, show login/signup options
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
                        <Link href="/account?tab=signup">Enskri</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

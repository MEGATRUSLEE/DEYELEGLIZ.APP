
"use client";

import { useEffect } from "react";
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

    useEffect(() => {
        if (loading) return;

        if (user) {
            const timer = setTimeout(() => {
                router.replace('/home');
            }, 2000); 
            return () => clearTimeout(timer);
        }
        
    }, [user, loading, router]);


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-6 splash-bg text-white">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );
    }
    
    if (user) {
        return (
             <div className="flex flex-col items-center justify-center h-screen p-6 splash-bg text-white">
                <div className="relative w-[200px] h-[200px] mb-5">
                    <NextImage
                        src="/logo.png"
                        alt="Logo Deye Legliz"
                        fill
                        className="object-contain rounded-[20px]"
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

    return (
        <div className="flex flex-col items-center justify-center h-screen p-6 splash-bg text-white">
            <div className="flex flex-col items-center justify-center text-center space-y-5">
                 <div className="relative w-[200px] h-[200px] mb-5 shadow-lg rounded-[20px] animate-scale-up">
                    <NextImage
                        src="/logo.png"
                        alt="Logo Deye Legliz"
                        fill
                        className="object-contain rounded-[20px]"
                        sizes="200px"
                        priority
                        style={{ textShadow: '1px 2px 3px #00000055' }}
                    />
                </div>

                <h1 className="text-3xl font-bold animate-fade-in-up" style={{ textShadow: '1px 2px 3px #00000055' }}>
                    Byenveni sou Deye Legliz
                </h1>
                
                <div className="space-y-4 pt-4 w-full max-w-[250px] animate-fade-in">
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


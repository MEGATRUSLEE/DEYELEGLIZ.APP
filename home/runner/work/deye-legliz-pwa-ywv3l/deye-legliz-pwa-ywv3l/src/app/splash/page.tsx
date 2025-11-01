
"use client";

import NextImage from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SplashPage() {
    return (
        <div className="flex flex-col items-center justify-center h-screen p-6 splash-bg text-white">
            <div className="flex flex-col items-center justify-center text-center space-y-5">
                 <div className="relative w-[200px] h-[200px] mb-5 shadow-lg rounded-[20px]">
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

                <h1 className="text-3xl font-bold" style={{ textShadow: '1px 2px 3px #00000055' }}>
                    Byenveni sou Deye Legliz
                </h1>
                
                <div className="space-y-4 pt-4 w-full max-w-[250px]">
                    <Button asChild className="w-full h-[50px] rounded-full text-lg border border-white/40 bg-white/20 backdrop-blur-sm hover:bg-white/30">
                        <Link href="/account?tab=login">Login</Link>
                    </Button>
                    <Button asChild className="w-full h-[50px] rounded-full text-lg border border-white/40 bg-white/30 backdrop-blur-sm hover:bg-white/40">
                        <Link href="/account?tab=signup">Sign Up</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

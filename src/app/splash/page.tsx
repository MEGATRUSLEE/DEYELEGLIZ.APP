
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'lottie-player': React.DetailedHTMLProps<any, HTMLElement>;
        }
    }
}

export default function SplashPage() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace('/auth');
        }, 3000); // Redirect after 3 seconds

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center h-screen p-6 bg-[#5D3FD3] dark:bg-[#2A1F63] text-white">
            <div className="flex flex-col items-center justify-center text-center">
                 <div className="relative w-[110px] h-[110px] mb-[18px] animate-scale-up">
                    <Image
                        src="/logo.png"
                        alt="Logo Deye Legliz"
                        fill
                        className="rounded-full object-contain"
                        sizes="110px"
                    />
                </div>

                <h1 className="text-3xl font-extrabold mb-2 animate-fade-in-up">
                    Deye Legliz
                </h1>
                <p className="text-sm text-indigo-200 opacity-90 animate-fade-in">
                    Konekte ak lavni komès lokal la
                </p>

                <Loader2 className="mt-6 h-6 w-6 animate-spin" />
            </div>
        </div>
    );
}

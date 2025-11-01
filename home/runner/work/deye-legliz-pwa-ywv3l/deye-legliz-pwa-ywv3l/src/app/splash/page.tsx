
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function SplashPage() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace('/auth');
        }, 3000); // Redirect after 3 seconds

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center h-screen p-6 bg-[#0E1F34] text-white">
            <div className="flex flex-col items-center justify-center text-center">
                 <div className="relative w-[250px] h-[250px] mb-8 animate-scale-up">
                    <Image
                        src="/logo.png"
                        alt="Logo Deye Legliz"
                        fill
                        className="object-contain"
                        sizes="250px"
                        priority
                    />
                </div>

                <Loader2 className="mt-6 h-6 w-6 animate-spin" />
            </div>
        </div>
    );
}

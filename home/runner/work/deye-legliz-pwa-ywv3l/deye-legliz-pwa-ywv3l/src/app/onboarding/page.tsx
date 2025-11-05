
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const onboardingData = {
  backgroundColor: "#0A1E2B",
  textColor: "#FFFFFF",
  accentColor: "#D4A017",
  pages: [
    {
      title: "Konekte ak pwodui lokal, san entèmedyè",
      description: "Yon platfòm ki mete machann ak kliyan ansanm pou vann oswa achte pwodui lokal fasilman — lakay ou oswa nan diaspora.",
      image: "/assets/onboarding/local-market.png",
      buttonText: "Swivan"
    },
    {
      title: "Fè biznis san baryè, lakay ak aletranje",
      description: "Deye Legliz pèmèt tout Ayisyen, kèlkeswa kote yo ye, fè tranzaksyon dirèk pou pwodwi oswa sèvis lokal.",
      image: "/assets/onboarding/diaspora-connect.png",
      buttonText: "Swivan"
    },
    {
      title: "Fè yon demann epi jwenn moun ki gen solisyon an",
      description: "Ou bezwen yon pwodwi oswa yon sèvis? Fè yon demann, epi kominote Deye Legliz la ap reponn ou vit.",
      image: "/assets/onboarding/request-service.png",
      buttonText: "Kòmanse"
    }
  ],
  skipButton: {
    text: "Sote",
    action: "goToLogin"
  },
  finishButton: {
    text: "Kòmanse",
    action: "goToLogin"
  }
};

export default function OnboardingPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (currentPage < onboardingData.pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('onboardingComplete', 'true');
    }
    router.replace('/account?tab=login');
  };

  const page = onboardingData.pages[currentPage];

  return (
    <div className="flex flex-col h-screen text-white" style={{ backgroundColor: onboardingData.backgroundColor }}>
      <header className="flex justify-end p-4">
        {currentPage < onboardingData.pages.length - 1 && (
            <Button variant="ghost" onClick={handleFinish} className="text-white hover:text-white/80 hover:bg-white/10">
            {onboardingData.skipButton.text}
            </Button>
        )}
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
         <div className="relative w-full h-64 mb-8">
             <NextImage 
                src={page.image} 
                alt={page.title} 
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
             />
        </div>
        <h1 className="text-2xl font-bold mb-4" style={{ color: onboardingData.textColor }}>{page.title}</h1>
        <p className="text-base text-white/80 max-w-sm">{page.description}</p>
      </main>
      
      <footer className="p-6 space-y-4">
        <div className="flex justify-center gap-2">
            {onboardingData.pages.map((_, index) => (
                <div 
                    key={index}
                    className={cn(
                        'h-2 w-2 rounded-full transition-all',
                        currentPage === index ? 'w-6' : ''
                    )}
                    style={{ backgroundColor: currentPage === index ? onboardingData.accentColor : '#FFFFFF55' }}
                />
            ))}
        </div>
        <Button 
            onClick={handleNext} 
            className="w-full h-12 text-lg" 
            style={{ backgroundColor: onboardingData.accentColor, color: onboardingData.backgroundColor }}
        >
          {page.buttonText}
        </Button>
      </footer>
    </div>
  );
}

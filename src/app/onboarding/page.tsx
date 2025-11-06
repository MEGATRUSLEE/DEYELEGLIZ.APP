
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import NextImage from 'next/image';

const onboardingData = {
  backgroundColor: "#0A1E2B",
  textColor: "#FFFFFF",
  accentColor: "#D4A017",
  pages: [
    {
      title: "Konekte ak pwodui lokal, san entèmedyè",
      description: "Yon platfòm ki mete machann ak kliyan ansanm pou vann oswa achte pwodui lokal fasilman — lakay ou oswa nan diaspora.",
      image: "https://picsum.photos/seed/market/600/400"
    },
    {
      title: "Fè biznis san baryè, lakay ak aletranje",
      description: "Deye Legliz pèmèt tout Ayisyen, kèlkeswa kote yo ye, fè tranzaksyon dirèk pou pwodwi oswa sèvis lokal.",
      image: "https://picsum.photos/seed/connect/600/400"
    },
    {
      title: "Fè yon demann epi jwenn moun ki gen solisyon an",
      description: "Ou bezwen yon pwodwi oswa yon sèvis? Fè yon demann, epi kominote Deye Legliz la ap reponn ou vit.",
      image: "https://picsum.photos/seed/request/600/400"
    }
  ],
  skipButton: { text: "Sote" },
  nextButton: { text: "Swivan" },
  finishButton: { text: "Kòmanse" }
};


export default function OnboardingPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();
  const data = onboardingData;

  const handleFinish = () => {
    // When onboarding is skipped or finished, go to the main app
    router.replace('/home');
  };

  const handleNext = () => {
    if (currentPage < data.pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleFinish();
    }
  };

  const page = data.pages[currentPage];
  const isLastPage = currentPage === data.pages.length - 1;

  return (
    <div className="flex flex-col h-screen text-white overflow-hidden" style={{ backgroundColor: data.backgroundColor }}>
      <header className="flex justify-end p-4 h-16">
        {!isLastPage && (
            <Button variant="ghost" onClick={handleFinish} className="text-white hover:text-white/80 hover:bg-white/10">
            {data.skipButton.text}
            </Button>
        )}
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="relative w-full max-w-xs h-48 rounded-lg overflow-hidden">
             <NextImage 
                src={page.image} 
                alt={page.title} 
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 320px"
                data-ai-hint="onboarding illustration"
             />
        </div>
        <div className="space-y-2">
            <h1 className="text-2xl font-bold" style={{ color: data.textColor }}>{page.title}</h1>
            <p className="text-base text-white/80 max-w-sm">{page.description}</p>
        </div>
      </main>
      
      <footer className="p-6 space-y-4 h-32">
        <div className="flex justify-center gap-2">
            {data.pages.map((_, index) => (
                <div 
                    key={index}
                    className={cn(
                        'h-2 w-2 rounded-full transition-all',
                        currentPage === index ? 'w-6' : ''
                    )}
                    style={{ backgroundColor: currentPage === index ? data.accentColor : '#FFFFFF55' }}
                />
            ))}
        </div>
        <Button 
            onClick={handleNext} 
            className="w-full h-12 text-lg" 
            style={{ backgroundColor: data.accentColor, color: data.backgroundColor }}
        >
          {isLastPage ? data.finishButton.text : data.nextButton.text}
        </Button>
      </footer>
    </div>
  );
}


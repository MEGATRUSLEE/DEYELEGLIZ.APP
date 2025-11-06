
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface OnboardingData {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  pages: {
    title: string;
    description: string;
    buttonText: string;
  }[];
  skipButton: {
    text: string;
  };
  finishButton: {
    text: string;
  };
}

export default function OnboardingPage() {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetch("/onboarding.json")
      .then((res) => res.json())
      .then((json) => setData(json.onboarding));
  }, []);

  const handleNext = () => {
    if (data && currentPage < data.pages.length - 1) {
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

  if (!data) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4" style={{ backgroundColor: "#0A1E2B" }}>
            <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
    );
  }

  const page = data.pages[currentPage];

  return (
    <div className="flex flex-col h-screen text-white" style={{ backgroundColor: data.backgroundColor }}>
      <header className="flex justify-end p-4">
        {currentPage < data.pages.length - 1 && (
            <Button variant="ghost" onClick={handleFinish} className="text-white hover:text-white/80 hover:bg-white/10">
            {data.skipButton.text}
            </Button>
        )}
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="flex-grow flex flex-col justify-center items-center">
            <h1 className="text-3xl font-bold mb-4" style={{ color: data.textColor }}>{page.title}</h1>
            <p className="text-lg text-white/80 max-w-sm">{page.description}</p>
        </div>
      </main>
      
      <footer className="p-6 space-y-4">
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
          {page.buttonText}
        </Button>
      </footer>
    </div>
  );
}


"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface OnboardingPageData {
  title: string;
  description: string;
  image: string;
}

interface OnboardingData {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  pages: OnboardingPageData[];
  skipButton: { text: string };
  nextButton: { text: string };
  finishButton: { text: string };
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

  const handleFinish = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('onboardingComplete', 'true');
    }
    router.replace('/account?tab=login');
  };

  const handleNext = () => {
    if (data && currentPage < data.pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleFinish();
    }
  };

  if (!data) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4" style={{ backgroundColor: "#0A1E2B" }}>
            <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
    );
  }

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

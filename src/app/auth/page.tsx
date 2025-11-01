
"use client"
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AuthScreen() {
  return (
    <div className="flex flex-col h-screen p-6 animate-fade-in">
      <div className="flex-1 flex flex-col justify-center text-center">
        <h1 className="text-3xl font-bold text-foreground mb-[30px]">
          Byenveni sou Deye Legliz
        </h1>
        <p className="text-sm text-muted-foreground mb-10 max-w-xs mx-auto">
          Antre nan platfòm ki konekte tout machann ak kliyan Ayiti.
        </p>
        
        <div className="space-y-4">
          <Button asChild size="lg" className="w-full animate-slide-in-left shadow-lg" style={{ backgroundColor: '#5D3FD3', color: '#FFFFFF' }}>
            <Link href="/account?tab=signup">Kreye kont</Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="w-full animate-slide-in-right shadow-lg bg-[#EDE7FF] text-[#5D3FD3] dark:bg-[#2A1F63] dark:text-[#EDE7FF]">
            <Link href="/account?tab=login">Mwen deja gen kont</Link>
          </Button>
        </div>
      </div>
      
      <footer className="text-center text-xs text-muted-foreground pb-4">
        <p>© 2025 Deye Legliz - Tout dwa rezève</p>
      </footer>
    </div>
  );
}

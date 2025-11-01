
"use client"
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthScreen() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    // If user is already logged in, redirect them to the home page
    if (user) {
      router.replace('/home');
    }
  }, [user, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Ap verifye...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen p-6 animate-fade-in bg-background">
      <div className="flex-1 flex flex-col justify-center text-center">
         <h1 className="text-3xl font-bold text-foreground mb-4">
          Byenveni sou Deye Legliz
        </h1>
        <p className="text-sm text-muted-foreground mb-10 max-w-xs mx-auto">
          Antre nan platfòm ki konekte tout machann ak kliyan an Ayiti.
        </p>
        
        <div className="space-y-4">
          <Button asChild size="lg" className="w-full animate-slide-in-left shadow-lg">
            <Link href="/account?tab=signup">Kreye kont</Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="w-full animate-slide-in-right shadow-lg">
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

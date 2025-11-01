
"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/splash');
  }, [router]);

  return null; // This page just redirects, so it doesn't need to render anything.
}

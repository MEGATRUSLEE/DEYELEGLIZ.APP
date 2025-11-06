
"use client"

import "./globals.css"
import { Poppins } from "next/font/google"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BottomNav } from "@/components/bottom-nav"
import { Toaster } from "@/components/ui/toaster"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase"
import { Loader2 } from "lucide-react"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const [user, loading] = useAuthState(auth)

  // Define routes that are public and should not show the main nav
  const publicRoutes = ["/auth", "/onboarding"]
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // The root page is special, it's a loading/redirect page, so no nav.
  if (pathname === '/') {
     return (
        <html lang="ht">
            <body className={cn("font-body antialiased", poppins.variable)}>
                 {children}
                 <Toaster />
            </body>
        </html>
     )
  }

  if (loading && !isPublicRoute) {
    return (
      <html lang="ht">
        <body className={cn("font-body antialiased", poppins.variable)}>
          <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </body>
      </html>
    )
  }
  
  const showNav = user && !isPublicRoute;

  return (
    <html lang="ht">
      <head>
        <title>Deye Legliz - Mache Lokal sou Telefòn ou</title>
        
        {/* SEO Meta Tags */}
        <meta name="description" content="Deye Legliz se yon platfòm Ayisyen pou achte ak vann pwodwi lokal." />
        <meta name="keywords" content="Deye Legliz, pwodwi lokal, Haiti, achte, vann, machann, mache tradisyonèl" />
        <meta name="author" content="Mega Tech Haiti" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:title" content="Deye Legliz - Mache Lokal sou Telefòn ou" />
        <meta property="og:description" content="Dekouvri ak achte pwodwi lokal dirèkteman sou telefòn ou." />
        <meta property="og:image" content="/assets/og-image.png" />
        <meta property="og:url" content="https://deyelegliz.com" />
        <meta property="og:type" content="website" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Deye Legliz" />
        <meta name="twitter:description" content="Achte pwodwi lokal dirèk sou mobil ou avèk Deye Legliz." />
        <meta name="twitter:image" content="/assets/twitter-image.png" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0A1E2B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Deye Legliz" />
        <link rel="apple-touch-icon" href="/assets/icons/deyelegliz-logo-192.png" />
        <link rel="icon" href="/assets/icons/deyelegliz-logo-192.png" sizes="any" />
      </head>
      <body
        className={cn(
          "font-body antialiased",
          poppins.variable
        )}
      >
        <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background shadow-lg">
          <main className={cn("flex-1", showNav && "pb-20")}>
            {children}
          </main>
          {showNav && <BottomNav />}
          <Toaster />
        </div>
      </body>
    </html>
  )
}

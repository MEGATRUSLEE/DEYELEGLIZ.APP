"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ShoppingCart, Send, UserCircle2, Utensils } from "lucide-react"

import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Dakèy", icon: Home },
  { href: "/market", label: "Machandiz", icon: ShoppingCart },
  { href: "/requests", label: "Demand", icon: Send },
  { href: "/food", label: "Gouyo", icon: Utensils },
  { href: "/account", label: "Kont", icon: UserCircle2 },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 border-t bg-background/95 backdrop-blur-sm md:left-auto md:right-auto md:w-full md:max-w-md">
      <div className="grid h-full grid-cols-5">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 text-muted-foreground"
            >
              <item.icon
                className={cn(
                  "h-6 w-6",
                  isActive && "text-primary"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive && "text-primary"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

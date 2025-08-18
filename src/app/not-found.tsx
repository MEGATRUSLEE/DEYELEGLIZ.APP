
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex h-full min-h-[70vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <FileQuestion className="h-20 w-20 text-destructive" strokeWidth={1} />
      <h1 className="text-4xl font-bold text-primary">404 - Paj Pa Twouve</h1>
      <p className="max-w-md text-lg text-muted-foreground">
        Oups! Paj w ap chèche a pa egziste, li ka te deplase, oswa adrès la pa kòrèk.
      </p>
      <Button asChild size="lg" className="mt-4">
        <Link href="/">Tounen nan Paj Dakèy la</Link>
      </Button>
    </div>
  )
}

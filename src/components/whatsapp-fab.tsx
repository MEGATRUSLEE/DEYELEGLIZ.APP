import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function WhatsAppContactButton() {
  return (
    <Button
      asChild
      className="w-full text-white"
      style={{ backgroundColor: '#25D366' }}
      aria-label="Kontakte sou WhatsApp"
    >
      <Link href="https://wa.me/50931813578" target="_blank" rel="noopener noreferrer">
        <MessageCircle className="mr-2 h-5 w-5 fill-white" />
        Kontakte nou sou WhatsApp
      </Link>
    </Button>
  )
}

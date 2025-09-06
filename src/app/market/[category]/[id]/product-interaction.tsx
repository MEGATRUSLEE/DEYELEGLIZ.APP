
"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MessageCircle, Loader2, HandCoins } from "lucide-react"
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db, auth } from "@/lib/firebase" 
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useAuthState } from "react-firebase-hooks/auth"
import { useToast } from "@/hooks/use-toast"
import type { Product } from "../../page" 

type ProductDetail = Product & {
    vendorLogoUrl?: string;
    vendorPhone?: string;
    diasporaCity?: string;
    vendorIsVerified?: boolean;
}

function NegotiationModal({ product, user, onOfferMade }: { product: ProductDetail, user: any, onOfferMade: () => void }) {
    const [offerPrice, setOfferPrice] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmitOffer = async () => {
        if (!offerPrice || isNaN(parseFloat(offerPrice))) {
            toast({ variant: "destructive", title: "Erè", description: "Tanpri antre yon pri ki valid." });
            return;
        }
        if (!user) {
             toast({ variant: "destructive", title: "Erè", description: "Itilizatè pa konekte." });
             return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "offers"), {
                productId: product.id,
                productName: product.name,
                productOwnerId: product.userId,
                buyerId: user.uid,
                buyerName: user.displayName || "Achtè Deye Legliz",
                originalPrice: product.price,
                offerPrice: offerPrice,
                status: "pending",
                createdAt: serverTimestamp(),
            });
            toast({ title: "Siksè!", description: "Òf ou an te voye bay machann nan." });
            onOfferMade();
        } catch (error) {
            console.error("Error submitting offer:", error);
            toast({ variant: "destructive", title: "Erè", description: "Pa t kapab voye òf ou an." });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Negosye Pri a</DialogTitle>
                <DialogDescription>
                    Fè yon òf pou pwodwi sa a: <span className="font-bold text-primary">{product.name}</span>. Pri aktyèl la se <span className="font-bold">{product.price}</span>.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Input 
                    type="number"
                    placeholder="Antre pri ou ofri a"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Anile</Button>
                </DialogClose>
                <Button onClick={handleSubmitOffer} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Voye Òf
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

export function ProductInteraction({ product }: { product: ProductDetail }) {
  const { id } = product;
  const [productUrl, setProductUrl] = useState("")
  const [user, authLoading] = useAuthState(auth);
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setProductUrl(window.location.href)
    }
  }, [])
  
  // Increment view count
  useEffect(() => {
    const incrementView = async () => {
      try {
        const viewedKey = `viewed_${id}`;
        if (typeof window !== 'undefined' && !sessionStorage.getItem(viewedKey)) {
            const docRef = doc(db, "products", id);
            await updateDoc(docRef, {
                views: increment(1)
            });
            sessionStorage.setItem(viewedKey, 'true');
        }
      } catch (viewError) {
        console.error("Failed to increment view count:", viewError);
      }
    };
    
    if (id) {
      incrementView();
    }
  }, [id]);


  const handleNegotiateClick = () => {
      if (!user) {
          toast({
              variant: "destructive",
              title: "Konekte Dabò",
              description: "Ou dwe gen yon kont pou w ka negosye yon pwodwi.",
          });
          router.push('/account');
          return;
      }
      if (user.uid === product?.userId) {
          toast({
              variant: "destructive",
              title: "Erè",
              description: "Ou pa ka negosye pwòp pwodwi w.",
          });
          return;
      }
      setIsNegotiationModalOpen(true);
  }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  const whatsappNumber = product.vendorPhone?.replace(/\D/g, '') || '50931813578';
  const message = encodeURIComponent(`Bonjou, mwen enterese nan pwodwi sa a: *${product.name}*\n\nOu ka wè l isit la: ${productUrl}`);
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${message}`;


  return (
    <>
      {product.vendorPhone && (
        <div className="flex flex-col sm:flex-row gap-3 !mt-8">
            <Button asChild className="flex-1 text-lg" style={{ backgroundColor: '#25D366', color: 'white' }}>
                <Link
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <MessageCircle className="mr-2 h-6 w-6"/>
                    Kontakte Machann
                </Link>
            </Button>
            <Dialog open={isNegotiationModalOpen} onOpenChange={setIsNegotiationModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1 text-lg" onClick={handleNegotiateClick}>
                        <HandCoins className="mr-2 h-6 w-6"/>
                        Negosye
                    </Button>
                </DialogTrigger>
                {user && <NegotiationModal product={product} user={user} onOfferMade={() => setIsNegotiationModalOpen(false)} />}
            </Dialog>
        </div>
        )}
    </>
  )
}

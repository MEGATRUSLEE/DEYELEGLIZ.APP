
"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { notFound, useRouter } from "next/navigation"
import { ArrowLeft, MessageCircle, Loader2, Globe, Building, Eye, Power, PowerOff, Inbox, MapPin, HandCoins, ShieldCheck, CalendarDays } from "lucide-react"
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp, type Timestamp } from "firebase/firestore"
import { db, auth } from "@/lib/firebase" 
import type { Product } from "../../page" 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
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
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useAuthState } from "react-firebase-hooks/auth"
import { useToast } from "@/hooks/use-toast"


interface ProductDetailPageProps {
  params: { category: string, id: string };
}

// Define a more specific type for the product details page
type ProductDetail = Product & {
    vendorLogoUrl?: string;
    vendorPhone?: string;
    diasporaCity?: string;
    vendorIsVerified?: boolean;
}

function formatDate(timestamp: Timestamp | null | undefined): string {
    if (!timestamp) return 'Pa gen dat';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
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

const fetchProductData = async (id: string): Promise<ProductDetail | null> => {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        console.log("No such product document!");
        return null;
    }

    const productData = { id: docSnap.id, ...docSnap.data() } as Product;
    
    // Initialize with fallback data from the product itself
    let productDetail: ProductDetail = {
        ...productData,
        vendorLogoUrl: undefined,
        vendorPhone: undefined,
        vendorIsVerified: false
    };

    // Try to get enriched vendor data, but don't fail if it's not there
    if (productData.userId) {
        try {
            const userRef = doc(db, "users", productData.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const vendorData = userSnap.data();
                productDetail.vendorLogoUrl = vendorData.vendorApplication?.logoUrl;
                // Handle both new and old data structures for vendor phone
                productDetail.vendorPhone = vendorData.vendorApplication?.phone || vendorData.phone;
                productDetail.vendorIsVerified = vendorData.vendorApplication?.status === 'approved';
            }
        } catch (userError) {
            console.error("Could not fetch vendor details, proceeding with basic info:", userError);
        }
    }

    // Increment view count only once per session
    try {
      const viewedKey = `viewed_${id}`;
      if (typeof window !== 'undefined' && !sessionStorage.getItem(viewedKey)) {
          await updateDoc(docRef, {
              views: increment(1)
          });
          sessionStorage.setItem(viewedKey, 'true');
      }
    } catch (viewError) {
      console.error("Failed to increment view count:", viewError);
    }

    return productDetail;
};


export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = params;
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
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

  const loadProduct = useCallback(async () => {
    if (!id) {
        setLoading(false);
        return;
    };
    setLoading(true);
    const data = await fetchProductData(id);
    if (data) {
        setProduct(data);
    } else {
        // Product not found in DB, trigger notFound
        setProduct(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

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

  if (loading || authLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Ap chaje pwodwi a...</p>
      </div>
    )
  }
  
  if (!product) {
    notFound();
  }
  
  const whatsappNumber = product.vendorPhone?.replace(/\D/g, '') || '50931813578';
  const message = encodeURIComponent(`Bonjou, mwen enterese nan pwodwi sa a: *${product.name}*\n\nOu ka wè l isit la: ${productUrl}`);
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${message}`;


  return (
    <div className="flex flex-col">
       <header className="sticky top-0 z-20 flex items-center gap-4 bg-background/95 backdrop-blur-sm p-4 shadow-sm">
        <Link href="/market">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground truncate">{product.name}</h1>
      </header>

      <main className="flex-1">
        <Carousel className="w-full">
          <CarouselContent>
            {product.imageUrls.map((img, index) => (
              <CarouselItem key={index}>
                <div className="relative h-72 w-full">
                  <Image
                    src={img}
                    alt={`${product.name} - imaj ${index + 1}`}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    data-ai-hint="product image"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {product.imageUrls.length > 1 && (
            <>
              <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
              <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
            </>
          )}
        </Carousel>

        <div className="space-y-6 p-4">
            <div>
                <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>
                <p className="mt-2 text-3xl font-extrabold text-primary">{product.price}</p>
                 <p className="flex items-center text-sm text-muted-foreground mt-2">
                    <CalendarDays className="mr-1.5 h-4 w-4" />
                    Afiche jou ki te: {formatDate(product.createdAt)}
                </p>
                <div className="mt-4 flex items-center gap-4 text-sm flex-wrap">
                    <Badge variant={product.isAvailable ? "default" : "secondary"} className={product.isAvailable ? "bg-green-600" : ""}>
                        {product.isAvailable ? <Power className="mr-1 h-3 w-3" /> : <PowerOff className="mr-1 h-3 w-3" />}
                        {product.isAvailable ? 'Disponib' : 'Pa Disponib'}
                    </Badge>
                     <div className="flex items-center text-muted-foreground">
                        <Inbox className="mr-1.5 h-4 w-4" />
                        <span>Stòk: <span className="font-semibold">{product.quantity || 0}</span></span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                        <Eye className="mr-1.5 h-4 w-4" />
                        <span>Vi: <span className="font-semibold">{product.views || 0}</span></span>
                    </div>
                </div>
            </div>

            <Separator />
            
            <div>
                <h3 className="text-lg font-semibold text-foreground">Deskripsyon</h3>
                <p className="mt-2 text-muted-foreground">{product.description}</p>
            </div>

            <Separator />

            <div>
                <h3 className="text-lg font-semibold text-foreground">Enfòmasyon sou Machann nan</h3>
                <div className="flex items-center gap-3 mt-3">
                    <Avatar className="h-14 w-14">
                        <AvatarImage src={product.vendorLogoUrl} alt={product.vendorName} data-ai-hint="business logo"/>
                        <AvatarFallback><Building/></AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{product.vendorName}</p>
                            {product.vendorIsVerified && (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                    <ShieldCheck className="h-3 w-3 mr-1"/>
                                    Verifye
                                </Badge>
                            )}
                        </div>
                        <div className="mt-1 flex flex-col gap-1">
                            <p className="flex items-center text-sm text-muted-foreground">
                                <MapPin className="mr-1.5 h-4 w-4" />
                                {product.vendorCity}, {product.vendorCountry}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

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
        </div>
        
      </main>
    </div>
  )
}

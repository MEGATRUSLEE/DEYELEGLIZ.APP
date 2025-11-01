import { Suspense } from "react"
import NextImage from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, MessageCircle, Loader2, Building, Eye, Power, PowerOff, Inbox, MapPin, HandCoins, ShieldCheck, CalendarDays } from "lucide-react"
import { doc, getDoc, updateDoc, increment, type Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase" 
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
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ProductInteraction } from "./product-interaction"


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
    
    // We move the view increment logic to a client component to avoid issues with sessionStorage on the server.
    return productDetail;
};


export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = params;
  const product = await fetchProductData(id);
  
  if (!product) {
    notFound();
  }
  
  return (
    <div className="flex flex-col">
       <header className="sticky top-0 z-20 flex items-center gap-4 bg-background/95 backdrop-blur-sm p-4 shadow-sm">
        <Link href="/market">
          <Button variant="ghost" size="icon" aria-label="Tounen nan mache a">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground truncate">{product.name}</h1>
      </header>

      <div className="flex-1">
        <Carousel className="w-full">
          <CarouselContent>
            {product.imageUrls.map((img, index) => (
              <CarouselItem key={index}>
                <div className="relative h-72 w-full">
                  <NextImage
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
              <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" aria-label="Previous image" />
              <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" aria-label="Next image"/>
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

            <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin" /></div>}>
                <ProductInteraction product={product} />
            </Suspense>
            
        </div>
      </div>
    </div>
  )
}

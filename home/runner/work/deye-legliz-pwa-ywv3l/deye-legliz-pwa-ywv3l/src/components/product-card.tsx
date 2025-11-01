
import NextImage from "next/image"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Product } from "@/app/market/page"
import { MapPin } from "lucide-react"

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // Use a static path for the category to avoid issues with special characters or dynamic routing problems.
  // The product page only needs the ID to fetch the data.
  const categoryPath = "all";
  return (
    <Link href={`/market/${categoryPath}/${product.id}`} className="flex">
      <Card className="flex flex-col overflow-hidden w-full transition-shadow duration-300 hover:shadow-lg">
        <CardHeader className="p-0">
          <div className="relative h-40 w-full">
            <NextImage
              src={product.imageUrls[0]}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="w-full h-full object-cover"
              data-ai-hint="local product"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-3 space-y-1">
          <CardTitle className="text-base font-semibold leading-tight line-clamp-2 text-foreground">{product.name}</CardTitle>
          <div className="flex items-center text-xs text-muted-foreground pt-1">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{product.vendorCity}, {product.vendorCountry}</span>
          </div>
        </CardContent>
        <CardFooter className="p-3 pt-0">
           <p className="text-lg font-bold text-primary">{product.price}</p>
        </CardFooter>
      </Card>
    </Link>
  )
}


"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { Input } from "@/components/ui/input"
import { ProductCard } from "@/components/product-card"
import { Search, Loader2, Utensils, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Product as BaseProduct } from "@/app/market/page";


// Re-define product here to avoid circular dependencies if ProductCard needs it
export interface Product extends BaseProduct {}

export default function FoodPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const q = query(
        collection(db, "products"), 
        where("category", "==", "Manje ak Bwason"),
        where("isAvailable", "==", true)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsData: Product[] = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching food products:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const results = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm, products]);

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-4 bg-background p-4 shadow-sm">
         <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
            <Utensils className="h-6 w-6 text-primary"/>
            <h1 className="text-2xl font-bold text-primary">Manje & Bwason</h1>
        </div>
      </header>
      <main className="flex-1 p-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Chèche yon manje, pwason, restoran..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <section>
            <h2 className="text-xl font-bold text-primary mb-4">Tout Pwodwi Manje</h2>
             {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                {searchTerm ? `Pa gen okenn rezilta pou "${searchTerm}".` : "Poko gen pwodwi manje ki afiche."}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
        </section>
      </main>
    </div>
  )
}

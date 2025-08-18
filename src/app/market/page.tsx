
"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { collection, onSnapshot, query, where, or, and } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { Input } from "@/components/ui/input"
import { ProductCard } from "@/components/product-card"
import { Search, Car, Smartphone, Headphones, Lightbulb, Footprints, Shirt, Smile, CookingPot, Baby, Book, Bed, Wrench, Package, Gift, Utensils, Wheat, ShoppingBag, Loader2, Home, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export interface Product {
  id: string;
  name: string;
  price: string;
  imageUrls: string[];
  category: string;
  description: string;
  vendorName: string;
  vendorCountry: string;
  vendorCity: string;
  userId: string;
  isAvailable?: boolean;
  views?: number;
  quantity?: number;
  createdAt?: any;
}

const categories = [
    { name: "Machin", icon: Car, href: "/market?category=Machin", value: "Machin" },
    { name: "Kay", icon: Home, href: "/market?category=Kay", value: "Kay" },
    { name: "Pyes machin", icon: Wrench, href: "/market?category=Pyes machin", value: "Pyes machin" },
    { name: "Pyes moto", icon: Wrench, href: "/market?category=Pyes moto", value: "Pyes moto" },
    { name: "Telefòn", icon: Smartphone, href: "/market?category=Telefòn", value: "Telefòn" },
    { name: "Akseswa", icon: Headphones, href: "/market?category=Akseswa", value: "Akseswa" },
    { name: "Elektwonik", icon: Lightbulb, href: "/market?category=Elektwonik", value: "Elektwonik" },
    { name: "Tenis", icon: Footprints, href: "/market?category=Tenis", value: "Tenis" },
    { name: "Rad", icon: Shirt, href: "/market?category=Rad", value: "Rad" },
    { name: "Pwodwi Bote", icon: Smile, href: "/market?category=Pwodwi Bote", value: "Pwodwi Bote" },
    { name: "Elektwo-menaje", icon: CookingPot, href: "/market?category=Elektwo-menaje", value: "Elektwo-menaje" },
    { name: "Pwodwi Timoun", icon: Baby, href: "/market?category=Pwodwi Timoun", value: "Pwodwi Timoun" },
    { name: "Liv", icon: Book, href: "/market?category=Liv", value: "Liv" },
    { name: "Mèb", icon: Bed, href: "/market?category=Mèb", value: "Mèb" },
    { name: "Zouti", icon: Wrench, href: "/market?category=Zouti", value: "Zouti" },
    { name: "Atik Kay", icon: Package, href: "/market?category=Atik Kay", value: "Atik Kay" },
    { name: "Kado & Atizana", icon: Gift, href: "/market?category=Kado & Atizana", value: "Kado & Atizana" },
    { name: "Atik Kwizin", icon: Utensils, href: "/market?category=Atik Kwizin", value: "Atik Kwizin" },
    { name: "Agrikilti", icon: Wheat, href: "/market?category=Agrikilti", value: "Agrikilti" },
    { name: "Pèpè", icon: ShoppingBag, href: "/market?category=Pèpè", value: "Pèpè" },
    { name: "Erotik", icon: Heart, href: "/market?category=Erotik", value: "Erotik" },
]

// We use a Suspense boundary in a parent component, so we can use hooks here directly.
function MarketPageContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    const initialSearch = searchParams.get('q') || '';
    const initialCategory = searchParams.get('category');
    
    // If the search term is "erotik", set the category to "Erotik"
    if (initialSearch.toLowerCase() === 'erotik') {
        setActiveCategory('Erotik');
        setSearchTerm(''); // Clear search term to show all erotic products
    } else {
        setSearchTerm(initialSearch);
        setActiveCategory(initialCategory);
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);

    const productCollection = collection(db, "products");
    
    let queryConstraints = [
      where("isAvailable", "==", true)
    ];

    if (activeCategory) {
      const categoryList = activeCategory.split(',');
      queryConstraints.push(where("category", "in", categoryList));
    }
    
    const q = query(productCollection, ...queryConstraints);
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let productsData: Product[] = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() } as Product);
      });

      // Hide "Manje ak Bwason" and "Erotik" unless they are the active category
      if (!activeCategory || !activeCategory.includes("Manje ak Bwason")) {
          productsData = productsData.filter(product => product.category !== "Manje ak Bwason");
      }
      if (!activeCategory || !activeCategory.includes("Erotik")) {
          productsData = productsData.filter(product => product.category !== "Erotik");
      }

      // Client-side search filtering
      if (searchTerm) {
          productsData = productsData.filter(product =>
              product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.description.toLowerCase().includes(searchTerm.toLowerCase())
          );
      }
      
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching market products:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [searchTerm, activeCategory]);

  const handleCategoryClick = (categoryValue: string | null) => {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('q'); // Clear search when a category is clicked
      setSearchTerm('');

      if (activeCategory === categoryValue) {
          setActiveCategory(null);
          currentUrl.searchParams.delete('category');
      } else {
          setActiveCategory(categoryValue);
          if (categoryValue) {
            currentUrl.searchParams.set('category', categoryValue);
          }
      }
      // Use replaceState to avoid adding to browser history for simple filter changes
      window.history.replaceState({}, '', currentUrl);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentUrl = new URL(window.location.href);
    
    if (searchTerm.trim().toLowerCase() === 'erotik') {
        currentUrl.searchParams.set('category', 'Erotik');
        currentUrl.searchParams.delete('q');
    } else if (searchTerm.trim()) {
        currentUrl.searchParams.set('q', searchTerm.trim());
        currentUrl.searchParams.delete('category'); // Clear category when searching
    } else {
        currentUrl.searchParams.delete('q');
    }
    window.history.replaceState({}, '', currentUrl.toString());
    
    // Directly trigger the state update to re-run the effect
    const newSearch = currentUrl.searchParams.get('q') || '';
    const newCategory = currentUrl.searchParams.get('category') || null;
    
    if (newSearch.toLowerCase() === 'erotik') {
        setActiveCategory('Erotik');
        setSearchTerm('');
    } else {
        setSearchTerm(newSearch);
        setActiveCategory(newCategory);
    }
  };

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 bg-background p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-center text-primary">Machandiz</h1>
        <form onSubmit={handleSearchSubmit} className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Chèche yon pwodwi... (eg. Erotik)" 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
      </header>
      <main className="flex-1">
        <section className="p-4">
            <h2 className="text-xl font-bold text-primary mb-4">Browse pa kategori</h2>
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
                <div className="flex w-max space-x-3 pb-4">
                    {categories.map((category) => {
                        const isErotic = category.value === "Erotik";
                        return (
                            <Button 
                                key={category.name} 
                                variant={activeCategory === category.value ? "default" : "outline"} 
                                className="h-auto flex-col p-4 rounded-lg gap-2 w-28 h-28" 
                                onClick={() => handleCategoryClick(category.value)}
                                title={isErotic ? "Kategori diskrè" : category.name}
                            >
                                <category.icon className="h-8 w-8" strokeWidth={1.5} />
                                 {!isErotic && <span className="text-center text-xs font-normal whitespace-pre-wrap">{category.name}</span>}
                            </Button>
                        )
                    })}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </section>

        <section className="p-4">
            <h2 className="text-xl font-bold text-primary mb-4">
                {activeCategory ? `Rezilta pou "${activeCategory.replace(/,/g, ', ')}"` : "Tout Pwodwi yo"}
            </h2>
             {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : products.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                {searchTerm || activeCategory ? `Pa gen okenn rezilta pou seleksyon sa a.` : "Poko gen pwodwi sou mache a."}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
        </section>
      </main>
    </div>
  )
}

export default function MarketPage() {
    return (
        <React.Suspense fallback={
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        }>
            <MarketPageContent />
        </React.Suspense>
    );
}

    
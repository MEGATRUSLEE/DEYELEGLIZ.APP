
"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Phone, Mail, Instagram, Facebook, Utensils, Brush, Shirt, Lightbulb, Gift, MoreHorizontal, Building, Search, ShoppingCart, Bell, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { WhatsAppContactButton } from "@/components/whatsapp-fab"
import { ProductCard } from "@/components/product-card"
import type { Product } from "@/lib/types"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


const testimonials = [
  { name: "Marie J.", text: "Mwen jwenn tout sa m te bezwen fasil. Anpil bon pwodwi lokal!", avatar: "MJ" },
  { name: "Jean P.", text: "Aplikasyon an vrèman itil pou nou menm diaspora ki vle sipòte atizan lakay.", avatar: "JP" },
  { name: "Carine F.", text: "Finalman yon platfòm serye pou machann ayisyen!", avatar: "CF" },
]

const categories = [
    { name: "Elektronik", icon: Lightbulb, href: "/market?category=Elektwonik,Akseswa,Telefòn" },
    { name: "Rad & Akseswa", icon: Shirt, href: "/market?category=Rad,Tenis,Pèpè" },
    { name: "Manje & Bwason", icon: Utensils, href: "/food" },
    { name: "Pwodwi Bote", icon: Brush, href: "/market?category=Pwodwi Bote" },
    { name: "Mobiliye & Imobilye", icon: Building, href: "/market?category=Kay,Machin,Mèb,Pyes machin,Pyes moto" },
    { name: "Lòt", icon: MoreHorizontal, href: "/market?category=Liv,Zouti,Atik Kay,Kado & Atizana,Atik Kwizin,Agrikilti" },
]

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.43.05-4.84-.95-6.43-2.8-1.59-1.87-2.32-4.2-2.32-6.53 0-2.33.72-4.66 2.31-6.53 1.59-1.85 3.99-2.79 6.42-2.81.02-3.78-.02-7.56.02-11.34Z" />
    </svg>
  );

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // We query the last 10 created products, then filter for available ones in the client.
    // This avoids creating a composite index in Firestore for this specific query.
    const q = query(
        collection(db, "products"), 
        orderBy("createdAt", "desc"), 
        limit(10) // Fetch a bit more to have a chance to find 4 available ones
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const productsData: Product[] = [];
        querySnapshot.forEach((doc) => {
            productsData.push({ id: doc.id, ...doc.data() } as Product);
        });
        
        // Filter for available products and take the first 4
        const availableProducts = productsData
            .filter(p => p.isAvailable && p.category !== "Manje ak Bwason" && p.category !== "Erotik")
            .slice(0, 4);
        
        setRecentProducts(availableProducts);
        setLoadingRecent(false);
    }, (error) => {
        console.error("Error fetching recent products:", error);
        setLoadingRecent(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/market?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/market');
    }
  };


  return (
    <div className="flex flex-col bg-background">
      <header className="sticky top-0 z-20 bg-background/95 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex-shrink-0">
             <div className="relative h-10 w-10">
                  <Image
                    src="/logo.png"
                    alt="Logo Deye Legliz"
                    fill
                    sizes="40px"
                    className="object-contain"
                  />
              </div>
          </Link>
          <form onSubmit={handleSearchSubmit} className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Chèche pwodwi..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </form>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/account">
                    <ShoppingCart className="h-6 w-6" />
                </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
                <Link href="/account">
                    <Bell className="h-6 w-6" />
                </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-8 p-4 md:p-6">
        <section className="relative h-48 w-full rounded-lg overflow-hidden">
             <Image
                src="https://images.unsplash.com/photo-1741119184701-fc1798acbf7f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8aGFpdGlhbiUyMG1hcmtldCUyMHNjZW5lfGVufDB8fHx8MTc1MjY5Njk4Mnww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Deye Legliz Banner"
                fill
                sizes="(max-width: 768px) 100vw, 424px"
                className="object-cover"
                priority
                data-ai-hint="haitian market scene"
            />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-2xl font-bold text-white drop-shadow-md">Deye Legliz</h1>
                <p className="mt-1 text-lg text-white/90 drop-shadow-md">Mache an liy pou tout Ayisyen toupatou.</p>
            </div>
        </section>

        <section className="flex flex-row items-center gap-3">
            <Button asChild size="lg" variant="secondary" className="flex-1 transition-transform hover:scale-105">
                <Link href="/requests">Fè yon Demand</Link>
            </Button>
            <Button asChild size="lg" variant="default" className="flex-1 transition-transform hover:scale-105">
                <Link href="/market">Ale nan Mache a</Link>
            </Button>
        </section>

        <section>
            <h2 className="text-2xl font-bold text-center text-primary">Kategori Pwodwi yo</h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
                {categories.map((category) => (
                    <Link href={category.href} key={category.name} className="flex flex-col items-center justify-center gap-2 rounded-lg bg-secondary/30 p-3 text-center transition-transform hover:scale-105">
                        <category.icon className="h-8 w-8 text-primary" strokeWidth={1.5}/>
                        <span className="text-xs font-medium text-primary text-center whitespace-pre-wrap">{category.name}</span>
                    </Link>
                ))}
            </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-bold text-center text-primary">Pwodwi ki Fèk Afiche</h2>
          {loadingRecent ? (
             <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recentProducts.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {recentProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-center text-muted-foreground">Poko gen pwodwi ki afiche.</p>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold text-center text-primary">Temwayaj Kliyan Nou yo</h2>
          <div className="mt-4 space-y-4">
            {testimonials.map(testimonial => (
              <Card key={testimonial.name}>
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                  <Avatar>
                    <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="person portrait"/>
                    <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="italic">"{testimonial.text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        
        <section className="space-y-4 rounded-lg bg-secondary/30 p-4">
          <h3 className="text-xl font-bold text-primary">Kontakte nou</h3>
          <div className="space-y-3">
              <a href="tel:+50931813578" className="flex items-center gap-3 text-muted-foreground hover:text-primary">
                  <Phone className="h-5 w-5" />
                  <span>+509 3181-3578</span>
              </a>
              <a href="mailto:support@deyelegliz.com" className="flex items-center gap-3 text-muted-foreground hover:text-primary">
                  <Mail className="h-5 w-5" />
                  <span>support@deyelegliz.com</span>
              </a>
               <WhatsAppContactButton />
          </div>
          <div className="flex items-center gap-4 pt-4">
              <a href="https://instagram.com/megatechhaiti" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <Instagram className="h-7 w-7 text-primary hover:text-accent" />
              </a>
              <a href="https://facebook.com/megatechhaiti" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <Facebook className="h-7 w-7 text-primary hover:text-accent" />
              </a>
              <a href="https://tiktok.com/@megatechhaiti" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                   <TikTokIcon className="h-6 w-6 text-primary hover:text-accent" />
              </a>
          </div>
        </section>

         <section className="space-y-4 rounded-lg bg-secondary/30 p-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="about">
                <AccordionTrigger className="text-lg font-semibold text-primary">A pwopo de Deye Legliz</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-justify">
                  Deye Legliz se yon platfòm maketplas ayisyen ke Mega Tech Haiti kreye pou soutni machann lokal ak ti biznis. Li enspire pa vre mache ki dèyè legliz Katolik vil Saint-Marc, kote plizyè santèn moun vann rad, elektwonik, atik menaj, ak pwodwi dyaspora voye. Aplikasyon sa pèmèt machann mete pwodwi yo sou li epi kliyan fè demann sou sa yo bezwen. Li konekte machann lokal ak kliyan nan tout Ayiti ak dyaspora.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="terms">
                <AccordionTrigger className="text-lg font-semibold text-primary">Tèm ak Kondisyon Itilizasyon</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-justify whitespace-pre-line">
                  {`📜 Tèm Itilizasyon – Deye Legliz
Dènye aktyalizasyon: Jiyè 2025

Lè ou itilize aplikasyon Deye Legliz, ou dakò respekte règ ak kondisyon ki ekri anba la yo. Tanpri li yo byen, paske yo gouvène kijan ou itilize sèvis nou yo.

1. ✅ Aksepte Tèm sa yo
Lè ou enskri sou app la oswa ou fè nenpòt aktivite (achte, vann, mete pwodwi), sa vle di ou dakò ak règ nou yo. Si ou pa dakò, tanpri pa sèvi ak app la.

2. 🛒 Itilizasyon App la
Ou ka itilize app la pou:
- Mete pwodwi ou pou vann (machann)
- Browse oswa achte pwodwi (kliyan)
- Kominike ak machann (WhatsApp / demann)

Ou pa gen dwa itilize app la pou:
- Mete fo enfòmasyon
- Vann pwodwi ilegal oswa danjere
- Fè spam oswa atak sou lòt itilizatè

3. 🧾 Kont ou
Ou responsab pou kont ou ak tout sa ki fèt sou li.
- Tanpri mete enfòmasyon ki egzak.
- Si ou bliye modpas ou, ou ka itilize bouton “Bliye modpas” pou rekipere li.
Nou ka fèmen kont ou si ou vyole tèm sa yo.

4. 📷 Kontni ou mete sou app la
Ou kenbe dwa sou foto, logo, ak teks ou mete sou kont ou.
Men, lè ou mete yo sou app la, ou ban nou pèmisyon pou montre yo bay lòt itilizatè yo.
Ou responsab pou asire ke kontni ou pa vyole dwa okenn lòt moun.

5. 🚫 Sanksyon & Fèmti Kont
Nou gen dwa:
- Retire nenpòt kontni ki pa respekte règ yo
- Bloke oswa efase kont ki vyole règ nou yo
- Refize sèvis san avètisman si gen abi

6. 📦 Responsablite sou achte & vant
Deye Legliz se yon platfòm koneksyon, men nou pa entèvni dirèkteman nan tranzaksyon.
Machann yo responsab pou verite pwodwi yo, ak livrezon si sa nesesè.
Nou ankouraje tout itilizatè yo kominike klèman.

7. 🔐 Vi prive ak sekirite
Nou itilize teknoloji Firebase pou sekirize enfòmasyon ou yo. Tanpri li Tèm Konfidansyalite nou pou plis detay.

8. 📢 Chanjman nan Tèm yo
Nou ka modifye tèm sa yo nenpòt kilè. Nou pral mete dat dènye aktyalizasyon an epi enfòme w si gen chanjman enpòtan.

9. 📞 Kontakte nou
Si ou gen kesyon sou règ nou yo, kontakte nou:
📧 Imèl: support@deyelegliz.com
📱 WhatsApp: +509 31813578
🌍 Sit entènèt: www.deyelegliz.com

Mèsi paske w fè konfyans Deye Legliz. Ann grandi ekonomi lokal ansanm!`}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="privacy">
                <AccordionTrigger className="text-lg font-semibold text-primary">Politik Konfidansyalite</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-justify">
                  Nou pran konfidansyalite enfòmasyon pèsonèl ou oserye. Deye Legliz kolekte done tankou non w, imèl ou, ak nimewo telefòn ou pou fasilite kominikasyon ant achtè ak machann. Nou pa pataje enfòmasyon sa yo ak okenn lòt antite san pèmisyon w. Lè w kominike ak yon machann atravè WhatsApp, se politik konfidansyalite WhatsApp la ki aplike.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
         </section>

        <footer className="text-center text-muted-foreground text-sm pt-4">
          <p>&copy; {new Date().getFullYear()} Deye Legliz. Tout dwa rezève.</p>
          <p className="mt-1">Yon pwojè <span className="font-semibold text-primary">Mega Tech Haiti</span></p>
        </footer>
      </main>
    </div>
  );
}

    

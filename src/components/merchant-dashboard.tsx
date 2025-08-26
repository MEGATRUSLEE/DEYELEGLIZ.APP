
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { auth, db, storage, collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy, type Timestamp } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import type { UserProfile } from "@/app/account/page"
import type { Request } from "@/app/requests/page"
import { UserRequestCard } from "@/components/user-request-card"
import { PlusCircle, Trash2, LogOut, Loader2, BarChart2, Store, Package, Power, PowerOff, Eye, AlertTriangle, Building, Upload, Send, CalendarDays, Inbox, ShieldCheck, HandCoins, Check, X, Info, ShieldQuestion } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { countries } from "@/lib/countries"

// Schemas & Types
interface Offer {
    id: string;
    productId: string;
    productName: string;
    buyerId: string;
    buyerName: string;
    originalPrice: string;
    offerPrice: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Timestamp;
}

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];


const productSchema = z.object({
    name: z.string().min(3, "Non an dwe gen omwen 3 karaktè."),
    description: z.string().min(10, "Deskripsyon an dwe gen omwen 10 karaktè."),
    price: z.string().min(1, "Pri a obligatwa."),
    category: z.string({ required_error: "Ou dwe chwazi yon kategori."}).min(1, "Ou dwe chwazi yon kategori."),
    quantity: z.coerce.number().min(0, "Kantite a dwe yon nonb pozitif."),
    images: z.any()
      .refine((files) => files && files.length > 0, "Ou dwe ajoute omwen yon imaj.")
      .refine((files) => files && files.length <= 4, "Ou ka ajoute 4 imaj sèlman.")
       .refine((files) => Array.from(files).every((file: any) => file.size <= MAX_FILE_SIZE), `Chak imaj dwe peze 4MB oswa mwens.`)
      .refine((files) => Array.from(files).every((file: any) => ACCEPTED_IMAGE_TYPES.includes(file.type)), "Se sèlman fòma .jpg, .jpeg, .png ak .webp ki aksepte."),
});

type ProductFormValues = z.infer<typeof productSchema>;

const haitiGeography = {
  "Lwès": ["Pòtoprens", "Kafou", "Dèlma", "Petyonvil", "Kenskòf", "Grangwav", "Tigwav", "Leyogàn", "Kabasè", "Lakayè", "Akayè"],
  "Latibonit": ["Gonayiv", "Sen Mak", "Vèrèt", "Dechalon", "Dèdin", "Lestè", "Ansagalèt"],
  "Nò": ["Okap", "Lenbe", "Pò Mago", "Akil dinò", "Plèn dinò", "Obòy", "Bastè"],
  "Nòdès": ["Fòlibète", "Wanament", "Twou dinò", "Karis", "Valyè"],
  "Nòdwès": ["Pòdepè", "Sen Lwi dinò", "Ansàfo", "Mòl Sen Nikola", "Latòti"],
  "Sant": ["Ench", "Mibalè", "Laskawobas", "Sèka Lasous", "Tomonn"],
  "Sid": ["Okay", "Aken", "Koto", "Pòsali", "Sen Lwi disid", "Lilavach"],
  "Sidès": ["Jakmèl", "Marigo", "Bèlans", "Benè", "Kòt Defè"],
  "Grandans": ["Jeremi", "Koray", "Ansdeno", "Pestèl", "Dam Mari"],
  "Nip": ["Miragwàn", "Ansavo", "Baradè", "Fondènèg"]
};
type Department = keyof typeof haitiGeography;


const storeInfoSchema = z.object({
    businessName: z.string().min(3, "Non biznis la twò kout."),
    phone: z.string().min(8, "Nimewo telefòn pa valid."),
    address: z.string().min(10, "Adrès la twò kout."),
    country: z.string().min(1, "Ou dwe chwazi peyi kote w ye a."),
    department: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    diasporaCity: z.string().optional(),
    zipCode: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.country === 'Ayiti') {
        if (!data.department) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ou dwe chwazi yon depatman.", path: ["department"] });
        }
        if (!data.city) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ou dwe chwazi yon vil.", path: ["city"] });
        }
    } else if (data.country && data.country !== 'Ayiti') {
         if (!data.state) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Eta/Pwovens obligatwa.", path: ["state"] });
        }
        if (!data.diasporaCity) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vil la obligatwa.", path: ["diasporaCity"] });
        }
    }
});


const categories = [
    "Machin",
    "Kay",
    "Pyes machin",
    "Pyes moto",
    "Telefòn",
    "Akseswa",
    "Elektwonik",
    "Tenis",
    "Rad",
    "Pwodwi Bote",
    "Elektwo-menaje",
    "Pwodwi Timoun",
    "Liv",
    "Mèb",
    "Zouti",
    "Atik Kay",
    "Kado & Atizana",
    "Atik Kwizin",
    "Agrikilti",
    "Pèpè",
    "Manje ak Bwason",
    "Erotik",
    "Lòt"
];

// Sub-components for Tabs
function AddProductForm({ userProfile, setOpen }: { userProfile: UserProfile; setOpen: (open: boolean) => void }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            description: "",
            price: "",
            category: "",
            quantity: 1,
            images: undefined,
        }
    });

    const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
        setIsSubmitting(true);
        const currentUser = auth.currentUser;
        if (!currentUser || !userProfile.vendorApplication) {
            toast({ variant: "destructive", title: "Erè", description: "Ou dwe konekte kòm yon machann pou w ajoute yon pwodwi." });
            setIsSubmitting(false);
            return;
        }

        const imageFiles = data.images as FileList;
        
        try {
            const userId = currentUser.uid;
            
            const vendorCity = userProfile.vendorApplication.city;
            const vendorCountry = userProfile.vendorApplication.country;
            
            if (!vendorCity || !vendorCountry) {
                 toast({ variant: "destructive", title: "Erè Pwofil", description: "Vil oswa peyi machann nan pa defini. Tanpri mete pwofil biznis ou a ajou." });
                 setIsSubmitting(false);
                 return;
            }

            const uploadPromises = Array.from(imageFiles).map(async (file) => {
                const fileRef = ref(storage, `products/${userId}/${Date.now()}_${file.name}`);
                await uploadBytes(fileRef, file);
                return getDownloadURL(fileRef);
            });
            const imageUrls = await Promise.all(uploadPromises);

            const productData = {
                userId: userId,
                vendorName: userProfile.vendorApplication.businessName,
                vendorCountry: vendorCountry,
                vendorCity: vendorCity,
                name: data.name,
                description: data.description,
                price: data.price,
                category: data.category,
                quantity: data.quantity,
                imageUrls: imageUrls,
                isAvailable: true,
                views: 0,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, "products"), productData);

            toast({ title: "Siksè!", description: "Pwodwi w la te ajoute." });
            form.reset();
            setOpen(false);
            router.push('/market'); 

        } catch (error) {
            console.error("Error adding product: ", error);
            toast({ variant: "destructive", title: "Erè", description: "Pa t' kapab ajoute pwodwi a." });
        } finally {
            setIsSubmitting(false);
        }
    }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Non Pwodwi</FormLabel><FormControl><Input placeholder="Non pwodwi a" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem><FormLabel>Pri (eg. 1500 Gdes / 15 USD)</FormLabel><FormControl><Input placeholder="Espesifye lajan an" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem><FormLabel>Kantite an stòk</FormLabel><FormControl><Input type="number" placeholder="1" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Deskripsyon</FormLabel><FormControl><Textarea placeholder="Bay detay sou pwodwi a..." {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chwazi yon kategori pou pwodwi a" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="images"
              render={({ field: { onChange, value, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Imaj (jiska 4)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={(e) => onChange(e.target.files)}
                      {...fieldProps}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Ap ajoute..." : "Mete Pwodwi sou Mache a"}
            </Button>
        </form>
    </Form>
  )
}

interface FetchedProduct {
    id: string;
    name: string;
    price: string;
    imageUrls: string[];
    isAvailable: boolean;
    views: number;
    quantity: number;
    createdAt: Timestamp;
}

function formatDate(timestamp: Timestamp | null | undefined): string {
    if (!timestamp) return 'Pa gen dat';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}


function MyProductsTab({ userProfile }: { userProfile: UserProfile }) {
    const { toast } = useToast();
    const [products, setProducts] = useState<FetchedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [addProductOpen, setAddProductOpen] = useState(false);
    
    useEffect(() => {
      if (!userProfile?.uid) return;
      setLoading(true);
      const q = query(collection(db, "products"), where("userId", "==", userProfile.uid));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const productsData: FetchedProduct[] = [];
        querySnapshot.forEach((doc) => {
          productsData.push({ id: doc.id, ...doc.data() } as FetchedProduct);
        });

        productsData.sort((a, b) => {
            const dateA = a.createdAt ? a.createdAt.toMillis() : 0;
            const dateB = b.createdAt ? b.createdAt.toMillis() : 0;
            return dateB - dateA;
        });

        setProducts(productsData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user products: ", error);
        toast({ variant: "destructive", title: "Erè", description: "Pa t' kapab chaje pwodwi ou yo." });
        setLoading(false);
      });

      return () => unsubscribe();
    }, [userProfile, toast]);

    const handleToggleAvailability = async (productId: string, currentStatus: boolean) => {
        const productRef = doc(db, "products", productId);
        try {
            await updateDoc(productRef, { isAvailable: !currentStatus });
            toast({ title: "Siksè", description: "Estati pwodwi a chanje." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erè", description: "Pa t' kapab chanje estati a." });
        }
    }

    const handleDeleteProduct = async (product: FetchedProduct) => {
        try {
            const deleteImagePromises = product.imageUrls.map(url => {
                try {
                    const imageRef = ref(storage, url);
                    return deleteObject(imageRef);
                } catch (e) {
                    console.warn(`Could not delete image at ${url}:`, e);
                    return Promise.resolve();
                }
            });
            await Promise.all(deleteImagePromises);

            await deleteDoc(doc(db, "products", product.id));
            
            toast({ title: "Siksè", description: "Pwodwi a ak tout imaj li yo te efase." });
        } catch (error) {
            console.error("Error deleting product and images:", error);
            toast({ variant: "destructive", title: "Erè", description: "Pa t' kapab efase pwodwi a." });
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="space-y-4">
             <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
                <DialogTrigger asChild>
                <Button size="sm" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajoute Pwodwi
                </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ajoute yon nouvo pwodwi</DialogTitle>
                </DialogHeader>
                <AddProductForm userProfile={userProfile} setOpen={setAddProductOpen} />
                </DialogContent>
            </Dialog>

            {products.length === 0 ? (
                <p className="text-center text-muted-foreground p-8">Ou poko ajoute okenn pwodwi.</p>
            ) : (
                <div className="space-y-4 pt-4">
                {products.map(product => (
                <Card key={product.id} className="w-full">
                   <CardContent className="p-3 flex gap-4">
                        <div className="relative h-24 w-24 flex-shrink-0">
                            <Image 
                                src={product.imageUrls[0]} 
                                alt={product.name} 
                                fill
                                className="rounded-md object-cover"
                                data-ai-hint="product image"
                            />
                        </div>
                        <div className="flex-grow space-y-2">
                            <div>
                                <p className="font-semibold leading-tight">{product.name}</p>
                                <p className="text-sm text-primary font-bold">{product.price}</p>
                            </div>

                            <div className="text-xs text-muted-foreground space-y-1">
                                 <div className="flex items-center">
                                    <Inbox className="mr-1.5 h-3 w-3" />
                                    <span>Stòk: <span className="font-medium">{product.quantity}</span></span>
                                </div>
                                <div className="flex items-center">
                                    <Eye className="mr-1.5 h-3 w-3" />
                                    <span>Vi: <span className="font-medium">{product.views || 0}</span></span>
                                </div>
                                <div className="flex items-center">
                                    <CalendarDays className="mr-1.5 h-3 w-3" />
                                    <span>Poste: {formatDate(product.createdAt)}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2">
                                    <Switch 
                                        id={`availability-${product.id}`} 
                                        checked={product.isAvailable} 
                                        onCheckedChange={() => handleToggleAvailability(product.id, product.isAvailable)} 
                                        aria-label="Toggle availability"
                                    />
                                    <Label htmlFor={`availability-${product.id}`} className="text-xs">
                                        {product.isAvailable ? 'Disponib' : 'Pa Disponib'}
                                    </Label>
                                </div>
                                
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Èske ou sèten?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Aksyon sa a pa ka defèt. Sa pral efase pwodwi a nèt ansanm ak tout imaj li yo.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Anile</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteProduct(product)} className="bg-destructive hover:bg-destructive/90">Efase</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                   </CardContent>
                </Card>
                ))}
                </div>
            )}
        </div>
    )
}

function OffersTab({ userProfile }: { userProfile: UserProfile }) {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!userProfile.uid) return;
        const q = query(
            collection(db, "offers"), 
            where("productOwnerId", "==", userProfile.uid),
            orderBy("createdAt", "desc")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const offersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
            setOffers(offersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching offers: ", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [userProfile.uid]);

    const handleOfferResponse = async (offerId: string, newStatus: 'accepted' | 'rejected') => {
        const offerRef = doc(db, "offers", offerId);
        try {
            await updateDoc(offerRef, { status: newStatus });
            toast({ title: "Siksè!", description: `Òf la te ${newStatus === 'accepted' ? 'aksepte' : 'rejte'}.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Erè", description: "Pa t kapab mete estati òf la ajou." });
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (offers.length === 0) {
        return <p className="text-center text-muted-foreground p-8">Ou poko resevwa okenn òf.</p>;
    }

    return (
        <div className="space-y-4">
            {offers.map(offer => (
                <Card key={offer.id}>
                    <CardHeader>
                        <CardTitle className="text-base">
                            <Link href={`/market/all/${offer.productId}`} className="hover:underline">
                                {offer.productName}
                            </Link>
                        </CardTitle>
                        <CardDescription>Òf de: {offer.buyerName}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p>Pri orijinal: <span className="font-semibold">{offer.originalPrice}</span></p>
                        <p>Pri ofri: <span className="font-bold text-lg text-primary">{offer.offerPrice}</span></p>
                        <p className="flex items-center">Estati: 
                            <Badge variant={
                                offer.status === 'accepted' ? 'default' :
                                offer.status === 'rejected' ? 'destructive' : 'secondary'
                            } className="ml-2">
                                {offer.status === 'pending' && "An atant"}
                                {offer.status === 'accepted' && "Aksepte"}
                                {offer.status === 'rejected' && "Rejte"}
                            </Badge>
                        </p>
                    </CardContent>
                    {offer.status === 'pending' && (
                        <CardFooter className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleOfferResponse(offer.id, 'rejected')}>
                                <X className="mr-2 h-4 w-4" /> Rejte
                            </Button>
                            <Button size="sm" onClick={() => handleOfferResponse(offer.id, 'accepted')}>
                                <Check className="mr-2 h-4 w-4" /> Aksepte
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            ))}
        </div>
    );
}


function StoreInfoTab({ userProfile }: { userProfile: UserProfile }) {
    const { toast, dismiss } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<z.infer<typeof storeInfoSchema>>({
        resolver: zodResolver(storeInfoSchema),
        defaultValues: {
            businessName: userProfile.vendorApplication?.businessName || "",
            phone: userProfile.vendorApplication?.phone || "",
            address: userProfile.vendorApplication?.address || "",
            country: userProfile.vendorApplication?.country || "",
            department: userProfile.vendorApplication?.department || "",
            city: userProfile.vendorApplication?.city || "",
            state: userProfile.vendorApplication?.state || "",
            diasporaCity: userProfile.vendorApplication?.country !== 'Ayiti' ? userProfile.vendorApplication?.city : "",
            zipCode: userProfile.vendorApplication?.zipCode || "",
        }
    });
    
    const selectedCountry = form.watch("country");
    const selectedDepartment = form.watch("department") as Department | undefined;

    useEffect(() => {
        if (userProfile.vendorApplication) {
            form.reset({
                businessName: userProfile.vendorApplication.businessName || "",
                phone: userProfile.vendorApplication.phone || "",
                address: userProfile.vendorApplication.address || "",
                country: userProfile.vendorApplication.country || "",
                department: userProfile.vendorApplication.department || "",
                city: userProfile.vendorApplication.country === 'Ayiti' ? userProfile.vendorApplication.city : "",
                state: userProfile.vendorApplication.state || "",
                diasporaCity: userProfile.vendorApplication.country !== 'Ayiti' ? userProfile.vendorApplication.city : "",
                zipCode: userProfile.vendorApplication.zipCode || "",
            });
        }
    }, [userProfile, form]);

    const onSubmit = async (data: z.infer<typeof storeInfoSchema>) => {
        setIsSubmitting(true);
        const userRef = doc(db, "users", userProfile.uid);
        try {
            const cityToSave = data.country === 'Ayiti' ? data.city : data.diasporaCity;
            const vendorDataToUpdate: { [key: string]: any } = {
                "vendorApplication.businessName": data.businessName,
                "vendorApplication.phone": data.phone,
                "vendorApplication.address": data.address,
                "vendorApplication.country": data.country,
                "vendorApplication.department": data.department || "",
                "vendorApplication.city": cityToSave,
                "vendorApplication.state": data.state || "",
                "vendorApplication.zipCode": data.zipCode || "",
            };

            await updateDoc(userRef, vendorDataToUpdate);
            toast({ title: "Siksè!", description: "Enfòmasyon biznis ou an mete ajou."});
        } catch (error) {
            toast({ variant: "destructive", title: "Erè", description: "Pa t' kapab mete enfòmasyon an ajou."});
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !userProfile) return;

        const userRef = doc(db, "users", userProfile.uid);
        const logoPath = `logos/${userProfile.uid}/logo.png`;

        const { id: toastId } = toast({
            title: "Ap telechaje logo...",
            description: <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Tanpri tann...</div>,
            duration: 999999,
        });


        try {
            const storageRef = ref(storage, logoPath);
            await uploadBytes(storageRef, file);
            const logoUrl = await getDownloadURL(storageRef);
            
            await updateDoc(userRef, { "vendorApplication.logoUrl": logoUrl });
            
            dismiss(toastId);
            toast({ title: "Siksè!", description: "Logo ou an te telechaje." });

        } catch (error) {
            console.error(error);
             dismiss(toastId);
            toast({ variant: "destructive", title: "Erè", description: "Pa t' kapab telechaje logo a." });
        } finally {
            if (event.target) {
                event.target.value = "";
            }
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Enfòmasyon sou Biznis</CardTitle>
                <CardDescription>Jere enfòmasyon piblik magazen ou an.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={userProfile.vendorApplication?.logoUrl} alt={userProfile.vendorApplication?.businessName || ""} data-ai-hint="business logo"/>
                        <AvatarFallback className="text-4xl"><Building/></AvatarFallback>
                    </Avatar>
                     <Input 
                        id="logo-upload"
                        type="file" 
                        className="hidden" 
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleLogoChange}
                    />
                    <Button 
                        variant="outline" 
                        onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        Chanje Logo
                    </Button>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="businessName" render={({ field }) => (
                            <FormItem><FormLabel>Non Biznis</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Telefòn Kontak</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem><FormLabel>Adrès Biznis</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Peyi Kote w ye</FormLabel>
                                <Select onValueChange={(value) => {
                                    field.onChange(value);
                                    form.setValue('department', '');
                                    form.setValue('city', '');
                                    form.setValue('state', '');
                                    form.setValue('diasporaCity', '');
                                    form.setValue('zipCode', '');
                                }} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Chwazi peyi kote w ap viv" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Ayiti">Ayiti</SelectItem>
                                    {countries.map(country => (
                                        <SelectItem key={country.value} value={country.value}>
                                        {country.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         {selectedCountry === 'Ayiti' ? (
                            <>
                            <FormField
                                control={form.control}
                                name="department"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Depatman</FormLabel>
                                    <Select onValueChange={(value) => {
                                        field.onChange(value);
                                        form.setValue('city', '');
                                    }} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chwazi depatman w" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.keys(haitiGeography).map(dep => (
                                            <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            {selectedDepartment && (
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vil</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chwazi vil ou" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {haitiGeography[selectedDepartment].map(city => (
                                                <SelectItem key={city} value={city}>{city}</SelectItem>
                                            ))}
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            )}
                            </>
                        ) : selectedCountry ? (
                             <>
                                <FormField control={form.control} name="state" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Eta / Pwovens</FormLabel>
                                            <FormControl><Input placeholder="eg. Florida" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="diasporaCity" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vil</FormLabel>
                                            <FormControl><Input placeholder="eg. Miami" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="zipCode" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kòd Postal / Zip Code</FormLabel>
                                            <FormControl><Input placeholder="eg. 33166" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </>
                        ) : null}
                        <Button type="submit" disabled={isSubmitting}>
                           {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           {isSubmitting ? "Ap anrejistre..." : "Anrejistre Chanjman"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function AnalyticsTab({ userProfile }: { userProfile: UserProfile }) {
    const [stats, setStats] = useState({ totalProducts: 0, activeProducts: 0, totalViews: 0 });
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        if (!userProfile.uid) return;
        const q = query(collection(db, "products"), where("userId", "==", userProfile.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const products = querySnapshot.docs.map(doc => doc.data());
            const totalProducts = products.length;
            const activeProducts = products.filter(p => p.isAvailable).length;
            const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
            setStats({ totalProducts, activeProducts, totalViews });
            setLoading(false);
        });
        return () => unsubscribe();
    }, [userProfile.uid]);

    if(loading) {
       return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
                <CardHeader><CardTitle className="text-base">Total Pwodwi</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{stats.totalProducts}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-base">Pwodwi Disponib</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{stats.activeProducts}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-base">Total Vi</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{stats.totalViews}</p></CardContent>
            </Card>
        </div>
    )
}


// Main Dashboard Component
export function MerchantDashboard({ userProfile, userRequests, onLogout }: { userProfile: UserProfile, userRequests: Request[], onLogout: () => void }) {
    const verificationStatus = userProfile.vendorApplication?.status;

    const renderMainContent = () => {
        if (verificationStatus === 'rejected') {
            return (
                 <div className="flex items-center gap-3 rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-red-800">
                    <AlertTriangle className="h-6 w-6" />
                    <div>
                        <p className="font-bold">Kont ou an te rejte</p>
                        <p className="text-sm">Nou pa t kapab verifye kont ou an. Tanpri kontakte sipò pou plis enfòmasyon.</p>
                    </div>
                </div>
            )
        }
        
        return (
             <Tabs defaultValue="products" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="products"><Package className="mr-2 h-4 w-4" /> Pwodwi</TabsTrigger>
                    <TabsTrigger value="offers"><HandCoins className="mr-2 h-4 w-4" /> Òf Resevwa</TabsTrigger>
                    <TabsTrigger value="profile"><Store className="mr-2 h-4 w-4" /> Pwofil Biznis</TabsTrigger>
                    <TabsTrigger value="analytics"><BarChart2 className="mr-2 h-4 w-4" /> Estatistik</TabsTrigger>
                </TabsList>
                <TabsContent value="products" className="mt-4">
                    <MyProductsTab userProfile={userProfile} />
                </TabsContent>
                <TabsContent value="offers" className="mt-4">
                <OffersTab userProfile={userProfile} />
                </TabsContent>
                <TabsContent value="profile" className="mt-4">
                <StoreInfoTab userProfile={userProfile} />
                </TabsContent>
                <TabsContent value="analytics" className="mt-4">
                <AnalyticsTab userProfile={userProfile} />
                </TabsContent>
            </Tabs>
        )
    }

    return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
            <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-primary">Tablo Bò Machann</h2>
                 {verificationStatus === 'approved' && (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <ShieldCheck className="h-4 w-4 mr-1"/>
                        Verifye
                    </Badge>
                )}
                 {(verificationStatus === 'pending' || !userProfile.phoneVerified) && (
                     <Badge variant="secondary">
                        <ShieldQuestion className="h-4 w-4 mr-1 text-amber-600"/>
                        An atant verifikasyon
                    </Badge>
                )}
            </div>
            <p className="text-muted-foreground">Byenvini, {userProfile.vendorApplication?.businessName || userProfile.name}!</p>
        </div>
        <Button variant="outline" onClick={onLogout} size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Dekonekte
        </Button>
      </div>
      
      {renderMainContent()}
      
    </div>
  )
}

    
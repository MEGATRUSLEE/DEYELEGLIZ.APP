
"use client"

import { useState, useEffect } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { RequestCard } from "@/components/request-card"
import { PlusCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { UserProfile } from "../account/page"

export interface Request {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  requesterWhatsapp: string;
  userId: string;
  userName: string;
  city: string;
  country: string;
  views?: number;
  proposalCount?: number;
  createdAt: any;
}

const requestSchema = z.object({
  title: z.string().min(1, "Tit la obligatwa."),
  description: z.string().min(10, "Deskripsyon an dwe gen omwen 10 karaktè."),
  requesterWhatsapp: z.string().min(8, "Nimewo WhatsApp la obligatwa."),
  photo: z.any().optional(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

function RequestForm({ setOpen, userProfile }: { setOpen: (open: boolean) => void, userProfile: UserProfile | null }) {
  const { toast } = useToast();
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: "",
      description: "",
      requesterWhatsapp: userProfile?.phone || "",
      photo: null,
    }
  });

  useEffect(() => {
    if (userProfile?.phone) {
        form.setValue('requesterWhatsapp', userProfile.phone);
    }
  }, [userProfile, form]);

  const onSubmit: SubmitHandler<RequestFormValues> = async (data) => {
    if (!user) {
        toast({ variant: "destructive", title: "Erè", description: "Ou dwe konekte pou w fè yon demand." });
        return;
    }
    
    setIsSubmitting(true);

    try {
        // Fetch the latest user profile data on submit to ensure it's not null or stale
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
             toast({ variant: "destructive", title: "Erè", description: "Pwofil itilizatè a pa jwenn." });
             setIsSubmitting(false);
             return;
        }
        
        const currentUserProfile = userDocSnap.data() as UserProfile;

        let imageUrl: string | undefined = undefined;
      
        if (data.photo && data.photo.length > 0) {
            const file = data.photo[0];
            const storage = getStorage();
            const storageRef = ref(storage, `requests/${user.uid}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            imageUrl = await getDownloadURL(snapshot.ref);
        }
      
        const requestData: Omit<Request, 'id' | 'createdAt'> & { createdAt: any } = {
            title: data.title,
            description: data.description,
            requesterWhatsapp: data.requesterWhatsapp.replace(/\D/g, ''),
            userId: user.uid,
            userName: currentUserProfile.name || "Itilizatè Deye Legliz",
            city: currentUserProfile.city || "Pa presize",
            country: currentUserProfile.country || "Pa presize",
            createdAt: serverTimestamp(),
            views: 0,
            proposalCount: 0,
            ...(imageUrl && { imageUrl: imageUrl }),
        };

        await addDoc(collection(db, "requests"), requestData);

        toast({ 
            title: "Demand fèt avèk siksè!", 
            description: "Si yon machann gen sa w mande a, l ap kontakte w sou nimewo ou te bay la." 
        });
        form.reset();
        setOpen(false);
        router.push('/requests');

    } catch (error) {
      console.error("Error adding document: ", error);
      toast({ variant: "destructive", title: "Erè", description: "Pa t' kapab poste demand ou an. Eseye ankò." });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tit Demand</FormLabel>
                <FormControl>
                  <Input placeholder="eg. M'ap chèche yon..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deskripsyon</FormLabel>
                <FormControl>
                  <Textarea placeholder="Bay plis detay sou sa w'ap chèche a..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="requesterWhatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nimewo WhatsApp ou</FormLabel>
                <FormControl>
                   <Input placeholder="509 XX XX XX XX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="photo"
            render={({ field: { onChange, value, ...fieldProps } }) => (
              <FormItem>
                <FormLabel>Foto (si w genyen)</FormLabel>
                <FormControl>
                  <Input 
                    type="file" 
                    accept="image/*"
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
            {isSubmitting ? "Ap poste..." : "Poste Demand"}
            </Button>
        </form>
    </Form>
  )
}

export default function RequestsPage() {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, authLoading] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user && !authLoading) {
      const userDocRef = doc(db, "users", user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        }
      });
      return () => unsubscribe();
    }
  }, [user, authLoading]);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requestsData: Request[] = [];
      querySnapshot.forEach((doc) => {
        requestsData.push({ id: doc.id, ...doc.data() } as Request);
      });
      setRequests(requestsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching requests: ", error);
      toast({ variant: "destructive", title: "Erè Rezo", description: "Pa t' kapab chaje demand yo." });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleOpenDialog = () => {
    if (authLoading) return; 
    if (!user) {
      toast({
        variant: "destructive",
        title: "Konekte Dabò",
        description: "Ou dwe konekte pou w ka fè yon demand.",
      });
    } else {
      setOpen(true);
    }
  };


  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-background p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-primary">Demand Piblik</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog} disabled={authLoading}>
              {authLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-5 w-5" />
              )}
              Fè Demand
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Fè demand pa w la</DialogTitle>
            </DialogHeader>
            <RequestForm setOpen={setOpen} userProfile={userProfile} />
          </DialogContent>
        </Dialog>
      </header>
      <main className="p-4">
        {loading && (
           <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )}
        {!loading && requests.length === 0 && (
            <div className="text-center py-10">
                <p className="text-muted-foreground">Poko gen okenn demand.</p>
                <p className="text-muted-foreground">Fè yon demand pou w kòmanse!</p>
            </div>
        )}
        <div className="grid grid-cols-1 gap-4">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      </main>
    </div>
  )
}

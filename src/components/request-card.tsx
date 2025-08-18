
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
  DialogClose,
  DialogFooter,
  DialogDescription,
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
import { Button } from "@/components/ui/button"
import { db, auth, addDoc, collection, serverTimestamp, doc, updateDoc, increment, getDoc, type Timestamp } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import type { Request } from "@/app/requests/page"
import { MessageCircle, ShoppingBag, Loader2, MapPin, CalendarDays } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { UserProfile } from "@/app/account/page"

interface RequestCardProps {
  request: Request
}

function formatDate(timestamp: Timestamp | null | undefined): string {
    if (!timestamp) return 'Pa gen dat';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('fr-FR');
}

const proposalSchema = z.object({
  price: z.string().min(1, "Ou dwe antre yon pri."),
});

function ProposalForm({ request, userProfile, setOpen }: { request: Request, userProfile: UserProfile, setOpen: (open: boolean) => void }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof proposalSchema>>({
        resolver: zodResolver(proposalSchema),
        defaultValues: { price: "" },
    });

    const onSubmit = async (data: z.infer<typeof proposalSchema>) => {
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "proposals"), {
                requestId: request.id,
                requesterId: request.userId,
                vendorId: userProfile.uid,
                vendorName: userProfile.vendorApplication?.businessName,
                vendorPhone: userProfile.vendorApplication?.phone,
                proposedPrice: data.price,
                createdAt: serverTimestamp(),
            });

            // Increment proposal count on the request
            const requestRef = doc(db, "requests", request.id);
            await updateDoc(requestRef, {
                proposalCount: increment(1)
            });

            toast({ title: "Siksè!", description: "Pwopozisyon w la te voye bay moun ki fè demand la." });
            setOpen(false);

        } catch (error) {
            console.error("Error submitting proposal:", error);
            toast({ variant: "destructive", title: "Erè", description: "Pa t kapab voye pwopozisyon an." });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Pri ou pwopoze a (eg. 1500 Gdes / 15 USD)</FormLabel>
                            <FormControl>
                                <Input placeholder="Espesifye lajan an tou" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Anile</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Voye Pwopozisyon
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    )
}

export function RequestCard({ request }: RequestCardProps) {
  const [user, loading] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isVendor, setIsVendor] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const hasImage = request.imageUrl && request.imageUrl.trim() !== "";
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserProfile = async () => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const profile = docSnap.data() as UserProfile;
                setUserProfile(profile);
                setIsVendor(profile.isVendor || false);
            }
        }
    };
    if (user && !loading) {
        fetchUserProfile();
    }
  }, [user, loading]);

  const handleContactClick = async () => {
    const requestRef = doc(db, "requests", request.id);
    try {
      await updateDoc(requestRef, {
        views: increment(1)
      });
    } catch (error) {
      console.error("Error updating view count: ", error);
    }
  }

  const handleHaveItClick = () => {
      if (!user) {
          toast({ variant: "destructive", title: "Konekte Dabò", description: "Ou dwe gen yon kont machann pou reponn yon demand."});
          return;
      }
      if (!isVendor) {
          toast({ variant: "destructive", title: "Aksyon Rezeve", description: "Se sèlman machann ki ka reponn yon demand." });
          return;
      }
       if (user.uid === request.userId) {
          toast({ variant: "destructive", title: "Erè", description: "Ou pa ka reponn pwòp demand ou." });
          return;
      }
      setIsProposalModalOpen(true);
  }
  
  const whatsappLink = request.requesterWhatsapp 
    ? `https://wa.me/${request.requesterWhatsapp.replace(/\D/g, '')}?text=Bonjou, mwen ekri w konsènan demand ou te fè sou Deye Legliz pou: *${request.title}*`
    : "";

  return (
     <Card className="overflow-hidden flex flex-col w-full">
        <div className="flex items-start gap-4 p-4">
            {hasImage && (
                <div className="relative h-24 w-24 flex-shrink-0">
                    <Image
                        src={request.imageUrl!}
                        alt={request.title}
                        fill
                        sizes="(max-width: 768px) 30vw, 100px"
                        className="w-full h-full object-cover rounded-md"
                        data-ai-hint="product object"
                    />
                </div>
            )}
            <div className="flex-grow space-y-2">
                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">{request.title}</CardTitle>
                <CardDescription className="mt-1 line-clamp-3 text-sm">{request.description}</CardDescription>
                <div className="text-xs text-muted-foreground space-y-1 pt-1">
                    <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1.5"/> 
                        <span>{request.city}, {request.country}</span>
                    </div>
                     <div className="flex items-center">
                        <CalendarDays className="h-3 w-3 mr-1.5"/> 
                        <span>{formatDate(request.createdAt)}</span>
                    </div>
                </div>
            </div>
        </div>
      <CardFooter className="p-3 pt-0 mt-auto bg-slate-50 flex justify-end gap-2">
         {whatsappLink && (
            <Button asChild size="sm" style={{ backgroundColor: '#25D366', color: 'white' }} onClick={handleContactClick}>
              <Link
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4 mr-2"/>
                Kontakte
              </Link>
            </Button>
         )}
        <Dialog open={isProposalModalOpen} onOpenChange={setIsProposalModalOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleHaveItClick}>
                    <ShoppingBag className="h-4 w-4 mr-2"/>
                    W'ap Jwenn
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reponn a demand sa a</DialogTitle>
                    <DialogDescription>
                        Fè yon pwopozisyon pou: <span className="font-bold text-primary">{request.title}</span>.
                    </DialogDescription>
                </DialogHeader>
                {userProfile && <ProposalForm request={request} userProfile={userProfile} setOpen={setIsProposalModalOpen} />}
            </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}

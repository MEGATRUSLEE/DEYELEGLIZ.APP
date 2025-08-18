
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Trash2, GitPullRequest, Loader2, Phone, MessageCircle } from "lucide-react"
import { db, storage, collection, query, where, onSnapshot, doc, deleteDoc } from "@/lib/firebase"
import { ref, deleteObject } from "firebase/storage"
import { useToast } from "@/hooks/use-toast"
import type { Request } from "@/app/requests/page"
import Link from "next/link"

interface Proposal {
    id: string;
    vendorId: string;
    vendorName: string;
    vendorPhone: string;
    proposedPrice: string;
}

function ProposalsList({ requestId }: { requestId: string }) {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, "proposals"), where("requestId", "==", requestId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const proposalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Proposal));
            setProposals(proposalsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [requestId]);

    if (loading) {
        return <div className="flex justify-center items-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    }

    if (proposals.length === 0) {
        return <p className="text-center text-muted-foreground py-4">Ou poko resevwa okenn pwopozisyon.</p>;
    }
    
    return (
        <div className="space-y-3 pt-4 max-h-[300px] overflow-y-auto">
            {proposals.map(proposal => (
                <div key={proposal.id} className="p-3 border rounded-md flex justify-between items-center">
                    <div>
                        <p className="font-semibold">{proposal.vendorName}</p>
                        <p className="text-sm text-primary font-bold">{proposal.proposedPrice}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild size="icon" variant="outline" className="h-9 w-9">
                            <a href={`tel:${proposal.vendorPhone}`}><Phone className="h-4 w-4" /></a>
                        </Button>
                        <Button asChild size="icon" className="h-9 w-9" style={{ backgroundColor: '#25D366' }}>
                             <Link
                                href={`https://wa.me/${proposal.vendorPhone.replace(/\D/g, '')}?text=Bonjou, mwen enterese nan pwopozisyon ou te fè pou demand mwen an sou Deye Legliz.`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <MessageCircle className="h-4 w-4 text-white" />
                            </Link>
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}


interface UserRequestCardProps {
  request: Request
}

export function UserRequestCard({ request }: UserRequestCardProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasImage = request.imageUrl && request.imageUrl.trim() !== "";

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // If there's an image, delete it from Firebase Storage first
      if (hasImage) {
        try {
            const imageRef = ref(storage, request.imageUrl);
            await deleteObject(imageRef);
        } catch (storageError: any) {
            console.warn("Could not delete request image from storage:", storageError);
        }
      }

      // TODO: Delete all proposals associated with this request
      // This would require a Cloud Function for robust deletion, as client-side is not ideal.
      // For now, we'll just delete the request itself.

      // Delete the document from Firestore
      await deleteDoc(doc(db, "requests", request.id));
      
      toast({
        title: "Demand efase",
        description: "Demand ou an te efase avèk siksè.",
      });

    } catch (error) {
      console.error("Error deleting request:", error);
      toast({
        variant: "destructive",
        title: "Erè",
        description: "Pa t kapab efase demand la. Eseye ankò.",
      });
      setIsDeleting(false);
    }
  };
  
  const proposalCount = request.proposalCount || 0;

  return (
    <Card className="overflow-hidden w-full">
        <div className="flex items-start gap-4 p-4">
            {hasImage && (
                <div className="relative h-20 w-20 flex-shrink-0">
                    <Image
                        src={request.imageUrl!}
                        alt={request.title}
                        fill
                        className="rounded-md object-cover"
                        data-ai-hint="requested product"
                    />
                </div>
            )}
            <div className="flex-grow">
                <CardTitle className="text-base font-semibold">{request.title}</CardTitle>
                <CardDescription className="mt-1 line-clamp-2 text-xs">{request.description}</CardDescription>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{request.views || 0} vi</span>
                    </div>
                     <div className="flex items-center gap-1">
                        <GitPullRequest className="h-3 w-3" />
                        <span>{proposalCount} pwopozisyon</span>
                    </div>
                </div>
            </div>
        </div>
        <CardFooter className="flex items-center justify-end gap-2 p-3 pt-0 bg-secondary/30">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="default" size="sm" disabled={proposalCount === 0}>
                        Wè Pwopozisyon yo ({proposalCount})
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pwopozisyon pou "{request.title}"</DialogTitle>
                         <DialogDescription>
                           Men lis machann ki di yo gen pwodwi ou mande a.
                        </DialogDescription>
                    </DialogHeader>
                    <ProposalsList requestId={request.id} />
                </DialogContent>
            </Dialog>

             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Èske ou sèten?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Aksyon sa a pa ka defèt. Lè w efase demand la, tout pwopozisyon ki asosye avè l ap pèdi tou.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anile</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                             {isDeleting ? "Ap efase..." : "Konfime"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
    </Card>
  )
}

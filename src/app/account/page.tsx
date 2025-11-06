
"use client"

import { useState, useEffect } from "react"
import NextImage from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db, onSnapshot, doc, Timestamp, collection, query, where, orderBy } from "@/lib/firebase"
import { Loader2, LogOut, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { MerchantDashboard } from "@/components/merchant-dashboard"
import type { Request } from "@/app/requests/page"
import { UserRequestCard } from "@/components/user-request-card"
import Link from "next/link"


// Main User Profile structure for everyone
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone: string;
  country: string;
  city: string;
  isVendor: boolean;
  createdAt: Timestamp;
  phoneVerified?: boolean;

  // Fields specific to vendors/merchants, all grouped under one object
  vendorApplication?: {
    businessName: string;
    address: string;
    phone: string;
    country: string;
    department?: string;
    city: string;
    state?: string;
    zipCode?: string;
    logoUrl?: string;
    status: 'pending' | 'approved' | 'rejected';
    
    // Subscription fields are now nested here as well
    trial_start?: Timestamp;
    trial_expiration?: Timestamp;
    subscription_active?: boolean;
    subscription_expiration?: Timestamp;
    moncash_transaction_id?: string;
    payment_verified?: boolean;
  };
}

// Subscription status component for vendors
function SubscriptionStatus({ profile }: { profile: UserProfile }) {
    const { toast } = useToast();
    if (!profile.isVendor || !profile.vendorApplication) return null;

    const { subscription_active, subscription_expiration, trial_expiration, payment_verified } = profile.vendorApplication;

    const isSubscriptionActive = subscription_active ?? false;
    const expirationDate = subscription_expiration?.toDate();
    const trialExpirationDate = trial_expiration?.toDate();
    const now = new Date();
    const isTrial = trialExpirationDate && trialExpirationDate > now && !payment_verified;
    
    let daysLeft: number | null = null;
    if (expirationDate) {
        daysLeft = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }


    const handlePayment = () => {
        // TODO: This should trigger a Cloud Function to generate a MonCash payment URL
        toast({
            title: "Fonksyonalite anba devlopman",
            description: "Pati pou peman an poko fin pare nèt.",
        });
    };

    if (!expirationDate) {
        return null;
    }

    return (
        <Card className={isSubscriptionActive ? "border-green-500" : "border-red-500"}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {isSubscriptionActive ? <CheckCircle2 className="text-green-500" /> : <AlertCircle className="text-red-500" />}
                    Estati Abònman
                </CardTitle>
                <CardDescription>
                    {isSubscriptionActive 
                        ? `Abònman ou an aktif ${isTrial ? '(esè gratis)' : ''} jiska ${expirationDate.toLocaleDateString('fr-FR')}.`
                        : `Abònman ou an ekspire depi ${expirationDate.toLocaleDateString('fr-FR')}.`
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isSubscriptionActive && daysLeft !== null ? (
                    <div className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5" />
                        <span>Ou gen <span className="font-bold">{daysLeft > 0 ? daysLeft : 0} jou</span> ki rete.</span>
                    </div>
                ) : (
                    <p>Tanpri renouvle abònman ou pou w ka kontinye vann sou platfòm nan.</p>
                )}
            </CardContent>
            <CardFooter>
                 <Button onClick={handlePayment} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    {isSubscriptionActive ? 'Renouvle Abònman' : 'Peye ak MonCash'}
                </Button>
            </CardFooter>
        </Card>
    );
}

// User View for buyers
function BuyerDashboard({ profile, onLogout }: { profile: UserProfile, onLogout: () => void }) {
    const [userRequests, setUserRequests] = useState<Request[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!profile.uid) return;
        const q = query(collection(db, "requests"), where("userId", "==", profile.uid), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Request);
            setUserRequests(requestsData);
            setLoadingRequests(false);
        }, (error) => {
            console.error("Error fetching user requests:", error);
            toast({ variant: "destructive", title: "Erè", description: "Pa t kapab chaje demand ou yo."});
            setLoadingRequests(false);
        });
        return () => unsubscribe();
    }, [profile.uid, toast]);

    const handleBecomeVendor = () => {
        router.push('/auth?tab=signup&userType=vendor');
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-primary">Kont Mwen</h2>
                    <p className="text-muted-foreground">Byenvini, {profile.name}!</p>
                </div>
                 <Button variant="outline" onClick={onLogout} size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Dekonekte
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Enfòmasyon Pèsonèl</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p>Non: <span className="font-semibold">{profile.name}</span></p>
                    <p>Imèl: <span className="font-semibold">{profile.email}</span></p>
                    <p>Telefòn: <span className="font-semibold">{profile.phone}</span></p>
                    <p>Lokalite: <span className="font-semibold">{profile.city}, {profile.country}</span></p>
                    <p>Manm depi: <span className="font-semibold">{profile.createdAt ? profile.createdAt.toDate().toLocaleDateString('fr-FR') : 'Ap chaje...'}</span></p>
                </CardContent>
                 <CardFooter>
                    <Button onClick={handleBecomeVendor} className="w-full">
                        Tounen yon Machann
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Demand Mwen Te Fè</CardTitle>
                </CardHeader>
                <CardContent>
                    {loadingRequests ? <div className="text-center p-4"><Loader2 className="mx-auto h-6 w-6 animate-spin" /><p className="text-sm text-muted-foreground mt-2">Ap chaje demand ou yo...</p></div> :
                     userRequests.length > 0 ? (
                        <div className="space-y-4">
                           {userRequests.map(request => (
                               <UserRequestCard key={request.id} request={request} />
                           ))}
                        </div>
                     ) : (
                        <p className="text-muted-foreground text-center">Ou poko fè okenn demand.</p>
                     )
                    }
                </CardContent>
            </Card>

        </div>
    );
}

export default function AccountPage() {
  const [user, loading] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setProfileLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    if (user) {
      setProfileLoading(true);
      const userDocRef = doc(db, "users", user.uid);
      
      const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const profileData = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
          setUserProfile(profileData);
        } else {
             // This case might happen if the user record exists in Auth but not Firestore
             // This indicates a problem with signup, we'll treat them as logged out
             // and redirect them, which should not happen in a stable app.
             setUserProfile(null);
        }
        setProfileLoading(false);
      }, (error) => {
        console.error("Error fetching user profile:", error);
        toast({ variant: "destructive", title: "Erè", description: "Pa t kapab chaje pwofil ou a."});
        setProfileLoading(false);
      });

      return () => unsubscribeUser();

    } else if (!loading) {
      // User is not logged in, and auth state is resolved.
      // The main layout should handle redirection, but as a fallback:
      router.replace('/auth');
    }
  }, [user, loading, toast, router]);


  const handleLogout = async () => {
    await auth.signOut();
    setUserProfile(null); // Clear local profile state
    toast({ title: "Dekonekte", description: "Ou dekonekte avèk siksè." });
    router.push('/'); // Go to root, which will redirect to /auth
  }
  
  // This shows a loader while we are confirming auth state and fetching the profile
  if (loading || isProfileLoading || !userProfile) {
    return (
       <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Ap chaje...</p>
      </div>
    )
  }

  // Once profile is loaded, show the correct dashboard
  return (
    <div className="flex-1 p-4 md:p-6">
      {userProfile.isVendor ? (
        <>
            <MerchantDashboard userProfile={userProfile} onLogout={handleLogout}/>
            <div className="mt-6">
              <SubscriptionStatus profile={userProfile} />
            </div>
        </>
      ) : (
        <BuyerDashboard profile={userProfile} onLogout={handleLogout} />
      )}
    </div>
  )
}



"use client"

import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  auth, 
  db, 
  doc, 
  setDoc, 
  serverTimestamp, 
  updateProfile,
  Timestamp,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  getDoc,
  type User,
  signInWithEmailAndPassword
} from "@/lib/firebase"
import type { ConfirmationResult } from "firebase/auth"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Loader2, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { countries } from "@/lib/countries"
import type { UserProfile } from "@/app/account/page"

const haitiGeography = {
  "Lwès": ["Pòtoprens", "Kafou", "Dèlma", "Petyonvil", "Kenskòf", "Grangwav", "Tigwav", "Leyogàn", "Kabasè", "Lakayè", "Akayè"],
  "Latibonit": ["Gonayiv", "Sen Mak", "Vèrèt", "Dechalon", "Dèdin", "Lestè", "Ansagalèt"],
  "Nò": ["Okap", "Lenbe", "Pò Mago", "Akil dinò", "Plèn dinò", "Obòy", "Bastè"],
  "Nòdès": ["Fòliberte", "Wanament", "Twou dinò", "Karis", "Valyè"],
  "Nòdwès": ["Pòdepè", "Sen Lwi dinò", "Ansàfo", "Mòl Sen Nikola", "Latòti"],
  "Sant": ["Ench", "Mibalè", "Laskawobas", "Sèka Lasous", "Tomonn"],
  "Sid": ["Okay", "Aken", "Koto", "Pòsali", "Sen Lwi disid", "Lilavach"],
  "Sidès": ["Jakmèl", "Marigo", "Bèlans", "Benè", "Kòt Defè"],
  "Grandans": ["Jeremi", "Koray", "Ansdeno", "Pestèl", "Dam Mari"],
  "Nip": ["Miragwàn", "Ansavo", "Baradè", "Fondènèg"]
};
type Department = keyof typeof haitiGeography;


// Schemas
const signupSchema = z.object({
  userType: z.enum(["buyer", "vendor"]),
  name: z.string().min(3, "Non an dwe gen omwen 3 karaktè."),
  email: z.string().email("Adrès imèl la pa valid.").optional().or(z.literal('')),
  phone: z.string().min(8, "Nimewo telefòn pa valid."),
  country: z.string().min(1, "Ou dwe chwazi peyi w."),
  department: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  diasporaCity: z.string().optional(),
  // Vendor specific fields
  businessName: z.string().optional(),
  businessAddress: z.string().optional(),
  businessPhone: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.country === 'Ayiti') {
        if (!data.department) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ou dwe chwazi yon depatman.", path: ["department"] });
        if (!data.city) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ou dwe chwazi yon vil.", path: ["city"] });
    } else if (data.country && data.country !== 'Ayiti') {
        if (!data.state) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Eta/Pwovens obligatwa.", path: ["state"] });
        if (!data.diasporaCity) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vil la obligatwa.", path: ["diasporaCity"] });
    }
    if (data.userType === 'vendor') {
        if (!data.businessName || data.businessName.length < 3) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Non biznis la obligatwa.", path: ["businessName"] });
        if (!data.businessAddress || data.businessAddress.length < 10) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Adrès biznis la obligatwa (omwen 10 karaktè).", path: ["businessAddress"] });
        if (!data.businessPhone || data.businessPhone.length < 8) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Telefòn biznis la obligatwa.", path: ["businessPhone"] });
    }
});


const loginSchema = z.object({
  phone: z.string().min(1, "Nimewo telefòn lan obligatwa."),
});

type SignupFormValues = z.infer<typeof signupSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;


function SignupForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
    const { toast } = useToast()
    const [step, setStep] = useState<'form' | 'otp'>('form');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<SignupFormValues | null>(null);
    const [otp, setOtp] = useState('');
    const confirmationResultRef = useRef<ConfirmationResult | null>(null);
    const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
    const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
    
    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: { userType: "buyer", name: "", email: "", phone: "", country: "", department: "", city: "" }
    });
    const selectedCountry = form.watch("country");
    const selectedDepartment = form.watch("department") as Department | undefined;
    const userType = form.watch("userType");

    useEffect(() => {
        if (step === 'form' && recaptchaContainerRef.current && !recaptchaVerifierRef.current) {
            try {
                const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
                    'size': 'invisible',
                    'callback': () => { /* reCAPTCHA solved */ }
                });
                recaptchaVerifierRef.current = verifier;
            } catch (error) {
                console.error("Error creating RecaptchaVerifier:", error);
                toast({ variant: "destructive", title: "Erè reCAPTCHA", description: "Pa t' kapab inisyalize sekirite a."});
            }
        }
    }, [step, toast]);
    
    const formatPhoneNumberForAuth = (phone: string) => {
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 8 && !cleaned.startsWith('509')) return `+509${cleaned}`;
        if (!cleaned.startsWith('+')) return `+${cleaned}`;
        return cleaned;
    };

    const finalizeAccountCreation = async (user: User, data: SignupFormValues) => {
        const isVendor = data.userType === "vendor";
        const cityForProfile = data.country === 'Ayiti' ? data.city : data.diasporaCity;
        
        await updateProfile(user, { displayName: data.name });

        const userData: UserProfile = {
            uid: user.uid,
            email: data.email || "",
            name: data.name,
            phone: data.phone,
            country: data.country,
            city: cityForProfile || "",
            isVendor: isVendor,
            createdAt: serverTimestamp() as Timestamp,
            phoneVerified: true,
        };

        if (isVendor) {
            const now = new Date();
            const trialStart = Timestamp.fromDate(now);
            const trialExpiration = Timestamp.fromDate(new Date(new Date().setDate(now.getDate() + 30)));
            userData.vendorApplication = {
                businessName: data.businessName || "",
                address: data.businessAddress || "",
                phone: data.businessPhone || "",
                country: data.country || "",
                department: data.department || "",
                city: cityForProfile || "",
                state: data.state || "",
                zipCode: "",
                status: 'approved', // Auto-approved since phone is verified
                logoUrl: "",
                trial_start: trialStart,
                trial_expiration: trialExpiration,
                subscription_active: true,
                subscription_expiration: trialExpiration,
                payment_verified: false,
            };
        }
        await setDoc(doc(db, "users", user.uid), userData);
    };

    const handleVerifyOtp = async () => {
        if (!otp || !confirmationResultRef.current || !formData) return;
        setIsSubmitting(true);
        try {
            const result = await confirmationResultRef.current.confirm(otp);
            const user = result.user;
            await finalizeAccountCreation(user, formData);
            toast({ title: "Kont Kreye!", description: "Byenvini! Ou konekte kounye a." });
            onLoginSuccess();
        } catch (error) {
            toast({ variant: "destructive", title: "Erè", description: "Kòd la pa kòrèk, oswa li ekspire." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const onCaptchaVerify = async (data: SignupFormValues) => {
        setIsSubmitting(true);
        
        const verifier = recaptchaVerifierRef.current;
        if (!verifier) {
            toast({ variant: "destructive", title: "Erè", description: "reCAPTCHA pa pare. Eseye ankò." });
            setIsSubmitting(false);
            return;
        }

        const phoneNumber = formatPhoneNumberForAuth(data.phone);
        try {
            const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
            confirmationResultRef.current = confirmationResult;
            setFormData(data);
            setStep('otp');
            toast({ title: "Kòd Voye!", description: `Nou voye yon kòd verifikasyon sou nimewo ${phoneNumber}.` });
        } catch (error) {
            console.error("Error during signInWithPhoneNumber:", error);
            toast({ variant: "destructive", title: "Erè Lè n t ap Voye Kòd la", description: "Nou pa t kapab voye kòd la. Verifye nimewo a epi eseye ankò."});
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 'otp') {
        return (
            <div className="space-y-4">
                <p className="text-center text-muted-foreground">Antre kòd 6 chif ou te resevwa pa SMS la.</p>
                <Input 
                    type="tel" 
                    placeholder="••••••" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="text-center tracking-[0.5em] text-2xl font-semibold"
                />
                <Button onClick={handleVerifyOtp} disabled={isSubmitting || otp.length < 6} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verifye epi Kreye Kont
                </Button>
                <Button variant="link" onClick={() => setStep('form')} className="w-full">Tounen</Button>
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onCaptchaVerify)} className="space-y-4">
                <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
                <FormField control={form.control} name="userType" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ki tip de kont ou vle?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="buyer">Mwen vle Achte</SelectItem>
                            <SelectItem value="vendor">Mwen vle Vann (Machann)</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}/>
                <Separator />
                <p className="font-semibold text-center">Enfòmasyon Pèsonèl ou</p>

                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Non konplè ou</FormLabel><FormControl><Input placeholder="ekz. Jean-Claude Duvalier" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Nimewo Telefòn</FormLabel><FormControl><Input type="tel" placeholder="+509 XX XX XX XX" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Imèl ou (Opsyonèl)</FormLabel><FormControl><Input type="email" placeholder="non@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                
                <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Peyi Kote w ye</FormLabel>
                        <Select onValueChange={(value) => { field.onChange(value); form.setValue('department', ''); form.setValue('city', ''); }} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Chwazi peyi kote w ap viv" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Ayiti">Ayiti</SelectItem>
                            {countries.map(country => (<SelectItem key={country.value} value={country.value}>{country.value}</SelectItem>))}
                        </SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )}/>

                {selectedCountry === 'Ayiti' ? (
                <>
                    <FormField control={form.control} name="department" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Depatman</FormLabel>
                            <Select onValueChange={(value) => { field.onChange(value); form.setValue('city', ''); }} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Chwazi depatman w" /></SelectTrigger></FormControl>
                            <SelectContent>{Object.keys(haitiGeography).map(dep => (<SelectItem key={dep} value={dep}>{dep}</SelectItem>))}</SelectContent>
                            </Select><FormMessage />
                        </FormItem>
                    )}/>
                    {selectedDepartment && (
                        <FormField control={form.control} name="city" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vil</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Chwazi vil ou" /></SelectTrigger></FormControl>
                                <SelectContent>{haitiGeography[selectedDepartment].map(city => (<SelectItem key={city} value={city}>{city}</SelectItem>))}</SelectContent>
                                </Select><FormMessage />
                            </FormItem>
                        )}/>
                    )}
                </>
                ) : selectedCountry ? (
                <>
                    <FormField control={form.control} name="state" render={({ field }) => ( <FormItem><FormLabel>Eta / Pwovens</FormLabel><FormControl><Input placeholder="eg. Florida" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="diasporaCity" render={({ field }) => ( <FormItem><FormLabel>Vil</FormLabel><FormControl><Input placeholder="eg. Miami" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </>
                ) : null}

                {userType === "vendor" && (
                    <>
                        <Separator />
                        <p className="font-semibold text-center">Enfòmasyon sou Biznis ou</p>
                         <FormField control={form.control} name="businessName" render={({ field }) => ( <FormItem><FormLabel>Non Biznis ou</FormLabel><FormControl><Input placeholder="ekz. Boulangerie St-Marc" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                         <FormField control={form.control} name="businessAddress" render={({ field }) => ( <FormItem><FormLabel>Adrès Biznis ou</FormLabel><FormControl><Input placeholder="Nimewo, Non lari a, Vil" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="businessPhone" render={({ field }) => ( <FormItem><FormLabel>Telefòn Biznis ou</FormLabel><FormControl><Input type="tel" placeholder="+509 XX XX XX XX" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    </>
                )}

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Voye Kòd Verifikasyon an
                </Button>
            </form>
        </Form>
    );
}

function LoginForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
    const { toast } = useToast()
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [otp, setOtp] = useState('');
    const confirmationResultRef = useRef<ConfirmationResult | null>(null);
    const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
    const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { phone: "" }
    });
    
    const formatPhoneNumberForAuth = (phone: string) => {
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 8 && !cleaned.startsWith('509')) return `+509${cleaned}`;
        if (!cleaned.startsWith('+')) return `+${cleaned}`;
        return cleaned;
    };

     useEffect(() => {
        if (step === 'phone' && recaptchaContainerRef.current && !recaptchaVerifierRef.current) {
             try {
                const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
                    'size': 'invisible',
                    'callback': () => { /* reCAPTCHA solved */ }
                });
                recaptchaVerifierRef.current = verifier;
            } catch (error) {
                console.error("Error creating RecaptchaVerifier:", error);
                toast({ variant: "destructive", title: "Erè reCAPTCHA", description: "Pa t' kapab inisyalize sekirite a."});
            }
        }
    }, [step, toast]);

    const handleSendCode = async (data: LoginFormValues) => {
        setIsSubmitting(true);
        
        const verifier = recaptchaVerifierRef.current;
        if (!verifier) {
            toast({ variant: "destructive", title: "Erè", description: "reCAPTCHA pa pare. Eseye ankò." });
            setIsSubmitting(false);
            return;
        }

        const phoneNumber = formatPhoneNumberForAuth(data.phone);
        
        try {
            const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
            confirmationResultRef.current = confirmationResult;
            setStep('otp');
            toast({ title: "Kòd Voye!", description: `Nou voye yon kòd verifikasyon sou nimewo ${phoneNumber}.` });
        } catch (error: any) {
            console.error("Login error (send code):", error);
            toast({ variant: "destructive", title: "Erè", description: "Nou pa t kapab voye kòd la. Verifye nimewo a epi eseye ankò."});
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || !confirmationResultRef.current) return;
        setIsSubmitting(true);
        try {
            await confirmationResultRef.current.confirm(otp);
            toast({ title: "Konekte!", description: "Ou konekte avèk siksè." });
            onLoginSuccess();
        } catch (error) {
            toast({ variant: "destructive", title: "Erè", description: "Kòd la pa kòrèk, oswa li ekspire." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (step === 'otp') {
        return (
            <div className="space-y-4">
                <p className="text-center text-muted-foreground">Antre kòd 6 chif ou te resevwa pa SMS la.</p>
                <Input 
                    type="tel" 
                    placeholder="••••••" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="text-center tracking-[0.5em] text-2xl font-semibold"
                />
                <Button onClick={handleVerifyOtp} disabled={isSubmitting || otp.length < 6} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Konekte
                </Button>
                 <Button variant="link" onClick={() => setStep('phone')} className="w-full">Itilize yon lòt nimewo</Button>
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSendCode)} className="space-y-4">
                <div id="recaptcha-container-login" ref={recaptchaContainerRef}></div>
                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Nimewo Telefòn</FormLabel><FormControl><Input placeholder="+509 XX XX XX XX" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Send className="mr-2 h-4 w-4" />
                    Voye Kòd Koneksyon
                </Button>
            </form>
        </Form>
    )
}


export function AuthTabs({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Konekte</TabsTrigger>
                <TabsTrigger value="signup">Enskri</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <Card>
                <CardHeader>
                    <CardTitle>Konekte</CardTitle>
                    <CardDescription>Antre nimewo telefòn ou pou resevwa yon kòd koneksyon.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm onLoginSuccess={onLoginSuccess} />
                </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="signup">
                <Card>
                <CardHeader>
                    <CardTitle>Enskri</CardTitle>
                    <CardDescription>Kreye yon kont pou kòmanse achte oswa vann.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SignupForm onLoginSuccess={onLoginSuccess}/>
                </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  )
}

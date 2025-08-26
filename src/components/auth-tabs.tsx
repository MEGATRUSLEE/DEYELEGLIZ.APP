
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  auth, 
  db, 
  doc, 
  setDoc, 
  serverTimestamp, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  Timestamp,
} from "@/lib/firebase"

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
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { countries } from "@/lib/countries"
import type { UserProfile } from "@/app/account/page"

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


// Schemas
const signupSchema = z.object({
  userType: z.enum(["buyer", "vendor"]),
  name: z.string().min(3, "Non an dwe gen omwen 3 karaktè."),
  email: z.string().email("Adrès imèl la pa valid."),
  phone: z.string().min(8, "Nimewo telefòn pa valid."),
  password: z.string().min(6, "Modpas la dwe gen omwen 6 karaktè."),
  country: z.string().min(1, "Ou dwe chwazi peyi w."),
  department: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  diasporaCity: z.string().optional(),
  zipCode: z.string().optional(),
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
    // Business validation
    if (data.userType === 'vendor') {
        if (!data.businessName || data.businessName.length < 3) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Non biznis la obligatwa.", path: ["businessName"] });
        }
        if (!data.businessAddress || data.businessAddress.length < 10) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Adrès biznis la obligatwa (omwen 10 karaktè).", path: ["businessAddress"] });
        }
        if (!data.businessPhone || data.businessPhone.length < 8) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Telefòn biznis la obligatwa.", path: ["businessPhone"] });
        }
    }
});

const loginSchema = z.object({
  email: z.string().min(1, "Chan sa a obligatwa."),
  password: z.string().min(1, "Modpas la obligatwa."),
});

type SignupFormValues = z.infer<typeof signupSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;


function SignupForm({ onSignupSuccess }: { onSignupSuccess: () => void }) {
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false);
    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: { userType: "buyer", name: "", email: "", phone: "", password: "", country: "" }
    });
    const selectedCountry = form.watch("country");
    const selectedDepartment = form.watch("department") as Department | undefined;
    const userType = form.watch("userType");

    const handleSignupSubmit = async (data: SignupFormValues) => {
        setIsSubmitting(true);
        const isVendor = data.userType === "vendor";

        const sanitizedPhone = data.phone.replace(/\D/g, '');
        if (sanitizedPhone.length < 8) {
            toast({ variant: "destructive", title: "Erè Enskripsyon", description: "Nimewo telefòn lan pa valid." });
            setIsSubmitting(false);
            return;
        }
        const authEmail = `${sanitizedPhone}@deyelegliz.com`;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, authEmail, data.password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: data.name });
            
            const cityForProfile = data.country === 'Ayiti' ? (data.city || "") : (data.diasporaCity || "");

            let userData: UserProfile = {
                uid: user.uid,
                email: data.email,
                name: data.name,
                phone: data.phone,
                country: data.country,
                city: cityForProfile,
                isVendor: isVendor,
                createdAt: serverTimestamp() as Timestamp,
                phoneVerified: false,
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
                    city: cityForProfile,
                    state: data.state || "",
                    zipCode: data.zipCode || "",
                    status: 'pending',
                    logoUrl: "",
                    trial_start: trialStart,
                    trial_expiration: trialExpiration,
                    subscription_active: true,
                    subscription_expiration: trialExpiration,
                    payment_verified: false,
                };
            }
            
            await setDoc(doc(db, "users", user.uid), userData);

            toast({ title: "Kont Kreye!", description: "Ou ka konekte kounye a." });
            onSignupSuccess();

        } catch (error: any) {
            console.error("Signup error:", error);
            let description = "Yon erè pase. Tanpri eseye ankò.";
            if (error.code === 'auth/email-already-in-use') {
                description = "Nimewo telefòn sa a deja anrejistre. Eseye konekte pito.";
            } else if (error.code === 'auth/invalid-email') {
                description = `Fòma imèl la pa valid. Asire w nimewo telefòn lan kòrèk. (${authEmail})`;
            }
            toast({ variant: "destructive", title: "Erè Enskripsyon", description });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSignupSubmit)} className="space-y-4">
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
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Imèl ou</FormLabel><FormControl><Input type="email" placeholder="non@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Nimewo Telefòn Pèsonèl</FormLabel><FormControl><Input type="tel" placeholder="+509 XX XX XX XX" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Modpas</FormLabel><FormControl><Input type="password" placeholder="••••••" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>

                <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Peyi Kote w ye</FormLabel>
                        <Select onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('department', '');
                            form.setValue('city', '');
                        }} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Chwazi peyi kote w ap viv" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Ayiti">Ayiti</SelectItem>
                            {countries.map(country => (
                                <SelectItem key={country.value} value={country.value}>{country.value}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}/>

                {selectedCountry === 'Ayiti' ? (
                <>
                    <FormField control={form.control} name="department" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Depatman</FormLabel>
                            <Select onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue('city', '');
                            }} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Chwazi depatman w" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {Object.keys(haitiGeography).map(dep => (<SelectItem key={dep} value={dep}>{dep}</SelectItem>))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    {selectedDepartment && (
                        <FormField control={form.control} name="city" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vil</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Chwazi vil ou" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {haitiGeography[selectedDepartment].map(city => (<SelectItem key={city} value={city}>{city}</SelectItem>))}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    )}
                </>
                ) : selectedCountry ? (
                <>
                    <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem><FormLabel>Eta / Pwovens</FormLabel><FormControl><Input placeholder="eg. Florida" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="diasporaCity" render={({ field }) => (
                        <FormItem><FormLabel>Vil</FormLabel><FormControl><Input placeholder="eg. Miami" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </>
                ) : null}

                {userType === "vendor" && (
                    <>
                        <Separator />
                        <p className="font-semibold text-center">Enfòmasyon sou Biznis ou</p>
                         <FormField control={form.control} name="businessName" render={({ field }) => (
                            <FormItem><FormLabel>Non Biznis ou</FormLabel><FormControl><Input placeholder="ekz. Boulangerie St-Marc" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField control={form.control} name="businessAddress" render={({ field }) => (
                            <FormItem><FormLabel>Adrès Biznis ou</FormLabel><FormControl><Input placeholder="Nimewo, Non lari a, Vil" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="businessPhone" render={({ field }) => (
                            <FormItem><FormLabel>Telefòn Biznis ou</FormLabel><FormControl><Input type="tel" placeholder="+509 XX XX XX XX" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </>
                )}

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Kreye Kont
                </Button>
            </form>
        </Form>
    )
}

function LoginForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false);
    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" }
    });

    const handleLoginSubmit = async (data: LoginFormValues) => {
        setIsSubmitting(true);
        // Sanitize the phone number from the email field before attempting to sign in
        const sanitizedPhone = data.email.replace(/\D/g, '');
        const authEmail = `${sanitizedPhone}@deyelegliz.com`;

        try {
            await signInWithEmailAndPassword(auth, authEmail, data.password);
            toast({ title: "Konekte!", description: "Ou konekte avèk siksè." });
            onLoginSuccess();
        } catch (error: any) {
            console.error("Login error:", error);
            let description = "Imèl oswa modpas la pa kòrèk.";
            if(error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                description = "Kredansyèl yo pa kòrèk. Tanpri verifye yo."
            }
             if(error.code === 'auth/invalid-email') {
                description = `Fòma imèl la pa valid. Asire w ke ou antre nimewo telefòn ou sèlman. (${authEmail})`
            }
            toast({ variant: "destructive", title: "Erè Koneksyon", description });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLoginSubmit)} className="space-y-4">
                <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200">
                    <span className="font-bold">Nòt enpòtan:</span> Pou w konekte, tanpri antre sèlman nimewo telefòn ou te itilize pou enskri a nan chan ki anba la. Sistèm nan ap ajoute `@deyelegliz.com` pou ou.
                    <br/>
                    <span className="font-bold">Egzanp:</span> <span className="font-mono">50931813578</span>
                </div>

                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Nimewo Telefòn</FormLabel><FormControl><Input placeholder="509 XXXX XXXX" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Modpas</FormLabel><FormControl><Input type="password" placeholder="••••••" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Konekte
                </Button>
            </form>
        </Form>
    )
}

export function AuthTabs({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [activeTab, setActiveTab] = useState("login");

  const handleSignupSuccess = () => {
    setActiveTab("login"); 
    // This will switch the tab to login, so the user sees the login form after a successful signup.
  }

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
                    <CardDescription>Antre enfòmasyon ou pou w jwenn aksè nan kont ou.</CardDescription>
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
                    <SignupForm onSignupSuccess={handleSignupSuccess}/>
                </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  )
}

    
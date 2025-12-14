import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User as UserIcon, History, Settings, MapPin, Clock, Save, Loader2, Coins, TrendingUp, TrendingDown, ShoppingCart, Handshake } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import CreditDisplay from "@/components/CreditDisplay";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

interface ParkingHistoryItem {
  id: string;
  spot_id: string;
  latitude: number;
  longitude: number;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
}

interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
}

const Account = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [parkingHistory, setParkingHistory] = useState<ParkingHistoryItem[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const { credits, refreshCredits } = useCredits(user);

  const t = {
    de: {
      account: "Mein Konto",
      profile: "Profil",
      history: "Parkhistorie",
      settings: "Einstellungen",
      credits: "Credits",
      displayName: "Anzeigename",
      email: "E-Mail",
      memberSince: "Mitglied seit",
      save: "Speichern",
      saving: "Speichern...",
      saved: "Gespeichert",
      savedDesc: "Dein Profil wurde aktualisiert.",
      noHistory: "Noch keine Parkhistorie",
      noHistoryDesc: "Deine Parkvorgänge werden hier angezeigt.",
      noTransactions: "Noch keine Transaktionen",
      noTransactionsDesc: "Deine Credit-Transaktionen werden hier angezeigt.",
      duration: "Dauer",
      minutes: "Minuten",
      backToApp: "Zurück zur App",
      deleteAccount: "Konto löschen",
      deleteAccountDesc: "Diese Aktion kann nicht rückgängig gemacht werden.",
      currentBalance: "Aktuelles Guthaben",
      buyCredits: "Credits kaufen",
      transactionHistory: "Transaktionsverlauf",
      comingSoon: "Bald verfügbar",
    },
    en: {
      account: "My Account",
      profile: "Profile",
      history: "Parking History",
      settings: "Settings",
      credits: "Credits",
      displayName: "Display Name",
      email: "Email",
      memberSince: "Member since",
      save: "Save",
      saving: "Saving...",
      saved: "Saved",
      savedDesc: "Your profile has been updated.",
      noHistory: "No parking history yet",
      noHistoryDesc: "Your parking sessions will appear here.",
      noTransactions: "No transactions yet",
      noTransactionsDesc: "Your credit transactions will appear here.",
      duration: "Duration",
      minutes: "minutes",
      backToApp: "Back to App",
      deleteAccount: "Delete Account",
      deleteAccountDesc: "This action cannot be undone.",
      currentBalance: "Current Balance",
      buyCredits: "Buy Credits",
      transactionHistory: "Transaction History",
      comingSoon: "Coming Soon",
    },
  };

  const text = t[language];

  // Auth state management
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/app");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/app");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch profile and history
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setIsLoading(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else if (profileData) {
        setProfile(profileData);
        setDisplayName(profileData.display_name || "");
      }

      // Fetch parking history
      const { data: historyData, error: historyError } = await supabase
        .from("parking_history")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(50);

      if (historyError) {
        console.error("Error fetching parking history:", historyError);
      } else if (historyData) {
        setParkingHistory(historyData);
      }

      // Fetch credit transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError);
      } else if (transactionsData) {
        setCreditTransactions(transactionsData as CreditTransaction[]);
      }

      // Fetch credit packages
      const { data: packagesData, error: packagesError } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("is_active", true);

      if (packagesError) {
        console.error("Error fetching packages:", packagesError);
      } else if (packagesData) {
        setCreditPackages(packagesData as CreditPackage[]);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("user_id", user.id);

    setIsSaving(false);

    if (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Could not update profile.",
        variant: "destructive",
      });
    } else {
      toast({
        title: text.saved,
        description: text.savedDesc,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/app">
            <Button variant="ghost" size="icon" className="touch-target">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">{text.account}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="gap-2">
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{text.profile}</span>
            </TabsTrigger>
            <TabsTrigger value="credits" className="gap-2">
              <Coins className="h-4 w-4" />
              <span className="hidden sm:inline">{text.credits}</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">{text.history}</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{text.settings}</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  {text.profile}
                </CardTitle>
                <CardDescription>
                  {text.memberSince} {profile?.created_at ? format(new Date(profile.created_at), "MMMM yyyy", { locale: language === "de" ? de : undefined }) : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">{text.displayName}</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Max Mustermann"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{text.email}</Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full sm:w-auto">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {text.saving}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {text.save}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits">
            <div className="space-y-6">
              {/* Current Balance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    {text.currentBalance}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-primary">{credits.balance}</div>
                    <div className="text-muted-foreground">Credits</div>
                  </div>
                  {credits.balance < 5 && (
                    <p className="text-sm text-destructive mt-2">
                      {language === "de" 
                        ? "Niedriger Credit-Stand! Kaufe mehr Credits." 
                        : "Low credit balance! Buy more credits."}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Buy Credits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    {text.buyCredits}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {creditPackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Coins className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{pkg.name}</p>
                            <p className="text-sm text-muted-foreground">{pkg.credits} Credits</p>
                          </div>
                        </div>
                        <Button disabled>
                          {(pkg.price_cents / 100).toFixed(2)} € 
                          <span className="ml-1 text-xs opacity-70">({text.comingSoon})</span>
                        </Button>
                      </div>
                    ))}
                    {creditPackages.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        {language === "de" ? "Keine Pakete verfügbar" : "No packages available"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Transaction History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    {text.transactionHistory}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {creditTransactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Coins className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">{text.noTransactions}</p>
                      <p className="text-sm">{text.noTransactionsDesc}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {creditTransactions.map((tx) => {
                        const isPositive = tx.amount > 0;
                        const Icon = tx.type.includes('handshake') ? Handshake : isPositive ? TrendingUp : TrendingDown;
                        
                        return (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                isPositive ? 'bg-success/10' : 'bg-destructive/10'
                              }`}>
                                <Icon className={`h-5 w-5 ${isPositive ? 'text-success' : 'text-destructive'}`} />
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {tx.description || tx.type}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(tx.created_at), "dd.MM.yyyy HH:mm", { 
                                    locale: language === "de" ? de : undefined 
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className={`font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                              {isPositive ? '+' : ''}{tx.amount}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  {text.history}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {parkingHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">{text.noHistory}</p>
                    <p className="text-sm">{text.noHistoryDesc}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {parkingHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {format(new Date(item.started_at), "dd.MM.yyyy HH:mm", { locale: language === "de" ? de : undefined })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                            </p>
                          </div>
                        </div>
                        {item.duration_minutes && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {item.duration_minutes} {text.minutes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {text.settings}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                  <h3 className="font-medium text-destructive">{text.deleteAccount}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{text.deleteAccountDesc}</p>
                  <Button variant="destructive" size="sm" className="mt-3" disabled>
                    {text.deleteAccount}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Account;

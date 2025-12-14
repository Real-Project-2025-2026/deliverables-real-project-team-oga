import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User as UserIcon, History, Settings, MapPin, Clock, Save, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

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

const Account = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [parkingHistory, setParkingHistory] = useState<ParkingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const t = {
    de: {
      account: "Mein Konto",
      profile: "Profil",
      history: "Parkhistorie",
      settings: "Einstellungen",
      displayName: "Anzeigename",
      email: "E-Mail",
      memberSince: "Mitglied seit",
      save: "Speichern",
      saving: "Speichern...",
      saved: "Gespeichert",
      savedDesc: "Dein Profil wurde aktualisiert.",
      noHistory: "Noch keine Parkhistorie",
      noHistoryDesc: "Deine Parkvorgänge werden hier angezeigt.",
      duration: "Dauer",
      minutes: "Minuten",
      backToApp: "Zurück zur App",
      deleteAccount: "Konto löschen",
      deleteAccountDesc: "Diese Aktion kann nicht rückgängig gemacht werden.",
    },
    en: {
      account: "My Account",
      profile: "Profile",
      history: "Parking History",
      settings: "Settings",
      displayName: "Display Name",
      email: "Email",
      memberSince: "Member since",
      save: "Save",
      saving: "Saving...",
      saved: "Saved",
      savedDesc: "Your profile has been updated.",
      noHistory: "No parking history yet",
      noHistoryDesc: "Your parking sessions will appear here.",
      duration: "Duration",
      minutes: "minutes",
      backToApp: "Back to App",
      deleteAccount: "Delete Account",
      deleteAccountDesc: "This action cannot be undone.",
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="gap-2">
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{text.profile}</span>
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

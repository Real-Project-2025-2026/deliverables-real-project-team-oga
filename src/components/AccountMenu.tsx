import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { LogOut, User as UserIcon, ChevronDown, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import CreditDisplay from "@/components/CreditDisplay";

interface AccountMenuProps {
  user: User;
  onSignOut: () => void;
  creditBalance?: number;
}

const AccountMenu = ({ user, onSignOut, creditBalance = 0 }: AccountMenuProps) => {
  const [displayName, setDisplayName] = useState<string>(user.email?.split("@")[0] || "User");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.display_name) {
        setDisplayName(data.display_name);
      }
    };

    fetchProfile();

    // Subscribe to profile changes
    const channel = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).display_name) {
            setDisplayName((payload.new as any).display_name);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  return (
    <div className="flex items-center gap-2">
      <CreditDisplay balance={creditBalance} showLabel />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 touch-target hover:bg-transparent">
            <div className="h-7 w-7 rounded-full bg-primary/10 hover:bg-primary flex items-center justify-center transition-all duration-200 [&:hover>svg]:text-white">
              <UserIcon className="h-4 w-4 text-primary transition-colors duration-200" />
            </div>
            <span className="hidden sm:inline max-w-[100px] truncate text-foreground">{displayName}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/account" className="flex items-center cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Mein Konto
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default AccountMenu;

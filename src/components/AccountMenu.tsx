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

interface AccountMenuProps {
  user: User;
  onSignOut: () => void;
}

const AccountMenu = ({ user, onSignOut }: AccountMenuProps) => {
  const displayName = user.email?.split("@")[0] || "User";
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 touch-target hover:bg-transparent">
          <div className="h-7 w-7 rounded-full bg-primary/10 hover:bg-primary flex items-center justify-center transition-all duration-200 group/icon">
            <UserIcon className="h-4 w-4 text-primary group-hover/icon:text-primary-foreground transition-colors duration-200" />
          </div>
          <span className="hidden sm:inline max-w-[100px] truncate text-foreground">{displayName}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Account</p>
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
  );
};

export default AccountMenu;

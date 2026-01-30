import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-game";
import { Dices, Coins, LogOut, Backpack, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InventoryDrawer } from "./InventoryDrawer";

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { data: profile } = useProfile();

  const balance = profile ? (profile.balance / 100).toFixed(2) : "0.00";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/50 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <Dices className="w-8 h-8 text-primary relative z-10 transition-transform group-hover:rotate-180 duration-500" />
          </div>
          <span className="font-display text-2xl font-bold tracking-wider text-white">
            CASE<span className="text-primary">BATTLE</span>
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {/* Balance Display */}
              <div className="hidden sm:flex items-center gap-2 bg-black/40 border border-white/10 px-4 py-1.5 rounded-full">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="font-mono font-bold text-yellow-500">${balance}</span>
              </div>

              {/* Inventory */}
              <InventoryDrawer />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 border border-white/10 hover:bg-white/5">
                    {user?.profileImageUrl ? (
                      <img src={user.profileImageUrl} alt={user.firstName || "User"} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1a1a2e] border-white/10 text-white">
                  <div className="p-2 border-b border-white/10 mb-2">
                    <p className="font-bold">{user?.firstName || "Player"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuItem onClick={() => logout()} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="font-display font-bold tracking-wide bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:shadow-[0_0_25px_rgba(168,85,247,0.7)] transition-all"
            >
              LOGIN TO PLAY
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

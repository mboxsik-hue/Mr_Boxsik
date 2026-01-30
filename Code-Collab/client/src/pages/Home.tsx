import { useState } from "react";
import { useCases, useProfile } from "@/hooks/use-game";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Box, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const { data: cases, isLoading } = useCases();
  const { data: profile } = useProfile();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#131320] text-foreground">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        
        {/* Stats Bar */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <StatsCard 
            icon={<Box className="w-6 h-6 text-primary" />}
            label="Total Opened"
            value={profile?.totalOpened || 0}
            color="primary"
          />
          <StatsCard 
            icon={<Trophy className="w-6 h-6 text-yellow-500" />}
            label="Best Drop"
            value={`$${((profile?.bestDrop || 0) / 100).toFixed(2)}`}
            color="yellow"
          />
          <StatsCard 
            icon={<TrendingUp className="w-6 h-6 text-green-500" />}
            label="Current Balance"
            value={`$${((profile?.balance || 0) / 100).toFixed(2)}`}
            color="green"
          />
        </section>

        {/* Hero Section */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl md:text-7xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-white to-secondary drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            PROVE YOUR LUCK
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Open premium cases, collect legendary items, and build your inventory. 
            Fair odds, instant withdrawals, and daily rewards.
          </p>
        </div>

        {/* Cases Grid */}
        <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
          <span className="w-1 h-8 bg-primary rounded-full block" />
          AVAILABLE CASES
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl bg-white/5" />
            ))}
          </div>
        ) : !cases?.length ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Cases Available</h3>
            <p className="text-muted-foreground">Check back later for new drops.</p>
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            {cases.map((gameCase) => (
              <motion.div key={gameCase.id} variants={item}>
                <Link href={`/case/${gameCase.id}`} className="block h-full">
                  <div className="group relative h-full glass-panel rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:-translate-y-1 hover:border-primary/50">
                    {/* Price Tag */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 font-mono font-bold text-sm text-yellow-500 z-10 group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                      ${(gameCase.price / 100).toFixed(2)}
                    </div>

                    {/* Image Area */}
                    <div className="p-8 flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="text-6xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transform transition-transform group-hover:scale-110 duration-300">
                        {gameCase.image}
                      </div>
                    </div>

                    {/* Info Area */}
                    <div className="p-4 border-t border-white/10 bg-black/20">
                      <h3 className="text-lg font-bold truncate pr-2 group-hover:text-primary transition-colors">
                        {gameCase.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        Contains {gameCase.items?.length || "?"} items
                      </p>
                      
                      <Button className="w-full mt-4 bg-white/5 hover:bg-primary hover:text-white border border-white/10 transition-all font-bold">
                        OPEN CASE
                      </Button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/40 py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2024 CaseBattle. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Provably Fair</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatsCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  const colorMap: Record<string, string> = {
    primary: "border-primary/20 bg-primary/5",
    yellow: "border-yellow-500/20 bg-yellow-500/5",
    green: "border-green-500/20 bg-green-500/5",
  };

  return (
    <div className={cn("glass-panel p-4 rounded-xl flex items-center gap-4 border", colorMap[color])}>
      <div className="p-3 bg-black/40 rounded-lg border border-white/5">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{label}</p>
        <p className="text-2xl font-mono font-bold">{value}</p>
      </div>
    </div>
  );
}

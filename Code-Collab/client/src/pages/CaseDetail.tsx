import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useCase, useOpenCase, useProfile } from "@/hooks/use-game";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/Header";
import { Roulette } from "@/components/Roulette";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Info, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import confetti from "canvas-confetti";

export default function CaseDetail() {
  const [, params] = useRoute("/case/:id");
  const caseId = parseInt(params?.id || "0");

  const { data: gameCase, isLoading: isCaseLoading } = useCase(caseId);
  const { data: profile } = useProfile();
  const { isAuthenticated } = useAuth();

  const openCaseMutation = useOpenCase();

  const [isSpinning, setIsSpinning] = useState(false);
  const [winningResult, setWinningResult] = useState<any>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  // Функция для безопасного получения данных предмета
  const getSafeItem = (item: any) => {
    if (!item) {
      return {
        id: 'unknown',
        name: 'Unknown Item',
        rarity: 'common',
        image: '❓',
        price: 0
      };
    }

    return {
      id: item.id || 'unknown',
      name: item.name || 'Unknown Item',
      rarity: item.rarity || 'common',
      image: item.image || item.emoji || '❓',
      price: item.price || 0,
      ...item
    };
  };

  const handleOpen = () => {
    if (!gameCase) return;
    setIsSpinning(true);
    setWinningResult(null);
    openCaseMutation.mutate(caseId, {
      onSuccess: (data) => {
        // Обрабатываем результат с безопасными данными
        const safeData = {
          ...data,
          item: getSafeItem(data?.item)
        };
        setWinningResult(safeData);
      },
      onError: () => {
        setIsSpinning(false);
      }
    });
  };

  const handleSpinComplete = () => {
    setIsSpinning(false);
    if (winningResult?.item) {
      setShowResultDialog(true);

      // Trigger confetti if rarity is epic or legendary
      const rarity = winningResult.item.rarity;
      if (rarity === 'epic' || rarity === 'legendary') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: rarity === 'legendary' ? ['#FFD700', '#FFA500'] : ['#A855F7', '#D8B4FE']
        });
      }
    }
  };

  if (isCaseLoading) {
    return (
      <div className="min-h-screen bg-[#131320] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!gameCase) {
    return (
      <div className="min-h-screen bg-[#131320] flex flex-col items-center justify-center text-center p-4">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-display font-bold mb-2">Case Not Found</h1>
        <p className="text-muted-foreground mb-8">This case doesn't exist or has been removed.</p>
        <Link href="/">
          <Button>Back to Cases</Button>
        </Link>
      </div>
    );
  }

  const canAfford = profile ? profile.balance >= gameCase.price : false;

  // Безопасно обрабатываем предметы кейса
  const safeItems = (gameCase.items || []).map(({ item, chance }) => ({
    item: getSafeItem(item),
    chance: chance || 0
  }));

  // Получаем предметы для рулетки
  const rouletteItems = safeItems.map(({ item }) => item);

  return (
    <div className="min-h-screen flex flex-col bg-[#131320] text-foreground">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6 pl-0 hover:pl-2 transition-all gap-2 text-muted-foreground hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to Cases
          </Button>
        </Link>

        {/* Top Info */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] animate-pulse">
            {gameCase.image || '📦'}
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-2 uppercase tracking-wide">
            {gameCase.name || 'Unknown Case'}
          </h1>
          <p className="text-xl font-mono text-yellow-500 font-bold mb-4">
            ${((gameCase.price || 0) / 100).toFixed(2)}
          </p>
        </div>

        {/* Roulette Area */}
        <div className="mb-12">
          <Roulette 
            items={rouletteItems}
            winningItem={winningResult?.item || null}
            isSpinning={isSpinning}
            onSpinComplete={handleSpinComplete}
          />

          <div className="flex justify-center mt-8">
            {isAuthenticated ? (
              <Button 
                size="lg" 
                onClick={handleOpen}
                disabled={isSpinning || !canAfford || openCaseMutation.isPending}
                className={cn(
                  "min-w-[200px] h-14 text-lg font-bold tracking-wider relative overflow-hidden transition-all",
                  canAfford 
                    ? "bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]" 
                    : "bg-muted cursor-not-allowed opacity-50"
                )}
              >
                {isSpinning || openCaseMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    OPENING...
                  </span>
                ) : !canAfford ? (
                  "INSUFFICIENT FUNDS"
                ) : (
                  "OPEN CASE"
                )}
              </Button>
            ) : (
               <Button 
                size="lg"
                onClick={() => window.location.href = "/api/login"}
                className="min-w-[200px] h-14 text-lg font-bold bg-primary"
              >
                LOGIN TO OPEN
              </Button>
            )}
          </div>
        </div>

        {/* Case Contents */}
        <div className="border-t border-white/10 pt-8">
          <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2 text-muted-foreground">
            <Info className="w-5 h-5" />
            CASE CONTENTS
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {safeItems.map(({ item, chance }) => (
              <div 
                key={item.id}
                className={cn(
                  "relative group rounded-lg border p-4 flex flex-col items-center gap-3 bg-black/20 hover:bg-black/40 transition-colors",
                  `bg-rarity-${item.rarity}`
                )}
              >
                {/* Chance Badge */}
                {chance > 0 && (
                  <div className="absolute top-2 right-2 text-[10px] font-mono bg-black/60 px-1.5 py-0.5 rounded text-white/70">
                    {chance}%
                  </div>
                )}

                <div className="text-4xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">
                  {item.image}
                </div>

                <div className="text-center w-full">
                  <div className={cn(
                    "text-xs font-bold uppercase truncate",
                    `rarity-${item.rarity}`
                  )}>
                    {item.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ${(item.price / 100).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-sm bg-[#1a1a2e] border-primary/20 text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-xl">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              YOU WON!
            </DialogTitle>
          </DialogHeader>

          {winningResult?.item && (
            <>
              <div className={cn(
                "mx-auto w-24 h-24 rounded-full flex items-center justify-center text-4xl mb-4",
                `bg-rarity-${winningResult.item.rarity} border-2`,
                winningResult.item.rarity === 'legendary' ? 'border-yellow-500' :
                winningResult.item.rarity === 'epic' ? 'border-purple-500' :
                winningResult.item.rarity === 'rare' ? 'border-blue-500' : 'border-gray-500'
              )}>
                {winningResult.item.image}
              </div>

              <div className="space-y-2 mb-6">
                <h3 className="text-lg font-bold uppercase">{winningResult.item.name}</h3>
                <div className={cn(
                  "text-sm font-bold uppercase",
                  `rarity-${winningResult.item.rarity}`
                )}>
                  {winningResult.item.rarity}
                </div>
                <div className="text-2xl font-mono text-yellow-500 font-bold">
                  ${((winningResult.item.price || 0) / 100).toFixed(2)}
                </div>
              </div>

              <DialogFooter className="justify-center">
                <Button 
                  onClick={() => setShowResultDialog(false)}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  CONTINUE
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState } from "react";
import { Backpack, Loader2, DollarSign, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInventory, useSellItem, useSellAll } from "@/hooks/use-game";
import { cn } from "@/lib/utils";

export function InventoryDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: inventory, isLoading } = useInventory();
  const sellItem = useSellItem();
  const sellAll = useSellAll();

  // Filter out sold items just in case backend returns them (though route logic implies it might filter)
  // Assuming backend returns available items based on typical inventory logic, but if not we filter.
  // The schema has isSold flag.
  const activeItems = inventory?.filter(i => !i.isSold) || [];
  
  const totalValue = activeItems.reduce((acc, i) => acc + i.item.price, 0);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/5 relative">
          <Backpack className="w-4 h-4" />
          <span className="hidden sm:inline">Inventory</span>
          {activeItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
              {activeItems.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-[#131320] border-l border-white/10 text-white flex flex-col">
        <SheetHeader className="mb-4">
          <SheetTitle className="font-display text-2xl tracking-wide flex items-center gap-2">
            <Backpack className="w-5 h-5 text-primary" />
            YOUR INVENTORY
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Manage your items. Sell them for balance to open more cases.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : activeItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Backpack className="w-12 h-12 opacity-20" />
            <p>Your inventory is empty.</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="grid grid-cols-2 gap-3 pb-4">
              {activeItems.map((userItem) => (
                <div 
                  key={userItem.id}
                  className={cn(
                    "relative group rounded-lg border p-3 flex flex-col items-center gap-2 transition-all hover:bg-white/5",
                    `bg-rarity-${userItem.item.rarity}`
                  )}
                >
                  <div className="text-3xl drop-shadow-md">{userItem.item.image}</div>
                  <div className="text-center w-full">
                    <div className={cn(
                      "text-xs font-bold uppercase truncate",
                      `rarity-${userItem.item.rarity}`
                    )}>
                      {userItem.item.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      ${(userItem.item.price / 100).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg backdrop-blur-[1px]">
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="h-8 text-xs gap-1"
                      onClick={() => sellItem.mutate(userItem.id)}
                      disabled={sellItem.isPending}
                    >
                      {sellItem.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <DollarSign className="w-3 h-3" />
                          Sell
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <SheetFooter className="mt-auto pt-4 border-t border-white/10">
          <div className="w-full flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Value</span>
              <span className="font-mono text-xl font-bold text-yellow-500">
                ${(totalValue / 100).toFixed(2)}
              </span>
            </div>
            <Button 
              className="flex-1 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/50"
              onClick={() => sellAll.mutate()}
              disabled={activeItems.length === 0 || sellAll.isPending}
            >
              {sellAll.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Sell All Items
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

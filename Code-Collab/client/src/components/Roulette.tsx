import { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { Item } from "@shared/schema";
import { cn } from "@/lib/utils";

interface RouletteProps {
  items: Item[]; // Potential items in the case
  winningItem: Item | null; // The item determined by backend
  isSpinning: boolean;
  onSpinComplete: () => void;
}

export function Roulette({ items, winningItem, isSpinning, onSpinComplete }: RouletteProps) {
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayItems, setDisplayItems] = useState<Item[]>([]);
  
  // Configuration
  const CARD_WIDTH = 140; // width + gap
  const VISIBLE_CARDS = 5;
  const SPIN_DURATION = 6; // seconds

  useEffect(() => {
    // Prepare the strip of items for the animation
    if (!winningItem) {
      // Static display when not spinning
      setDisplayItems([...items].sort(() => Math.random() - 0.5).slice(0, 10));
      return;
    }

    // Create a long strip of random items, ending with the winner + buffer
    const randomFill = Array(70).fill(null).map(() => items[Math.floor(Math.random() * items.length)]);
    const buffer = Array(5).fill(null).map(() => items[Math.floor(Math.random() * items.length)]);
    
    // The winning item needs to land exactly in the center
    // Center is at index: randomFill.length
    setDisplayItems([...randomFill, winningItem, ...buffer]);
    
  }, [winningItem, items]);

  useEffect(() => {
    if (isSpinning && winningItem) {
      const targetIndex = 70; // Matches randomFill.length above
      
      // Calculate scroll distance to center the winning item
      // We want the winning item to be at the center of the viewport
      // Center of container = containerWidth / 2
      // Center of card = CARD_WIDTH / 2
      // Offset = (targetIndex * CARD_WIDTH) - (containerWidth / 2) + (CARD_WIDTH / 2)
      
      // Simplified: Just scroll to position it somewhat centered with some randomness for realism
      // But for a fair roulette, it MUST land on the winner.
      // Let's rely on fixed math.
      
      // Adding a small random offset within the card width to make it not land perfectly centered every time
      const randomOffset = Math.floor(Math.random() * (CARD_WIDTH * 0.8)) - (CARD_WIDTH * 0.4); 
      
      const distance = -(targetIndex * CARD_WIDTH) + (containerRef.current?.clientWidth || 0) / 2 - (CARD_WIDTH / 2) + randomOffset;

      controls.start({
        x: distance,
        transition: {
          duration: SPIN_DURATION,
          ease: [0.15, 0.85, 0.35, 1.0], // Custom bezier for "spin up then slow down" feel
        }
      }).then(() => {
        onSpinComplete();
      });
    } else if (!isSpinning) {
      controls.set({ x: 0 });
    }
  }, [isSpinning, winningItem, controls, onSpinComplete]);

  return (
    <div className="relative w-full max-w-4xl mx-auto overflow-hidden bg-black/60 border-y-2 border-primary/50 h-48 mb-8 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]">
      {/* Center Marker */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-yellow-500 z-20 -translate-x-1/2 shadow-[0_0_10px_#eab308]" />
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 border-l-[10px] border-r-[10px] border-t-[10px] border-transparent border-t-yellow-500 z-20" />
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 border-l-[10px] border-r-[10px] border-b-[10px] border-transparent border-b-yellow-500 z-20" />

      {/* Items Strip */}
      <motion.div 
        ref={containerRef}
        animate={controls}
        initial={{ x: 0 }}
        className="flex items-center h-full absolute left-0 pl-[50%]" // Start from center
      >
        {displayItems.map((item, index) => (
          <div 
            key={`${item.id}-${index}`}
            className={cn(
              "flex-shrink-0 w-32 h-32 mx-1.5 rounded-lg border-2 bg-black/40 flex flex-col items-center justify-center relative group overflow-hidden",
              `bg-rarity-${item.rarity}`, // Custom class we defined in CSS
            )}
          >
            {/* Rarity Glow */}
            <div className={cn(
              "absolute inset-0 opacity-20",
              `rarity-${item.rarity}`
            )} />
            
            <div className="text-4xl mb-2 relative z-10 drop-shadow-md transform group-hover:scale-110 transition-transform">{item.image}</div>
            <div className="px-2 text-center w-full relative z-10">
              <div className={cn(
                "text-[10px] font-bold uppercase tracking-wider truncate",
                `rarity-${item.rarity}`
              )}>
                {item.name}
              </div>
            </div>
          </div>
        ))}
      </motion.div>
      
      {/* Gradients to fade edges */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
    </div>
  );
}

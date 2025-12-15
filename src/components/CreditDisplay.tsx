import { Coins, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

interface CreditDisplayProps {
  balance: number;
  className?: string;
  showLabel?: boolean;
  lastChange?: { amount: number; type: 'gain' | 'loss' } | null;
}

const CreditDisplay = ({ balance, className, showLabel = false, lastChange }: CreditDisplayProps) => {
  const isLow = balance < 5;
  const [showChange, setShowChange] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevBalanceRef = useRef(balance);

  useEffect(() => {
    if (lastChange) {
      setShowChange(true);
      setIsAnimating(true);
      
      const hideTimer = setTimeout(() => {
        setShowChange(false);
      }, 2000);

      const animTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 600);

      return () => {
        clearTimeout(hideTimer);
        clearTimeout(animTimer);
      };
    }
  }, [lastChange]);

  useEffect(() => {
    if (prevBalanceRef.current !== balance) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      prevBalanceRef.current = balance;
      return () => clearTimeout(timer);
    }
  }, [balance]);

  return (
    <div className="relative">
      <div 
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium transition-all duration-300",
          isLow 
            ? "bg-destructive/10 text-destructive" 
            : "bg-primary/10 text-primary",
          isAnimating && lastChange?.type === 'gain' && "ring-2 ring-green-500/50 scale-110",
          isAnimating && lastChange?.type === 'loss' && "ring-2 ring-destructive/50",
          className
        )}
      >
        <Coins className={cn(
          "h-4 w-4 transition-transform duration-300",
          isAnimating && "animate-bounce"
        )} />
        <span className={cn(
          "transition-all duration-300",
          isAnimating && lastChange?.type === 'gain' && "text-green-600 font-bold",
          isAnimating && lastChange?.type === 'loss' && "text-destructive font-bold"
        )}>
          {balance}
        </span>
        {showLabel && <span className="hidden sm:inline">Credits</span>}
      </div>
      
      {/* Floating change indicator */}
      {showChange && lastChange && (
        <div 
          className={cn(
            "absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap animate-fade-in",
            lastChange.type === 'gain' 
              ? "bg-green-500 text-white" 
              : "bg-destructive text-destructive-foreground"
          )}
          style={{
            animation: 'floatUp 2s ease-out forwards'
          }}
        >
          {lastChange.type === 'gain' ? (
            <>
              <TrendingUp className="h-3 w-3" />
              +{lastChange.amount}
            </>
          ) : (
            <>
              <TrendingDown className="h-3 w-3" />
              -{lastChange.amount}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CreditDisplay;

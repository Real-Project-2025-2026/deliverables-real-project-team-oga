import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditDisplayProps {
  balance: number;
  className?: string;
  showLabel?: boolean;
}

const CreditDisplay = ({ balance, className, showLabel = false }: CreditDisplayProps) => {
  const isLow = balance < 5;

  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium transition-colors",
        isLow 
          ? "bg-destructive/10 text-destructive" 
          : "bg-primary/10 text-primary",
        className
      )}
    >
      <Coins className="h-4 w-4" />
      <span>{balance}</span>
      {showLabel && <span className="hidden sm:inline">Credits</span>}
    </div>
  );
};

export default CreditDisplay;

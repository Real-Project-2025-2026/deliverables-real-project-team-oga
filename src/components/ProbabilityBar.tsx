import { useLanguage } from "@/contexts/LanguageContext";
import { getProbabilityLevel, type ProbabilityLevel } from "@/lib/parkingProbability";

interface ProbabilityBarProps {
  probability: number;
}

const levelTranslationKeys: Record<ProbabilityLevel, string> = {
  veryHigh: "app.probabilityVeryHigh",
  high: "app.probabilityHigh",
  medium: "app.probabilityMedium",
  low: "app.probabilityLow",
  veryLow: "app.probabilityVeryLow",
};

export function ProbabilityBar({ probability }: ProbabilityBarProps) {
  const { t } = useLanguage();
  const level = getProbabilityLevel(probability);
  const label = t(levelTranslationKeys[level]);
  
  // Clamp probability between 0 and 100
  const clampedProbability = Math.max(0, Math.min(100, probability));
  
  return (
    <div className="mt-3 space-y-2">
      {/* Bar container */}
      <div className="relative h-3 rounded-full overflow-hidden bg-muted">
        {/* Gradient bar */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(to right, hsl(0, 84%, 60%) 0%, hsl(25, 95%, 53%) 25%, hsl(48, 96%, 53%) 50%, hsl(84, 85%, 50%) 75%, hsl(142, 71%, 45%) 100%)"
          }}
        />
      </div>
      
      {/* Arrow indicator */}
      <div className="relative h-4">
        <div 
          className="absolute -translate-x-1/2 flex flex-col items-center transition-all duration-300"
          style={{ left: `${clampedProbability}%` }}
        >
          {/* Triangle arrow */}
          <div 
            className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent"
            style={{
              borderBottomColor: getArrowColor(clampedProbability)
            }}
          />
        </div>
      </div>
      
      {/* Label */}
      <div className="flex justify-center items-center gap-2 text-sm">
        <span className="font-semibold text-foreground">{clampedProbability}%</span>
        <span className="text-muted-foreground">–</span>
        <span 
          className="font-medium"
          style={{ color: getArrowColor(clampedProbability) }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

/**
 * Get the arrow color based on probability (matches gradient position)
 */
function getArrowColor(probability: number): string {
  if (probability >= 80) return "hsl(142, 71%, 45%)"; // Green
  if (probability >= 60) return "hsl(84, 85%, 50%)";  // Light green
  if (probability >= 40) return "hsl(48, 96%, 53%)";  // Yellow
  if (probability >= 20) return "hsl(25, 95%, 53%)";  // Orange
  return "hsl(0, 84%, 60%)"; // Red
}

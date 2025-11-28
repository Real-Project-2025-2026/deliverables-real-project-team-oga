import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-muted rounded-full p-1">
      <Button
        variant={language === "de" ? "default" : "ghost"}
        size="sm"
        className="h-7 w-7 rounded-full p-0 text-base"
        onClick={() => setLanguage("de")}
        aria-label="Deutsch"
      >
        🇩🇪
      </Button>
      <Button
        variant={language === "en" ? "default" : "ghost"}
        size="sm"
        className="h-7 w-7 rounded-full p-0 text-base"
        onClick={() => setLanguage("en")}
        aria-label="English"
      >
        🇬🇧
      </Button>
    </div>
  );
};

export default LanguageToggle;

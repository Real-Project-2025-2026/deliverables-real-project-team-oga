import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-muted rounded-full p-1">
      <Button
        variant={language === "de" ? "default" : "ghost"}
        size="sm"
        className="h-7 px-3 rounded-full text-xs font-medium"
        onClick={() => setLanguage("de")}
      >
        DE
      </Button>
      <Button
        variant={language === "en" ? "default" : "ghost"}
        size="sm"
        className="h-7 px-3 rounded-full text-xs font-medium"
        onClick={() => setLanguage("en")}
      >
        EN
      </Button>
    </div>
  );
};

export default LanguageToggle;

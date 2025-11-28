import { createContext, useContext, useState, ReactNode } from "react";

type Language = "de" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  de: {
    // Header
    "header.openApp": "App öffnen",
    
    // Hero
    "hero.badge": "Parkplatzsuche neu gedacht",
    "hero.title1": "Parkplätze finden.",
    "hero.title2": "In Echtzeit.",
    "hero.description": "OGAP zeigt dir freie Straßenparkplätze in München – ermöglicht durch eine aktive Community, die ihre Parkplätze teilt.",
    "hero.cta": "Jetzt Parkplatz finden",
    
    // Stats
    "stats.title": "Das Problem in München",
    "stats.value1": "~50h",
    "stats.label1": "Durchschnittliche Zeit für Parkplatzsuche pro Jahr",
    "stats.value2": "€1.100",
    "stats.label2": "Jährlicher Verlust durch Parkplatzsuche",
    "stats.value3": "600.000",
    "stats.label3": "Tägliche Pendler in München",
    
    // Pain Points
    "pain.title": "Kommt dir das bekannt vor?",
    "pain.point1": "Ständige Frustration bei der Parkplatzsuche",
    "pain.point2": "Stress & Verzögerungen im Alltag",
    "pain.point3": "Finanzielle Belastung durch verlorene Zeit",
    "pain.point4": "Keine Transparenz über verfügbare Plätze",
    
    // Solution
    "solution.title": "Unsere Lösung",
    "solution.description": "OGAP ist eine community-basierte App, die Echtzeitinformationen über freie Straßenparkplätze in München bietet – auf Stellplatz-Ebene, nicht nur Zonen-Ebene.",
    "solution.feature1": "Echtzeit-Updates von echten Nutzern",
    "solution.feature2": "Präzise Stellplatz-Informationen",
    "solution.feature3": "Kostenlos nutzbar",
    
    // Features
    "features.title": "Wie funktioniert OGAP?",
    "features.realtime.title": "Echtzeit-Verfügbarkeit",
    "features.realtime.description": "Sieh sofort, wo freie Parkplätze in deiner Nähe sind.",
    "features.community.title": "Community-basiert",
    "features.community.description": "Nutzer teilen ihre Parkplätze, wenn sie losfahren.",
    "features.time.title": "Zeit sparen",
    "features.time.description": "Reduziere deine Suchzeit drastisch und komm schneller an.",
    
    // CTA
    "cta.title": "Bereit, Zeit zu sparen?",
    "cta.description": "Werde Teil der OGAP-Community und finde deinen nächsten Parkplatz in Sekunden.",
    "cta.button": "Parkplatz finden",
    
    // Footer
    "footer.tagline": "– Team OGA",
    "footer.copyright": "© 2024 OGAP. Parken einfach gemacht.",
  },
  en: {
    // Header
    "header.openApp": "Open App",
    
    // Hero
    "hero.badge": "Parking search reimagined",
    "hero.title1": "Find Parking.",
    "hero.title2": "In Real-Time.",
    "hero.description": "OGAP shows you free street parking spots in Munich – powered by an active community that shares their spots.",
    "hero.cta": "Find Parking Now",
    
    // Stats
    "stats.title": "The Problem in Munich",
    "stats.value1": "~50h",
    "stats.label1": "Average time spent searching for parking per year",
    "stats.value2": "€1,100",
    "stats.label2": "Annual loss due to parking search",
    "stats.value3": "600,000",
    "stats.label3": "Daily commuters in Munich",
    
    // Pain Points
    "pain.title": "Sound familiar?",
    "pain.point1": "Constant frustration when searching for parking",
    "pain.point2": "Stress & delays in everyday life",
    "pain.point3": "Financial burden from wasted time",
    "pain.point4": "No transparency about available spots",
    
    // Solution
    "solution.title": "Our Solution",
    "solution.description": "OGAP is a community-based app that provides real-time information about free street parking in Munich – at spot-level, not just zone-level.",
    "solution.feature1": "Real-time updates from real users",
    "solution.feature2": "Precise spot-level information",
    "solution.feature3": "Free to use",
    
    // Features
    "features.title": "How does OGAP work?",
    "features.realtime.title": "Real-Time Availability",
    "features.realtime.description": "See instantly where free parking spots are near you.",
    "features.community.title": "Community-Driven",
    "features.community.description": "Users share their parking spots when they leave.",
    "features.time.title": "Save Time",
    "features.time.description": "Drastically reduce your search time and arrive faster.",
    
    // CTA
    "cta.title": "Ready to save time?",
    "cta.description": "Join the OGAP community and find your next parking spot in seconds.",
    "cta.button": "Find Parking",
    
    // Footer
    "footer.tagline": "– Team OGA",
    "footer.copyright": "© 2024 OGAP. Make Parking Simple.",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("de");

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.de] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

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
    "hero.description":
      "OGAP zeigt dir freie Straßenparkplätze in München – ermöglicht durch eine aktive Community, die ihre Parkplätze teilt.",
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
    "solution.description":
      "OGAP ist eine community-basierte App, die Echtzeitinformationen über freie Straßenparkplätze in München bietet – auf Stellplatz-Ebene, nicht nur Zonen-Ebene.",
    "solution.feature1": "Echtzeit-Updates von echten Nutzern",
    "solution.feature2": "Präzise Stellplatz-Informationen",
    "solution.feature3": "Kostenlos nutzbar",

    // Features
    "features.title": "Wie funktioniert OGAP?",
    "features.realtime.title": "Echtzeit-Verfügbarkeit",
    "features.realtime.description":
      "Sieh sofort, wo freie Parkplätze in deiner Nähe sind.",
    "features.community.title": "Community-basiert",
    "features.community.description":
      "Nutzer teilen ihre Parkplätze, wenn sie losfahren.",
    "features.time.title": "Zeit sparen",
    "features.time.description":
      "Reduziere deine Suchzeit drastisch und komm schneller an.",

    // CTA
    "cta.title": "Bereit, Zeit zu sparen?",
    "cta.description":
      "Werde Teil der OGAP-Community und finde deinen nächsten Parkplatz in Sekunden.",
    "cta.button": "Parkplatz finden",

    // Footer
    "footer.tagline": "– Team OGA",
    "footer.copyright": "© 2025 OGAP. Parken einfach gemacht.",

    // App
    "app.spotTaken": "Parkplatz übernommen",
    "app.spotTakenDesc": "Du hast den Parkplatz übernommen.",
    "app.newSpotReported": "Neuer Parkplatz gemeldet!",
    "app.creditsReceived": "+2 Credits erhalten!",
    "app.setSpotTitle": "Neuen Parkplatz melden",
    "app.setSpotDesc": "Du meldest einen neuen Parkplatz an dieser Position.",
    "app.setSpotHint":
      "Du erhältst +2 Credits für das Melden eines neuen Parkplatzes!",
    "app.setSpotButton": "Hier parken",
    "app.takeSpot": "Parkplatz nehmen",
    "app.spotsAvailable": "Parkplätze verfügbar",
    "app.hideStats": "Statistiken ausblenden",
    "app.mapRecentered": "Karte zentriert",
    "app.mapRecenteredDesc": "Auf deinen aktuellen Standort zentriert.",
    "app.signedOut": "Abgemeldet",
    "app.signedOutDesc": "Du wurdest erfolgreich abgemeldet.",
    "app.openInAppleMaps": "In Apple Maps öffnen",
    "app.openInGoogleMaps": "In Google Maps öffnen",
    "app.parkingTimer": "Park-Timer",
    "app.error": "Fehler",
    "app.errorTakeSpot": "Konnte diesen Parkplatz nicht übernehmen.",
    "app.errorCreateSpot": "Konnte Parkplatz nicht erstellen.",
    "app.availabilityChance": "Verfügbarkeits-Chance",
    "app.probabilityVeryHigh": "Sehr hoch",
    "app.probabilityHigh": "Hoch",
    "app.probabilityMedium": "Mittel",
    "app.probabilityLow": "Niedrig",
    "app.probabilityVeryLow": "Sehr niedrig",
    "app.activeUsers": "Aktive Nutzer",
    "app.thanksForSharingTitle": "Danke fürs Teilen!",
    "app.thanksForSharingDesc": "Dein Platz ist jetzt für andere verfügbar.",
    // Header & labels
    "app.headerTagline": "Freie Parkplätze finden & teilen",
    "app.backToHomeAria": "Zurück zur Startseite",
    "app.activeHandshakeAria": "Aktiver Handshake-Deal",
    "app.recenterAria": "Karte auf meinen Standort zentrieren",
    // Spot details dialog
    "app.parkingSpotAvailable": "Parkplatz verfügbar",
    "app.distanceLabel": "Entfernung:",
    "app.away": "entfernt",
    "app.availableFor": "Verfügbar seit:",
    // Map actions & toasts
    "app.nearestSpot": "Nächster Parkplatz",
    "app.foundParkingNearby": "Parkplatz gefunden",
    "app.noSpotsAvailable": "Keine Parkplätze verfügbar",
    "app.noSpotsAvailableDesc": "Es sind keine freien Parkplätze in der Nähe.",
    "app.errorLoadingSpots": "Fehler beim Laden",
    "app.errorLoadingSpotsDesc":
      "Parkplätze konnten nicht aus der Datenbank geladen werden.",
    "app.errorUpdateSpot": "Parkplatz konnte nicht aktualisiert werden.",
    // Geolocation
    "app.locationNotSupportedTitle": "Standort nicht unterstützt",
    "app.locationNotSupportedDesc":
      "Dein Browser unterstützt keine Geolokalisierung.",
    "app.locationFoundTitle": "Standort gefunden",
    "app.locationFoundDesc":
      "Nutze deinen aktuellen Standort, um Parkplätze zu finden.",
    "app.locationAccessDeniedTitle": "Standortzugriff verweigert",
    "app.locationAccessDeniedDesc":
      "Standardstandort wird verwendet. Standortzugriff aktivieren für bessere Ergebnisse.",
    // Timer
    "app.parkingTimeExpiredTitle": "Parkzeit abgelaufen",
    "app.parkingTimeExpiredDesc":
      "Deine Parkzeit ist abgelaufen. Bitte bewege dein Fahrzeug.",
    "app.parkingTimeAlertTitle": "Parkzeit-Hinweis",
    "app.parkingTimeAlertDesc": "Nur noch 5 Minuten verbleiben!",
    "app.timeExpired": "Zeit abgelaufen!",
    "app.minLeft": "Minuten übrig",
    "app.hoursShort": "Std",
    "app.minutesShort": "Min",
    "app.left": "übrig",
    // Loading
    "app.loading": "Lädt...",
    // Handshake completion
    "app.spotReceivedTitle": "Parkplatz erhalten!",
    "app.spotReceivedDesc":
      "Der Handshake ist abgeschlossen. Du hast jetzt den Parkplatz.",
    // Leaving dialog
    "leaveDialog.title": "Wie möchtest du gehen?",
    "leaveDialog.description":
      "Wähle, ob du einfach gehst oder einen Handshake anbietest.",
    "leaveDialog.normalLeave": "Einfach gehen",
    "leaveDialog.handshake": "Handshake anbieten",
    "leaveDialog.handshakeReward": "+20 Credits bei Übergabe",
    "leaveDialog.info":
      "Mit einem Handshake kannst du deinen Parkplatz direkt übergeben und Credits verdienen!",
    // Auth
    "auth.createTitle": "Account erstellen",
    "auth.signInTitle": "Anmelden",
    "auth.createDesc":
      "Melde dich an, um Parkplätze hinzuzufügen und zu teilen.",
    "auth.signInDesc": "Melde dich an, um fortzufahren.",
    "auth.email": "E-Mail",
    "auth.password": "Passwort",
    "auth.placeholderEmail": "du@beispiel.de",
    "auth.placeholderPassword": "••••••••",
    "auth.signUpButton": "Registrieren",
    "auth.signInButton": "Anmelden",
    "auth.pleaseWait": "Bitte warten...",
    "auth.accountExistsTitle": "Account existiert",
    "auth.accountExistsDesc":
      "Diese E-Mail ist bereits registriert. Versuche dich stattdessen anzumelden.",
    "auth.accountCreatedTitle": "Account erstellt!",
    "auth.accountCreatedDesc":
      "Du bist jetzt angemeldet und kannst Parkplätze hinzufügen.",
    "auth.signInFailedTitle": "Anmeldung fehlgeschlagen",
    "auth.welcomeBackTitle": "Willkommen zurück!",
    "auth.welcomeBackDesc": "Du bist jetzt angemeldet.",
    "auth.alreadyHaveAccount": "Du hast bereits ein Konto?",
    "auth.dontHaveAccount": "Du hast noch kein Konto?",
  },
  en: {
    // Header
    "header.openApp": "Open App",

    // Hero
    "hero.badge": "Parking search reimagined",
    "hero.title1": "Find Parking.",
    "hero.title2": "In Real-Time.",
    "hero.description":
      "OGAP shows you free street parking spots in Munich – powered by an active community that shares their spots.",
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
    "solution.description":
      "OGAP is a community-based app that provides real-time information about free street parking in Munich – at spot-level, not just zone-level.",
    "solution.feature1": "Real-time updates from real users",
    "solution.feature2": "Precise spot-level information",
    "solution.feature3": "Free to use",

    // Features
    "features.title": "How does OGAP work?",
    "features.realtime.title": "Real-Time Availability",
    "features.realtime.description":
      "See instantly where free parking spots are near you.",
    "features.community.title": "Community-Driven",
    "features.community.description":
      "Users share their parking spots when they leave.",
    "features.time.title": "Save Time",
    "features.time.description":
      "Drastically reduce your search time and arrive faster.",

    // CTA
    "cta.title": "Ready to save time?",
    "cta.description":
      "Join the OGAP community and find your next parking spot in seconds.",
    "cta.button": "Find Parking",

    // Footer
    "footer.tagline": "– Team OGA",
    "footer.copyright": "© 2025 OGAP. Make Parking Simple.",

    // App
    "app.spotTaken": "Spot Taken",
    "app.spotTakenDesc": "You have taken this parking spot.",
    "app.newSpotReported": "New Spot Reported!",
    "app.creditsReceived": "+2 Credits received!",
    "app.setSpotTitle": "Report New Parking Spot",
    "app.setSpotDesc": "You are reporting a new parking spot at this location.",
    "app.setSpotHint":
      "You will receive +2 Credits for reporting a new parking spot!",
    "app.setSpotButton": "Park Here",
    "app.takeSpot": "Take This Spot",
    "app.spotsAvailable": "spots available",
    "app.hideStats": "Hide stats",
    "app.mapRecentered": "Map Recentered",
    "app.mapRecenteredDesc": "Centered on your current location.",
    "app.signedOut": "Signed Out",
    "app.signedOutDesc": "You've been signed out successfully.",
    "app.openInAppleMaps": "Open in Apple Maps",
    "app.openInGoogleMaps": "Open in Google Maps",
    "app.parkingTimer": "Parking Timer",
    "app.error": "Error",
    "app.errorTakeSpot": "Could not take this parking spot.",
    "app.errorCreateSpot": "Could not create parking spot.",
    "app.availabilityChance": "Availability Chance",
    "app.probabilityVeryHigh": "Very High",
    "app.probabilityHigh": "High",
    "app.probabilityMedium": "Medium",
    "app.probabilityLow": "Low",
    "app.probabilityVeryLow": "Very Low",
    "app.activeUsers": "Active Users",
    "app.thanksForSharingTitle": "Thanks for sharing!",
    "app.thanksForSharingDesc": "Your spot is now available to others.",
    // Header & labels
    "app.headerTagline": "Find & Share Free Parking",
    "app.backToHomeAria": "Back to home",
    "app.activeHandshakeAria": "Active handshake deal",
    "app.recenterAria": "Recenter map on my location",
    // Spot details dialog
    "app.parkingSpotAvailable": "Parking Spot Available",
    "app.distanceLabel": "Distance:",
    "app.away": "away",
    "app.availableFor": "Available for:",
    // Map actions & toasts
    "app.nearestSpot": "Nearest Spot",
    "app.foundParkingNearby": "Found parking",
    "app.noSpotsAvailable": "No Spots Available",
    "app.noSpotsAvailableDesc": "There are no available parking spots nearby.",
    "app.errorLoadingSpots": "Error Loading Spots",
    "app.errorLoadingSpotsDesc":
      "Could not load parking spots from the database.",
    "app.errorUpdateSpot": "Could not update parking spot.",
    // Geolocation
    "app.locationNotSupportedTitle": "Location Not Supported",
    "app.locationNotSupportedDesc": "Your browser doesn't support geolocation.",
    "app.locationFoundTitle": "Location Found",
    "app.locationFoundDesc":
      "Using your current location to find nearby parking.",
    "app.locationAccessDeniedTitle": "Location Access Denied",
    "app.locationAccessDeniedDesc":
      "Using default location. Enable location access for better results.",
    // Timer
    "app.parkingTimeExpiredTitle": "Parking Time Expired",
    "app.parkingTimeExpiredDesc":
      "Your parking time has expired. Please move your vehicle.",
    "app.parkingTimeAlertTitle": "Parking Time Alert",
    "app.parkingTimeAlertDesc": "Only 5 minutes left on your parking!",
    "app.timeExpired": "Time expired!",
    "app.minLeft": "min left",
    "app.hoursShort": "h",
    "app.minutesShort": "m",
    "app.left": "left",
    // Loading
    "app.loading": "Loading...",
    // Handshake completion
    "app.spotReceivedTitle": "Spot received!",
    "app.spotReceivedDesc": "Handshake completed. You now own the spot.",
    // Leaving dialog
    "leaveDialog.title": "How do you want to leave?",
    "leaveDialog.description":
      "Choose whether to leave normally or offer a handshake.",
    "leaveDialog.normalLeave": "Leave without handshake",
    "leaveDialog.handshake": "Offer handshake",
    "leaveDialog.handshakeReward": "+20 credits when handed over",
    "leaveDialog.info":
      "With a handshake you can hand over your spot directly and earn credits!",
    // Auth
    "auth.createTitle": "Create Account",
    "auth.signInTitle": "Sign In",
    "auth.createDesc":
      "Sign up to add and share parking spots with the community.",
    "auth.signInDesc": "Sign in to your account to continue.",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.placeholderEmail": "you@example.com",
    "auth.placeholderPassword": "••••••••",
    "auth.signUpButton": "Sign Up",
    "auth.signInButton": "Sign In",
    "auth.pleaseWait": "Please wait...",
    "auth.accountExistsTitle": "Account Exists",
    "auth.accountExistsDesc":
      "This email is already registered. Try signing in instead.",
    "auth.accountCreatedTitle": "Account Created!",
    "auth.accountCreatedDesc":
      "You're now signed in and can add parking spots.",
    "auth.signInFailedTitle": "Sign In Failed",
    "auth.welcomeBackTitle": "Welcome Back!",
    "auth.welcomeBackDesc": "You're now signed in.",
    "auth.alreadyHaveAccount": "Already have an account?",
    "auth.dontHaveAccount": "Don't have an account?",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

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

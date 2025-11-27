import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Users, Car, ArrowRight, CheckCircle } from "lucide-react";

const Landing = () => {
  const stats = [
    { value: "~50h", label: "Average time spent searching for parking per year" },
    { value: "€1,100", label: "Annual loss due to parking search" },
    { value: "600,000", label: "Daily commuters in Munich" },
  ];

  const painPoints = [
    "Constant frustration when searching for parking",
    "Stress & delays in everyday life",
    "Financial burden from wasted time",
    "No transparency about available spots",
  ];

  const features = [
    {
      icon: MapPin,
      title: "Real-Time Availability",
      description: "See instantly where free parking spots are near you.",
    },
    {
      icon: Users,
      title: "Community-Driven",
      description: "Users share their parking spots when they leave.",
    },
    {
      icon: Clock,
      title: "Save Time",
      description: "Drastically reduce your search time and arrive faster.",
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold tracking-tight">OGAP</span>
          </div>
          <Link to="/app">
            <Button size="sm" className="gap-2">
              Open App
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <MapPin className="h-4 w-4" />
            Parking search reimagined
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Find Parking.
            <br />
            <span className="text-primary">In Real-Time.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            OGAP shows you free street parking spots in Munich – powered by an active community that shares their spots.
          </p>
          <Link to="/app">
            <Button size="lg" className="gap-2 text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
              Find Parking Now
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
            The Problem in Munich
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl p-6 text-center shadow-sm border border-border"
              >
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6">
                Sound familiar?
              </h2>
              <ul className="space-y-4">
                {painPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-1 h-5 w-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-destructive text-xs">✕</span>
                    </div>
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl p-8">
              <h3 className="text-xl font-semibold mb-4">Our Solution</h3>
              <p className="text-muted-foreground mb-6">
                OGAP is a community-based app that provides real-time information about free street parking in Munich – at spot-level, not just zone-level.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Real-time updates from real users
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Precise spot-level information
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Free to use
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 bg-muted/50 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            How does OGAP work?
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-colors"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to save time?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join the OGAP community and find your next parking spot in seconds.
          </p>
          <Link to="/app">
            <Button size="lg" className="gap-2 text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
              Find Parking
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              <span className="font-semibold">OGAP</span>
              <span className="text-sm text-muted-foreground">– Team OGA</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 OGAP. Make Parking Simple.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

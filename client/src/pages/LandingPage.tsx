import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Menu,
  X,
  ChevronRight,
  Gavel,
  Target,
  BarChart3,
  Award,
  Lock,
  Zap,
  DollarSign,
  Smartphone,
  Check,
  Star,
  ShieldCheck,
  TrendingDown,
  Building2,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition =
        element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: elementPosition - offset, behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  if (isAuthenticated) {
    return <Navigate to={"/dashboard"} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* Navigation Bar - Glassmorphism */}
      <nav
        className={`fixed top-0 left-0 w-full z-40 transition-all duration-500 ${
          scrolled
            ? "bg-background/80 backdrop-blur-md border-b border-border py-3 shadow-sm"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform">
              <Gavel className="text-primary-foreground w-6 h-6" />
            </div>
            <span className="text-xl font-extrabold tracking-tighter text-foreground">
              Bid<span className="text-primary">Sync</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-10">
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("buyers")}
              className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              For Buyers
            </button>
            <button
              onClick={() => scrollToSection("suppliers")}
              className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              For Suppliers
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              Pricing
            </button>
            <div className="flex items-center space-x-4 pl-4 border-l border-border">
              <Link
                to="/login"
                className="text-sm font-bold text-foreground px-4 py-2 hover:bg-accent rounded-lg transition-colors"
              >
                <span>Login</span>
              </Link>
              <Link
                to="/register"
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 active:scale-95"
              >
                <span>Sign Up</span>
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden relative z-50 p-2 text-foreground bg-muted rounded-lg hover:bg-accent transition-colors"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu - Rendered at root level with highest z-index */}
      {isMenuOpen && (
        <>
          {/* Backdrop - covers everything */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Panel - slides in from right */}
          <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-card shadow-2xl z-[10000] overflow-y-auto">
            <div className="p-6 min-h-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <Gavel className="text-primary w-8 h-8" />
                  <span className="text-2xl font-bold text-foreground">
                    BidSync
                  </span>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 bg-muted rounded-lg hover:bg-accent transition-colors"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Menu Items */}
              <div className="space-y-6">
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="w-full text-left text-2xl font-bold text-foreground hover:text-primary transition-colors py-3"
                >
                  The Protocol
                </button>
                <button
                  onClick={() => scrollToSection("buyers")}
                  className="w-full text-left text-2xl font-bold text-foreground hover:text-primary transition-colors py-3"
                >
                  For Buyers
                </button>
                <button
                  onClick={() => scrollToSection("suppliers")}
                  className="w-full text-left text-2xl font-bold text-foreground hover:text-primary transition-colors py-3"
                >
                  For Providers
                </button>
                <button
                  onClick={() => scrollToSection("pricing")}
                  className="w-full text-left text-2xl font-bold text-foreground hover:text-primary transition-colors py-3"
                >
                  Pricing
                </button>

                <div className="pt-8 space-y-4 border-t border-border">
                  <Link
                    to="/login"
                    className="w-full h-14 font-bold text-foreground border-2 border-border rounded-xl hover:border-primary hover:text-primary transition-all flex items-center justify-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="w-full h-14 font-bold bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center"
                  >
                    Get Started Free
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Hero Section - Bold & High Energy */}
      <section className="relative pt-32 pb-20 sm:pt-48 sm:pb-32 bg-background overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-8 animate-in fade-in zoom-in duration-500">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-primary">
                The Modern Auction Standard
              </span>
            </div>

            <h1 className="text-[40px] sm:text-[64px] lg:text-[80px] font-black text-foreground leading-[0.95] tracking-tight mb-8 animate-in slide-in-from-bottom-4 duration-500">
              SELL FASTER. <br />
              <span className="text-primary">BUY SMARTER.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-medium leading-relaxed animate-in slide-in-from-bottom-5 duration-500">
              Eliminate negotiation fatigue. Our automated reverse auction
              engine ensures you get the absolute market floor price in minutes,
              not weeks.
            </p>

            {/* Role Selection Cards Instead of Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16 animate-in slide-in-from-bottom-6 duration-500">
              {/* Buyer Card */}
              <Link
                to="/buyerform"
                className="group relative p-8 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Building2 className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    I'm a Buyer
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Post requirements, get competitive bids, and save on every
                    purchase.
                  </p>
                  <div className="flex items-center text-primary font-semibold text-sm group-hover:gap-2 transition-all gap-1">
                    <span>Start sourcing</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* Supplier Card */}
              <Link
                to="/supplierform"
                className="group relative p-8 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    I'm a Supplier
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Find opportunities, bid on projects, and grow your business.
                  </p>
                  <div className="flex items-center text-primary font-semibold text-sm group-hover:gap-2 transition-all gap-1">
                    <span>Start bidding</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>

            <div className="flex flex-col items-center animate-in slide-in-from-bottom-7 duration-500">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mb-6">
                Trusted By Industry Leaders
              </p>
              <div className="flex flex-wrap justify-center gap-8 grayscale opacity-40">
                <div className="text-2xl font-black italic text-foreground">
                  FORBES
                </div>
                <div className="text-2xl font-black italic text-foreground">
                  TECHNO
                </div>
                <div className="text-2xl font-black italic text-foreground">
                  GLOBAL
                </div>
                <div className="text-2xl font-black italic text-foreground">
                  EQUITY
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Modern Cards */}
      <section
        id="how-it-works"
        className="py-20 sm:py-32 bg-muted/30 border-y border-border px-4 relative"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-4">
              The Protocol
            </h2>
            <p className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
              Three steps to efficiency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {[
              {
                icon: <Target className="w-8 h-8" />,
                num: "01",
                title: "Deployment",
                desc: "Post your requirements. Our engine validates the specs and broadcasts to our global provider network instantly.",
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                num: "02",
                title: "Live Battle",
                desc: "Providers compete in real-time. Transparent bidding drives costs down to the absolute market floor automatically.",
              },
              {
                icon: <Award className="w-8 h-8" />,
                num: "03",
                title: "Settlement",
                desc: "Review final bids and award the contract. Automated settlement ensures immediate workflow transition.",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="group relative bg-card p-10 rounded-[32px] shadow-sm hover:shadow-xl transition-all border border-border hover:border-primary/30"
              >
                <div className="absolute -top-6 right-8 text-6xl font-black text-muted/50 group-hover:text-primary/10 transition-colors select-none">
                  {step.num}
                </div>
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-muted-foreground font-medium leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Buyers / Suppliers - Split Design */}
      <section className="py-24 sm:py-40 px-4 bg-background">
        <div className="max-w-7xl mx-auto space-y-32">
          {/* Buyers Section */}
          <div
            id="buyers"
            className="flex flex-col lg:flex-row items-center gap-16"
          >
            <div className="flex-1 space-y-8">
              <div className="w-12 h-1 bg-primary rounded-full"></div>
              <h2 className="text-4xl sm:text-6xl font-black text-foreground leading-[1.1] tracking-tighter">
                FOR THE <br />{" "}
                <span className="text-primary">AGGRESSIVE BUYER.</span>
              </h2>
              <div className="space-y-5">
                {[
                  {
                    t: "Live Price Discovery",
                    d: "Market-driven pricing in real-time.",
                  },
                  {
                    t: "Vendor Auditing",
                    d: "Verified, high-performance providers only.",
                  },
                  {
                    t: "Save 24% Average",
                    d: "Competition consistently beats manual quotes.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="mt-1 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <Check className="text-primary w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{item.t}</h4>
                      <p className="text-muted-foreground text-sm">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/buyerform"
                className="inline-block bg-primary text-primary-foreground px-10 py-5 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl active:scale-95"
              >
                Launch My First Auction
              </Link>
            </div>
            <div className="flex-1 w-full bg-muted/30 rounded-[40px] p-8 border border-border shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <TrendingDown className="text-green-500 w-12 h-12 opacity-20" />
              </div>
              <div className="space-y-4">
                <div className="h-4 w-1/3 bg-border rounded-full"></div>
                <div className="h-12 w-full bg-card rounded-xl shadow-sm border border-border flex items-center px-4 justify-between">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg"></div>
                  <div className="font-mono font-bold text-primary">
                    $2,400.00
                  </div>
                </div>
                <div className="h-12 w-full bg-card rounded-xl shadow-sm border border-border flex items-center px-4 justify-between opacity-60">
                  <div className="w-8 h-8 bg-muted rounded-lg"></div>
                  <div className="font-mono font-bold text-muted-foreground">
                    $2,850.00
                  </div>
                </div>
                <div className="h-12 w-full bg-card rounded-xl shadow-sm border border-border flex items-center px-4 justify-between opacity-40">
                  <div className="w-8 h-8 bg-muted rounded-lg"></div>
                  <div className="font-mono font-bold text-muted-foreground">
                    $3,100.00
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Suppliers Section */}
          <div
            id="suppliers"
            className="flex flex-col lg:flex-row-reverse items-center gap-16"
          >
            <div className="flex-1 space-y-8">
              <div className="w-12 h-1 bg-primary rounded-full"></div>
              <h2 className="text-4xl sm:text-6xl font-black text-foreground leading-[1.1] tracking-tighter">
                FOR THE <br />{" "}
                <span className="text-primary">FAST PROVIDER.</span>
              </h2>
              <div className="space-y-5">
                {[
                  "Global visibility for your services",
                  "Fair competition, no nepotism",
                  "Instant contract award notifications",
                  "Direct pipeline to high-intent buyers",
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-4 p-4 bg-muted/30 rounded-2xl border border-border"
                  >
                    <ShieldCheck className="text-primary w-6 h-6" />
                    <span className="font-bold text-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/supplierform"
                className="inline-block bg-primary text-primary-foreground px-10 py-5 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95"
              >
                Browse Active Bids
              </Link>
            </div>
            <div className="flex-1 w-full bg-primary rounded-[40px] p-12 text-primary-foreground relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4">Market Opportunity</h3>
                <div className="text-5xl font-black mb-2">$4.2M+</div>
                <p className="text-primary-foreground/80 font-medium">
                  Awarded in the last 24 hours
                </p>
              </div>
              <div className="absolute bottom-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Subscription Plans */}
      <section id="pricing" className="py-24 sm:py-32 bg-muted/50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-4">
              Subscription
            </h2>
            <p className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
              Flexible Plans for Every Business
            </p>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto font-medium">
              Choose the perfect tier to supercharge your procurement or sales pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Basic",
                price: "500",
                desc: "Essential tools for small businesses.",
                features: ["Up to 5 active bids", "Basic RFP filters", "Email notifications"],
                color: "bg-blue-500/10 border-blue-500/20"
              },
              {
                name: "Professional",
                price: "1,500",
                desc: "Advanced features for growing companies.",
                features: ["Unlimited active bids", "Priority Bid Rooms", "Advanced analytics", "SMS notifications"],
                popular: true,
                color: "bg-primary/10 border-primary/20"
              },
              {
                name: "Enterprise",
                price: "5,000",
                desc: "Customized solutions for large organizations.",
                features: ["Dedicated manager", "Custom integrations", "Bulk RFP tools", "24/7 Phone support"],
                color: "bg-purple-500/10 border-purple-500/20"
              }
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative p-8 rounded-[32px] border bg-card transition-all hover:shadow-2xl ${plan.popular ? 'border-primary shadow-xl scale-105 z-10' : 'border-border'}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${plan.color}`}>
                  <Zap className={`w-6 h-6 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-6 font-medium">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-muted-foreground font-bold">ETB/mo</span>
                </div>
                <div className="space-y-4 mb-10">
                  {plan.features.map((feat, j) => (
                    <div key={j} className="flex items-center gap-3 text-sm font-medium">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
                <Link
                  to="/register"
                  className={`w-full py-4 rounded-2xl font-bold transition-all text-center block ${plan.popular ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20' : 'bg-muted text-foreground hover:bg-muted/80'}`}
                >
                  Start with {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - Premium Grid */}
      <section className="py-20 sm:py-32 bg-card text-foreground px-4 relative overflow-hidden border-t border-border">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-sm font-black text-primary uppercase tracking-[0.4em] mb-4">
              Performance
            </h2>
            <p className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              The BidSync Advantage
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Lock className="w-10 h-10 text-primary" />,
                label: "Encrypted",
                desc: "Military grade security for all proprietary specs.",
              },
              {
                icon: <Zap className="w-10 h-10 text-primary" />,
                label: "Instant",
                desc: "Bid cycles completed in under 15 minutes.",
              },
              {
                icon: <DollarSign className="w-10 h-10 text-primary" />,
                label: "Pure ROI",
                desc: "Pay only for what the market actually costs.",
              },
              {
                icon: <Smartphone className="w-10 h-10 text-primary" />,
                label: "Mobile-First",
                desc: "Approve contracts from your phone anywhere.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-8 rounded-3xl bg-muted/30 border border-border hover:bg-muted/50 transition-all group"
              >
                <div className="mb-6 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h4 className="text-xl font-bold mb-3 text-foreground">
                  {item.label}
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - Modern & Detailed */}
      <footer className="bg-background pt-24 pb-12 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20 text-center md:text-left">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Gavel className="text-primary w-8 h-8" />
                <span className="text-2xl font-black tracking-tighter text-foreground">
                  BidSync
                </span>
              </div>
              <p className="text-muted-foreground font-medium max-w-sm mx-auto md:mx-0 leading-relaxed">
                Empowering businesses through competitive transparency. The
                world's fastest way to source industrial services.
              </p>
            </div>

            <div className="space-y-6">
              <h5 className="font-bold text-foreground uppercase tracking-widest text-xs">
                Navigation
              </h5>
              <div className="flex flex-col space-y-3 font-semibold text-muted-foreground text-sm">
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="hover:text-primary transition-colors text-left"
                >
                  Protocol
                </button>
                <button
                  onClick={() => scrollToSection("buyers")}
                  className="hover:text-primary transition-colors text-left"
                >
                  Buyers
                </button>
                <button
                  onClick={() => scrollToSection("suppliers")}
                  className="hover:text-primary transition-colors text-left"
                >
                  Providers
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <h5 className="font-bold text-foreground uppercase tracking-widest text-xs">
                Legal
              </h5>
              <div className="flex flex-col space-y-3 font-semibold text-muted-foreground text-sm">
                <Link
                  to="/privacy"
                  className="hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  to="/compliance"
                  className="hover:text-primary transition-colors"
                >
                  Compliance
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm font-bold text-muted-foreground">
              © 2025 BidSync Protocol. Built for Velocity.
            </p>
            <div className="flex space-x-6">
              <Link
                to="/admin"
                className="text-xs font-black text-muted-foreground hover:text-primary tracking-widest transition-colors"
              >
                ADMIN PORTAL
              </Link>
              <div className="text-xs font-black text-primary tracking-widest">
                STATUS: OPERATIONAL
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes zoom-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slide-in-from-bottom-4 {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-from-bottom-5 {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .fade-in {
          animation-name: fade-in;
          animation-duration: 0.5s;
          animation-timing-function: ease-out;
        }
        
        .zoom-in {
          animation-name: zoom-in;
          animation-duration: 0.5s;
          animation-timing-function: ease-out;
        }
        
        .slide-in-from-bottom-4 {
          animation-name: slide-in-from-bottom-4;
          animation-duration: 0.5s;
          animation-timing-function: ease-out;
        }
        
        .slide-in-from-bottom-5 {
          animation-name: slide-in-from-bottom-5;
          animation-duration: 0.5s;
          animation-timing-function: ease-out;
          animation-delay: 0.1s;
          animation-fill-mode: both;
        }
        
        .slide-in-from-bottom-6 {
          animation-name: slide-in-from-bottom-4;
          animation-duration: 0.5s;
          animation-timing-function: ease-out;
          animation-delay: 0.2s;
          animation-fill-mode: both;
        }
        
        .slide-in-from-bottom-7 {
          animation-name: slide-in-from-bottom-4;
          animation-duration: 0.5s;
          animation-timing-function: ease-out;
          animation-delay: 0.3s;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  );
};

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
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* Navigation Bar - Modern Glassmorphism */}
      <nav
        className={`fixed top-0 left-0 w-full z-40 transition-all duration-500 ${
          scrolled
            ? "bg-white/80 backdrop-blur-md border-b border-slate-100 py-3 shadow-sm"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:rotate-6 transition-transform">
              <Gavel className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-extrabold tracking-tighter text-slate-900">
              Bid<span className="text-blue-600">Sync</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-10">
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("buyers")}
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              For Buyers
            </button>
            <button
              onClick={() => scrollToSection("suppliers")}
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              For Suppliers
            </button>
            <div className="flex items-center space-x-4 pl-4 border-l border-slate-200">
              <Link
                to="/login"
                className="text-sm font-bold text-slate-900 px-4 py-2 hover:bg-slate-50 rounded-lg"
              >
                <span>Login</span>
              </Link>

              <Link
                to="/register"
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
              >
                <span>Sign Up</span>
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden relative z-50 p-2 text-slate-900 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-9999"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Panel - slides in from right */}
          <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-10000 overflow-y-auto">
            <div className="p-6 min-h-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <Gavel className="text-blue-600 w-8 h-8" />
                  <span className="text-2xl font-bold">BidSync</span>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Menu Items */}
              <div className="space-y-6">
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="w-full text-left text-2xl font-bold text-slate-900 hover:text-blue-600 transition-colors py-3"
                >
                  The Protocol
                </button>
                <button
                  onClick={() => scrollToSection("buyers")}
                  className="w-full text-left text-2xl font-bold text-slate-900 hover:text-blue-600 transition-colors py-3"
                >
                  For Buyers
                </button>
                <button
                  onClick={() => scrollToSection("suppliers")}
                  className="w-full text-left text-2xl font-bold text-slate-900 hover:text-blue-600 transition-colors py-3"
                >
                  For Providers
                </button>

                <div className="pt-8 space-y-4 border-t">
                  <Link
                    to="/login"
                    className="w-full h-14 font-bold text-slate-900 border-2 border-slate-200 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="w-full h-14 font-bold bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center"
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
      <section className="relative pt-32 pb-20 sm:pt-48 sm:pb-32 bg-white overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60"></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-50 rounded-full blur-[100px] opacity-60"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full mb-8 animate-fade-in">
              <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                The Modern Auction Standard
              </span>
            </div>

            <h1 className="text-[40px] sm:text-[64px] lg:text-[80px] font-black text-slate-900 leading-[0.95] tracking-tight mb-8">
              SELL FASTER. <br />
              <span className="text-blue-600">BUY SMARTER.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-500 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
              Eliminate negotiation fatigue. Our automated reverse auction
              engine ensures you get the absolute market floor price in minutes,
              not weeks.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <Link
                to="/buyerform"
                className="group w-full h-15 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center space-x-2"
              >
                <span>I Need Something</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* supplier Link */}
              <Link
                to="/supplierform"
                className="w-full h-15 border-2 border-slate-200 text-slate-900 bg-white rounded-2xl font-bold text-lg hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center"
              >
                <span>I Want to Supply</span>
              </Link>
            </div>

            <div className="mt-16 flex flex-col items-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mb-6">
                Trusted By Industry Leaders
              </p>
              <div className="flex flex-wrap justify-center gap-8 grayscale opacity-40">
                <div className="text-2xl font-black italic">FORBES</div>
                <div className="text-2xl font-black italic">TECHNO</div>
                <div className="text-2xl font-black italic">GLOBAL</div>
                <div className="text-2xl font-black italic">EQUITY</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Modern Cards */}
      <section
        id="how-it-works"
        className="py-20 sm:py-32 bg-slate-50/50 border-y border-slate-100 px-4 relative"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.3em] mb-4">
              The Protocol
            </h2>
            <p className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight">
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
                className="group relative bg-white p-10 rounded-[32px] shadow-sm hover:shadow-xl transition-all border border-slate-100 hover:border-blue-100"
              >
                <div className="absolute -top-6 right-8 text-6xl font-black text-slate-50 group-hover:text-blue-50 transition-colors select-none">
                  {step.num}
                </div>
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Buyers / Suppliers - Split Design */}
      <section className="py-24 sm:py-40 px-4 bg-white">
        <div className="max-w-7xl mx-auto space-y-32">
          {/* Buyers Section */}
          <div
            id="buyers"
            className="flex flex-col lg:flex-row items-center gap-16"
          >
            <div className="flex-1 space-y-8">
              <div className="w-12 h-1 bg-blue-600"></div>
              <h2 className="text-4xl sm:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                FOR THE <br />{" "}
                <span className="text-blue-600">AGGRESSIVE BUYER.</span>
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
                    <div className="mt-1 w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                      <Check className="text-blue-600 w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.t}</h4>
                      <p className="text-slate-500 text-sm">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/buyerform"
                className="inline-block bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl active:scale-95"
              >
                Launch My First Auction
              </Link>
            </div>
            <div className="flex-1 w-full bg-slate-50 rounded-[40px] p-8 border border-slate-100 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <TrendingDown className="text-green-500 w-12 h-12 opacity-20" />
              </div>
              <div className="space-y-4">
                <div className="h-4 w-1/3 bg-slate-200 rounded-full"></div>
                <div className="h-12 w-full bg-white rounded-xl shadow-sm border border-slate-200 flex items-center px-4 justify-between">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg"></div>
                  <div className="font-mono font-bold text-blue-600">
                    $2,400.00
                  </div>
                </div>
                <div className="h-12 w-full bg-white rounded-xl shadow-sm border border-slate-200 flex items-center px-4 justify-between opacity-60">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
                  <div className="font-mono font-bold text-slate-400">
                    $2,850.00
                  </div>
                </div>
                <div className="h-12 w-full bg-white rounded-xl shadow-sm border border-slate-200 flex items-center px-4 justify-between opacity-40">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
                  <div className="font-mono font-bold text-slate-400">
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
              <div className="w-12 h-1 bg-blue-600"></div>
              <h2 className="text-4xl sm:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                FOR THE <br />{" "}
                <span className="text-blue-600">FAST PROVIDER.</span>
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
                    className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-100"
                  >
                    <ShieldCheck className="text-blue-600 w-6 h-6" />
                    <span className="font-bold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/supplierform"
                className="inline-block bg-blue-600 text-white px-10 py-5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
              >
                Browse Active Bids
              </Link>
            </div>
            <div className="flex-1 w-full bg-blue-600 rounded-[40px] p-12 text-white relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4">Market Opportunity</h3>
                <div className="text-5xl font-black mb-2">$4.2M+</div>
                <p className="text-blue-100 font-medium">
                  Awarded in the last 24 hours
                </p>
              </div>
              <div className="absolute bottom-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - Premium Grid */}
      <section className="py-20 sm:py-32 bg-slate-900 text-white px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.4em] mb-4">
              Performance
            </h2>
            <p className="text-3xl sm:text-5xl font-bold tracking-tight">
              The BidSync Advantage
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Lock className="w-10 h-10 text-blue-500" />,
                label: "Encrypted",
                desc: "Military grade security for all proprietary specs.",
              },
              {
                icon: <Zap className="w-10 h-10 text-blue-500" />,
                label: "Instant",
                desc: "Bid cycles completed in under 15 minutes.",
              },
              {
                icon: <DollarSign className="w-10 h-10 text-blue-500" />,
                label: "Pure ROI",
                desc: "Pay only for what the market actually costs.",
              },
              {
                icon: <Smartphone className="w-10 h-10 text-blue-500" />,
                label: "Mobile-First",
                desc: "Approve contracts from your phone anywhere.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
              >
                <div className="mb-6 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h4 className="text-xl font-bold mb-3">{item.label}</h4>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - Modern & Detailed */}
      <footer className="bg-white pt-24 pb-12 px-4 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20 text-center md:text-left">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Gavel className="text-blue-600 w-8 h-8" />
                <span className="text-2xl font-black tracking-tighter">
                  BidSync
                </span>
              </div>
              <p className="text-slate-500 font-medium max-w-sm mx-auto md:mx-0 leading-relaxed">
                Empowering businesses through competitive transparency. The
                world's fastest way to source industrial services.
              </p>
            </div>

            <div className="space-y-6">
              <h5 className="font-bold text-slate-900 uppercase tracking-widest text-xs">
                Navigation
              </h5>
              <div className="flex flex-col space-y-3 font-semibold text-slate-500 text-sm">
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Protocol
                </button>
                <button
                  onClick={() => scrollToSection("buyers")}
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Buyers
                </button>
                <button
                  onClick={() => scrollToSection("suppliers")}
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Providers
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <h5 className="font-bold text-slate-900 uppercase tracking-widest text-xs">
                Legal
              </h5>
              <div className="flex flex-col space-y-3 font-semibold text-slate-500 text-sm">
                <Link
                  to="/privacy"
                  className="hover:text-blue-600 transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="hover:text-blue-600 transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  to="/compliance"
                  className="hover:text-blue-600 transition-colors"
                >
                  Compliance
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm font-bold text-slate-400">
              © 2025 BidSync Protocol. Built for Velocity.
            </p>
            <div className="flex space-x-6">
              <Link
                to="/admin"
                className="text-xs font-black text-slate-300 hover:text-blue-600 tracking-widest"
              >
                ADMIN PORTAL
              </Link>
              <div className="text-xs font-black text-slate-300 tracking-widest">
                STATUS: OK
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

import React, { useState } from "react";
import { 
  HelpCircle, Book, Shield, Send, 
  Search, ChevronRight, Zap, Target,
  MessageSquare, LayoutDashboard, FileText
} from "lucide-react";

const HelpCenter: React.FC = () => {
  const [activeRole, setActiveRole] = useState<"BUYER" | "SUPPLIER">("BUYER");

  const buyerFlow = [
    { 
      step: "1. Create RFP", 
      desc: "Post your procurement requirement. Specify budget, deadline, and workflow (Standard or Two-Envelope).",
      icon: <FileText className="w-5 h-5" />
    },
    { 
      step: "2. Review Bids", 
      desc: "Suppliers will submit proposals. In Two-Envelope mode, evaluate technical aspects before seeing financial details.",
      icon: <Search className="w-5 h-5" />
    },
    { 
      step: "3. Direct Negotiation", 
      desc: "Open a private chat or a real-time Bid Room for shortlisted suppliers to negotiate prices.",
      icon: <MessageSquare className="w-5 h-5" />
    },
    { 
      step: "4. Award Bid", 
      desc: "Select the best proposal and finalize the contract. The system notifies all parties automatically.",
      icon: <Target className="w-5 h-5" />
    }
  ];

  const supplierFlow = [
    { 
      step: "1. Complete Profile", 
      desc: "Verify your business details and upload legal documents to gain trust and platform eligibility.",
      icon: <Shield className="w-5 h-5" />
    },
    { 
      step: "2. Discover RFPs", 
      desc: "Browse through active procurement opportunities that match your business category.",
      icon: <Search className="w-5 h-5" />
    },
    { 
      step: "3. Submit Proposal", 
      desc: "Upload your technical documents and financial bid. Your data is encrypted and protected.",
      icon: <Send className="w-5 h-5" />
    },
    { 
      step: "4. Enter Bid Room", 
      desc: "If shortlisted, join the live auction/negotiation room to refine your bid in real-time.",
      icon: <Zap className="w-5 h-5" />
    }
  ];

  const faqs = [
    { q: "What is Two-Envelope Bidding?", a: "A workflow where technical proposals are evaluated first. Financial bids remain 'locked' until the supplier passes the technical threshold." },
    { q: "How do Bid Rooms work?", a: "Bid Rooms are real-time environments for negotiation. Participants can see competitive positioning (if enabled) and chat directly with buyers." },
    { q: "Is my financial data secure?", a: "Yes. All financial bids are stored with restricted access and are only visible to authorized buyers after specific workflow milestones." }
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold border border-primary/20">
          <HelpCircle className="w-4 h-4" /> KNOWLEDGE_BASE_v1.0
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
          How to Master <span className="text-primary">Bid-Sync</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
          Whether you're procuring or supplying, we've designed the most efficient workflow for modern commerce.
        </p>
      </div>

      {/* Role Selection */}
      <div className="flex justify-center gap-4">
        <button 
          onClick={() => setActiveRole("BUYER")}
          className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-xl ${activeRole === 'BUYER' ? 'bg-primary text-white shadow-primary/20' : 'bg-card border border-border text-muted-foreground hover:border-primary/50'}`}
        >
          I am a Buyer
        </button>
        <button 
          onClick={() => setActiveRole("SUPPLIER")}
          className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-xl ${activeRole === 'SUPPLIER' ? 'bg-primary text-white shadow-primary/20' : 'bg-card border border-border text-muted-foreground hover:border-primary/50'}`}
        >
          I am a Supplier
        </button>
      </div>

      {/* Workflow Visualizer */}
      <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Book className="w-64 h-64" />
        </div>

        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
           {activeRole === 'BUYER' ? <LayoutDashboard className="w-6 h-6 text-primary" /> : <Shield className="w-6 h-6 text-emerald-500" />}
           Your Success Path
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {(activeRole === 'BUYER' ? buyerFlow : supplierFlow).map((item, idx) => (
            <div key={idx} className="relative group">
              <div className="bg-background border border-border p-6 rounded-3xl space-y-4 group-hover:border-primary/50 transition-all shadow-sm hover:shadow-xl hover:-translate-y-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">{item.step}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
              {idx < 3 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 translate-x-1/2 -translate-y-1/2 opacity-20">
                  <ChevronRight className="w-6 h-6" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-primary/30 transition-all">
                <h4 className="font-bold text-foreground mb-2 flex items-start gap-2">
                  <span className="text-primary font-mono">Q:</span> {faq.q}
                </h4>
                <p className="text-sm text-muted-foreground">
                  <span className="text-emerald-500 font-mono font-bold">A:</span> {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-950 text-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden border border-slate-800">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full"></div>
           <h3 className="text-2xl font-bold mb-4">Need Personalized Help?</h3>
           <p className="text-slate-400 mb-8 leading-relaxed">
             Our dedicated support team is available 24/7 to help you resolve disputes or technical issues.
           </p>
           <button className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
             Contact Support
           </button>
           <div className="mt-8 flex items-center justify-between opacity-40">
             <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-800"></div>
                <div className="w-8 h-8 rounded-full bg-slate-800"></div>
             </div>
             <span className="text-[10px] font-mono">SECURE_CONNECTION_ENABLED</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;

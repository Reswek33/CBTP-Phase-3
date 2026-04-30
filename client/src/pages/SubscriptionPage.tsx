import React, { useEffect, useState } from 'react';
import PlanList from '../components/subscription/PlanList';
import { subscriptionApi, type Subscription } from '../services/api/subscription-api';
import { Lock, CreditCard, ShieldCheck, Zap, HelpCircle, ArrowRight, Shield, Crown } from 'lucide-react';

const SubscriptionPage: React.FC = () => {
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await subscriptionApi.getStatus();
      if (response.success) {
        setCurrentSub(response.data);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 -left-20 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8">
            <Crown size={14} className="fill-primary" />
            Premium Access
          </div>
          <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tighter leading-none">
            Scale Your <span className="text-primary">Business</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-medium">
            Choose the perfect plan to access advanced bidding tools, priority notifications, and exclusive marketplace insights.
          </p>
        </header>

        {currentSub && (
          <div className="mb-16 p-8 rounded-[32px] border border-primary/30 bg-primary/5 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Shield size={120} />
            </div>
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                <ShieldCheck size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-black mb-1 tracking-tight">Active Subscription</h2>
                <p className="text-muted-foreground font-medium">You are currently on the <span className="text-primary font-bold">{currentSub.plan.name}</span> plan.</p>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">
                    Ends: {new Date(currentSub.endDate!).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 relative z-10">
              <div className="px-6 py-2 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest shadow-sm">
                {currentSub.status}
              </div>
              <button className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                Manage Billing
              </button>
            </div>
          </div>
        )}

        <section className="mb-32">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <Zap className="text-primary" fill="currentColor" size={28} />
              <h2 className="text-3xl font-black tracking-tight">Available Plans</h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Safe & Secure <Lock size={14} />
            </div>
          </div>
          <PlanList />
        </section>

        {/* Benefits Grid */}
        <section className="mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <CreditCard className="text-primary" />,
                title: "Secure Payments",
                desc: "All transactions are encrypted and processed securely via the Chapa payment gateway."
              },
              {
                icon: <ShieldCheck className="text-primary" />,
                title: "Buyer Protection",
                desc: "We ensure all bidders and projects are verified for a safe and fair marketplace experience."
              },
              {
                icon: <Zap className="text-primary" />,
                title: "Priority Access",
                desc: "Get notified about new RFPs and bidding rooms before anyone else with premium filters."
              }
            ].map((benefit, i) => (
              <div key={i} className="p-10 rounded-[32px] bg-card border border-border hover:border-primary/30 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <h4 className="text-xl font-bold mb-3 tracking-tight">{benefit.title}</h4>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-32 py-20 px-8 rounded-[40px] bg-muted/30 border border-border">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Questions?</h2>
            <p className="text-muted-foreground font-medium">Everything you need to know about our subscription protocol.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {[
              { q: "How do I upgrade my plan?", a: "Simply select a new plan from the options above. Your current subscription will be prorated automatically." },
              { q: "Is there a free trial available?", a: "All users start on a free tier with basic features. Premium plans offer advanced bidding and analytics tools." },
              { q: "Can I cancel my subscription?", a: "Yes, you can cancel at any time from your billing settings. You will retain access until the end of your billing cycle." },
              { q: "What is Chapa?", a: "Chapa is Ethiopia's leading payment gateway, ensuring your transactions are safe, fast, and secure." }
            ].map((faq, i) => (
              <div key={i} className="space-y-3">
                <h5 className="text-lg font-bold flex items-center gap-2">
                  <HelpCircle size={18} className="text-primary" />
                  {faq.q}
                </h5>
                <p className="text-muted-foreground text-sm leading-relaxed font-medium pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Footer */}
        <section className="text-center py-20 rounded-[40px] bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tighter">Ready to grow?</h2>
            <p className="text-primary-foreground/80 mb-10 font-bold max-w-xl mx-auto">Join thousands of businesses already scaling their operations with BidSync Premium.</p>
            <button className="px-10 py-5 bg-white text-primary rounded-2xl font-black shadow-xl hover:bg-white/90 transition-all active:scale-95 flex items-center gap-2 mx-auto">
              Explore Custom Solutions <ArrowRight size={20} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SubscriptionPage;

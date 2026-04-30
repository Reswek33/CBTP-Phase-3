import React from 'react';
import type { Plan } from '../../services/api/subscription-api';
import { Check, Zap, Shield, Crown } from 'lucide-react';
import { Button } from '../ui/button';

interface PlanCardProps {
  plan: Plan;
  onSubscribe: (planId: string) => void;
  isLoading?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onSubscribe, isLoading }) => {
  const features = Array.isArray(plan.features) ? plan.features : [];
  
  const isProfessional = plan.name.toLowerCase().includes('professional');
  const isEnterprise = plan.name.toLowerCase().includes('enterprise');

  return (
    <div className={`relative group overflow-hidden rounded-[32px] border transition-all duration-500 hover:-translate-y-2 flex flex-col h-full p-8 ${
      isProfessional 
        ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' 
        : 'border-border bg-card hover:border-primary/50'
    }`}>
      {/* Decorative background element */}
      <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full blur-3xl transition-colors ${
        isProfessional ? 'bg-primary/30' : 'bg-primary/10 group-hover:bg-primary/20'
      }`} />

      {/* Badge for Popular/Pro plan */}
      {isProfessional && (
        <div className="absolute top-6 right-6 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
          Most Popular
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isProfessional ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            {isEnterprise ? <Crown size={20} /> : isProfessional ? <Zap size={20} /> : <Shield size={20} />}
          </div>
          <h3 className="text-xl font-bold text-foreground tracking-tight">{plan.name}</h3>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed min-h-[40px]">
          {plan.description || "Unlock premium features for your business."}
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-foreground tracking-tighter">{plan.price.toLocaleString()}</span>
          <span className="text-muted-foreground font-bold text-sm uppercase tracking-wider">{plan.currency}</span>
          <span className="text-muted-foreground/60 text-xs font-medium pl-1">/ {plan.durationDays} days</span>
        </div>
      </div>

      <div className="space-y-4 mb-10 flex-grow">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Features Included:</p>
        <ul className="space-y-3">
          {features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start gap-3 text-foreground/80 text-sm font-medium">
              <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Check size={12} className="text-primary" />
              </div>
              <span>{feature}</span>
            </li>
          ))}
          {features.length === 0 && (
            <li className="flex items-start gap-3 text-muted-foreground/40 text-sm italic">
              No specific features listed
            </li>
          )}
        </ul>
      </div>

      <Button
        onClick={() => onSubscribe(plan.id)}
        disabled={isLoading}
        className={`w-full h-14 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${
          isProfessional 
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20' 
            : 'bg-muted text-foreground hover:bg-muted/80'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          `Get ${plan.name}`
        )}
      </Button>
    </div>
  );
};

export default PlanCard;

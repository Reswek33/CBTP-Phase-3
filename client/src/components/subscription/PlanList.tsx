import React, { useEffect, useState } from 'react';
import { type Plan, subscriptionApi } from '../../services/api/subscription-api';
import PlanCard from './PlanCard';
import { toast } from 'sonner';

const PlanList: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await subscriptionApi.getPlans();
      if (response.success) {
        setPlans(response.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setSubscribingId(planId);
    try {
      const response = await subscriptionApi.initializePayment(planId);
      if (response.success && response.data.checkout_url) {
        // Redirect to Chapa checkout
        window.location.href = response.data.checkout_url;
      } else {
        toast.error('Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      toast.error('An error occurred while setting up payment');
    } finally {
      setSubscribingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/30 rounded-[32px] border border-border backdrop-blur-md">
        <p className="text-muted-foreground font-medium">No subscription plans available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          onSubscribe={handleSubscribe}
          isLoading={subscribingId === plan.id}
        />
      ))}
    </div>
  );
};

export default PlanList;

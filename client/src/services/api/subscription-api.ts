import { api } from "./api-client";

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  durationDays: number;
  features: any;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  startDate: string | null;
  endDate: string | null;
  plan: Plan;
}

export const subscriptionApi = {
  getPlans: async () => {
    const response = await api.get('/subscription/plans');
    return response.data;
  },

  initializePayment: async (planId: string) => {
    const response = await api.post('/subscription/initialize', { planId });
    return response.data;
  },

  verifyPayment: async (txRef: string) => {
    const response = await api.post('/subscription/verify', { txRef });
    return response.data;
  },

  getStatus: async () => {
    const response = await api.get('/subscription/status');
    return response.data;
  },
};

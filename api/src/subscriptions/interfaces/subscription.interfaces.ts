export interface Plan {
  name: string;
  price: number;
  currency: string;
  interval: 'month';
  stripePriceId: string;
  features: string[];
}

export interface SubscriptionResponse {
  id: string;
  planName: string;
  status: string;
  startDate: string;
  endDate: string;
  cancelledAt: string | null;
  createdAt: string;
}

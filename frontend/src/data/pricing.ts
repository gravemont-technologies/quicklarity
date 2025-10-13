// Strategic Clarity Engine - Pricing Plans
// Updated for GPT-5 ultra-efficient costs

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  priceId: string; // Stripe Price ID
  interval: 'month' | 'year';
  description: string;
  features: string[];
  limits: {
    plansPerMonth: number;
    tasksPerPlan: number;
    documentsPerPlan: number;
    calendarEvents: boolean;
    notionPublishing: boolean;
    prioritySupport: boolean;
  };
  popular?: boolean;
  cta: string;
}

export const PRICING_PLANS: PricingTier[] = [
  {
    id: 'free',
    name: 'Starter',
    price: 0,
    priceId: '', // No Stripe price for free
    interval: 'month',
    description: 'Try strategic planning with AI',
    features: [
      '1 strategic plan per month',
      'Up to 10 tasks analyzed',
      '1 document upload',
      'Notion page delivery',
      'Basic calendar events (.ics)',
      'GPT-5 Mini AI quality',
      'Community support',
    ],
    limits: {
      plansPerMonth: 1,
      tasksPerPlan: 10,
      documentsPerPlan: 1,
      calendarEvents: true,
      notionPublishing: true,
      prioritySupport: false,
    },
    cta: 'Start Free',
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 29,
    priceId: process.env.VITE_STRIPE_PRICE_PRO || 'price_pro_monthly',
    interval: 'month',
    description: 'For founders who execute fast',
    features: [
      '5 strategic plans per month',
      'Unlimited tasks per plan',
      '3 documents per plan',
      'Notion + Google Calendar',
      'Priority processing',
      'GPT-5 full AI quality',
      'Email support (24h response)',
      'Export to PDF',
    ],
    limits: {
      plansPerMonth: 5,
      tasksPerPlan: 9999,
      documentsPerPlan: 3,
      calendarEvents: true,
      notionPublishing: true,
      prioritySupport: false,
    },
    popular: true,
    cta: 'Start Pro Trial',
  },
  {
    id: 'business',
    name: 'Business',
    price: 79,
    priceId: process.env.VITE_STRIPE_PRICE_BUSINESS || 'price_business_monthly',
    interval: 'month',
    description: 'For teams scaling execution',
    features: [
      '20 strategic plans per month',
      'Unlimited tasks per plan',
      '5 documents per plan',
      'Team collaboration (coming soon)',
      'Custom integrations',
      'GPT-5 full AI quality',
      'Priority support (4h response)',
      'Dedicated success manager',
    ],
    limits: {
      plansPerMonth: 20,
      tasksPerPlan: 9999,
      documentsPerPlan: 5,
      calendarEvents: true,
      notionPublishing: true,
      prioritySupport: true,
    },
    cta: 'Start Business Trial',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    priceId: process.env.VITE_STRIPE_PRICE_ENTERPRISE || 'price_enterprise_monthly',
    interval: 'month',
    description: 'For organizations at scale',
    features: [
      'Unlimited strategic plans',
      'Unlimited everything',
      'White-label option',
      'API access',
      'Custom AI model fine-tuning',
      'SSO / SAML authentication',
      'SLA guarantees',
      'Dedicated account team',
    ],
    limits: {
      plansPerMonth: 9999,
      tasksPerPlan: 9999,
      documentsPerPlan: 10,
      calendarEvents: true,
      notionPublishing: true,
      prioritySupport: true,
    },
    cta: 'Contact Sales',
  },
];

// Annual pricing (20% discount)
export const ANNUAL_PRICING: PricingTier[] = [
  {
    ...PRICING_PLANS[1],
    price: 23, // $276/year (normally $348)
    interval: 'year',
    priceId: process.env.VITE_STRIPE_PRICE_PRO_ANNUAL || 'price_pro_annual',
  },
  {
    ...PRICING_PLANS[2],
    price: 63, // $756/year (normally $948)
    interval: 'year',
    priceId: process.env.VITE_STRIPE_PRICE_BUSINESS_ANNUAL || 'price_business_annual',
  },
  {
    ...PRICING_PLANS[3],
    price: 239, // $2,868/year (normally $3,588)
    interval: 'year',
    priceId: process.env.VITE_STRIPE_PRICE_ENTERPRISE_ANNUAL || 'price_enterprise_annual',
  },
];

// Profit margin analysis (cost vs revenue)
export const PROFIT_ANALYSIS = {
  costPerPlan: 0.005, // LLM cost with GPT-5
  infrastructureCostPerUser: 0.012, // Server, DB, queue
  totalCostPerPlan: 0.017,
  
  margins: {
    free: {
      cost: 0.017,
      revenue: 0,
      profit: -0.017,
      margin: -100, // Loss leader
    },
    pro: {
      plans: 5,
      cost: 0.017 * 5, // $0.085
      revenue: 29,
      profit: 28.915,
      margin: 33959, // 33,959% profit margin 🚀
    },
    business: {
      plans: 20,
      cost: 0.017 * 20, // $0.34
      revenue: 79,
      profit: 78.66,
      margin: 23135, // 23,135% profit margin 💰
    },
    enterprise: {
      plans: 100, // Assume avg 100/month
      cost: 0.017 * 100, // $1.70
      revenue: 299,
      profit: 297.30,
      margin: 17488, // 17,488% profit margin 💎
    },
  },
};


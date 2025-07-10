export enum SubStatusType {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRIAL = 'trial',
  PAID = 'paid',
}

export enum SubPlanType {
  STARTER = 'starter',
  PRO = 'pro',
  PREMIUM = 'premium',
  SLIDE_STARTER = 'Starter Plan',
  SLIDE_PRO = 'Pro Plan',
  SLIDE_PREMIUM = 'Premium Plan',
  SUB_PLAN_MONTH = 'subcription.plan.montly',
  SUB_PLAN_YEAR = 'subcription.plan.yearly',
}

// Revenuecat webhook event types
export enum RevcatEventType {
  INITIAL_PURCHASE = 'INITIAL_PURCHASE',
  RENEWAL = 'RENEWAL',
  PRODUCT_CHANGE = 'PRODUCT_CHANGE',
  SUBSCRIPTION_PAUSED = 'SUBSCRIPTION_PAUSED',
  EXPIRATION = 'EXPIRATION',
  CANCELLATION = 'CANCELLATION',
  BILLING_ISSUE = 'BILLING_ISSUE',
}

export enum ProdIdType {
  PRO = 'premium',
  PREMIUM = 'starter',
}

export enum StripeCurrencyType {
  USD = 'usd',
  EUR = 'Eur',
  GBP = 'gbp',
  AUD = 'aud',
}

export enum IntervalType {
  MONTH = 'month',
  YEAR = 'year',
}

export enum ClinExIntervalType {
  MONTH = 'month',
  FOURMONTHS = 'fourmonths',
}

export enum TrialEndType {
  NOW = 'now',
}

export enum PlanIntervalType {
  PRO_MONTH = 'medscroll.pro.monthly',
  PRO_YEAR = 'medscroll.pro.yearly',
  PREMIUM_MONTH = 'medscroll.premium.monthly',
  PREMIUM_YEAR = 'medscroll.premium.yearly',
}

export enum UnitAmountType {
  PLUS_MONTHLY_PALN = 999,
  PLUS_YEARLYLY_PALN = 9999,
  PRO_MONTHLY_PALN = 1999,
  PRO_YEARLYLY_PALN = 19999,
}

export enum SubStatusType {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CANCEL = 'CANCEL',
}

export enum CancelSubType {
  ABANDONED = 'abandoned',
  DUPLICATE = 'duplicate',
  FRAUDULENT = 'fraudulent',
  REQUESTED_BY_CUSTOMER = 'requested_by_customer',
}

export enum AppType {
  LOOPSCRIBE = 'loopscribe',
  MEDSCROLL = 'medscroll',
  MEDSCROLL_SLIDE = 'medscroll_slide',
  MEDSCROLL_CLINICAL_EXAMS = 'medscroll_clinical_exams',
}

export enum ListSubType {
  CANCELED = 'canceled',
  ENDED = 'ended',
  ALL = 'all',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing',
  PAUSED = 'paused',
}

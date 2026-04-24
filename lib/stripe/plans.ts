export type PlanId = 'starter' | 'pro' | 'enterprise'

export interface Plan {
  id: PlanId
  name: string
  description: string
  priceMonthly: number // EUR
  priceYearly: number  // EUR
  currency: string
  assetLimit: number   // -1 = unlimited
  userLimit: number    // -1 = unlimited
  features: string[]
  stripePriceIdMonthly: string
  stripePriceIdYearly: string
  popular?: boolean
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Für kleine Betriebe',
    priceMonthly: 19,
    priceYearly: 190,
    currency: 'eur',
    assetLimit: 25,
    userLimit: 5,
    features: [
      'Bis zu 25 Assets',
      'Bis zu 5 Mitarbeiter',
      'QR-Code-Sticker',
      'Basis-Verlauf',
      'E-Mail-Support',
    ],
    stripePriceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '',
    stripePriceIdYearly: process.env.STRIPE_PRICE_STARTER_YEARLY ?? '',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Für wachsende Betriebe',
    priceMonthly: 49,
    priceYearly: 490,
    currency: 'eur',
    assetLimit: 150,
    userLimit: 25,
    features: [
      'Bis zu 150 Assets',
      'Bis zu 25 Mitarbeiter',
      'Fotos & Schadensdoku',
      'Push-Benachrichtigungen',
      'Wartungsplan',
      'CSV-Export',
      'Prioritäts-Support',
    ],
    popular: true,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? '',
    stripePriceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? '',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Für große Betriebe',
    priceMonthly: 129,
    priceYearly: 1290,
    currency: 'eur',
    assetLimit: -1,
    userLimit: -1,
    features: [
      'Unbegrenzte Assets',
      'Unbegrenzte Mitarbeiter',
      'Alle Pro-Features',
      'API-Zugang',
      'Dedizierter Support',
      'SLA-Garantie',
    ],
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? '',
    stripePriceIdYearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY ?? '',
  },
}

export function getPlan(planId: string | null | undefined): Plan {
  return PLANS[(planId as PlanId) ?? 'starter'] ?? PLANS.starter
}

export function checkAssetLimit(plan: Plan, currentCount: number): boolean {
  if (plan.assetLimit === -1) return true
  return currentCount < plan.assetLimit
}

export function checkUserLimit(plan: Plan, currentCount: number): boolean {
  if (plan.userLimit === -1) return true
  return currentCount < plan.userLimit
}


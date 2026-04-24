export type PlanId = 'free' | 'starter' | 'pro'

export interface Plan {
  id: PlanId
  name: string
  description: string
  priceMonthly: number   // EUR/Monat
  priceYearly: number    // EUR/Jahr (Gesamtbetrag)
  currency: string
  assetLimit: number     // -1 = unlimited
  userLimit: number      // -1 = unlimited
  features: string[]
  stripePriceIdMonthly: string | null
  stripePriceIdYearly: string | null
  popular?: boolean
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Zum Ausprobieren',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'eur',
    assetLimit: 10,
    userLimit: 2,
    features: [
      'Bis zu 10 Assets',
      'Bis zu 2 Mitarbeiter',
      'QR-Code-Sticker',
      'Basis-Dashboard',
    ],
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Für kleine Betriebe',
    priceMonthly: 12,
    priceYearly: 99,
    currency: 'eur',
    assetLimit: 50,
    userLimit: 5,
    features: [
      'Bis zu 50 Assets',
      'Bis zu 5 Mitarbeiter',
      'Fotos & Schadensdoku',
      'Wartungsplan',
      'Offline-PWA',
      'E-Mail-Support',
    ],
    stripePriceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '',
    stripePriceIdYearly: process.env.STRIPE_PRICE_STARTER_YEARLY ?? '',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Für wachsende Betriebe',
    priceMonthly: 25,
    priceYearly: 199,
    currency: 'eur',
    assetLimit: -1,
    userLimit: 50,
    features: [
      'Unbegrenzte Assets',
      'Bis zu 50 Mitarbeiter',
      'Alle Starter-Features',
      'Push-Benachrichtigungen',
      'CSV-Export',
      'Stripe Billing Portal',
      'Prioritäts-Support',
    ],
    popular: true,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? '',
    stripePriceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? '',
  },
}

export function getPlan(planId: string | null | undefined): Plan {
  return PLANS[(planId as PlanId) ?? 'free'] ?? PLANS.free
}

export function checkAssetLimit(plan: Plan, currentCount: number): boolean {
  if (plan.assetLimit === -1) return true
  return currentCount < plan.assetLimit
}

export function checkUserLimit(plan: Plan, currentCount: number): boolean {
  if (plan.userLimit === -1) return true
  return currentCount < plan.userLimit
}

export const PRICING_TIERS = {
  BASIC: {
    id: 'BASIC',
    name: 'Basic',
    maxUploads: 10,
    features: {
      aiChat: false,
      advancedTrends: false,
      priorityProcessing: false,
      familySharing: false,
    }
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    maxUploads: Infinity,
    features: {
      aiChat: true,
      advancedTrends: true,
      priorityProcessing: true,
      familySharing: false,
    }
  },
  FAMILY: {
    id: 'FAMILY',
    name: 'Family',
    maxUploads: Infinity,
    features: {
      aiChat: true,
      advancedTrends: true,
      priorityProcessing: true,
      familySharing: true, // Up to 5 profiles
    }
  }
} as const;

export type PlanTier = keyof typeof PRICING_TIERS;

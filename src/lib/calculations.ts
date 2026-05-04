import type { Property, UrgencyLevel } from "@/lib/types";

const urgencyWeight: Record<UrgencyLevel, number> = {
  low: 10,
  medium: 25,
  high: 40,
  urgent: 55,
};

export function estimatedCommission(estimatedValue: number, commissionPercentage: number) {
  return Math.round((Number(estimatedValue) || 0) * ((Number(commissionPercentage) || 0) / 100));
}

export function netPotential(property: Pick<Property, "postRegularizationValue" | "estimatedValue" | "regularizationEstimatedCost">) {
  return Math.round(
    (Number(property.postRegularizationValue) || 0) -
      (Number(property.estimatedValue) || 0) -
      (Number(property.regularizationEstimatedCost) || 0),
  );
}

export function gabPriorityScore(property: Pick<Property, "estimatedValue" | "regularizationEstimatedCost" | "estimatedCommission" | "urgencyLevel">) {
  const valueScore = Math.min(30, (Number(property.estimatedValue) || 0) / 100000);
  const commissionScore = Math.min(35, (Number(property.estimatedCommission) || 0) / 20000);
  const difficultyPenalty = Math.min(25, (Number(property.regularizationEstimatedCost) || 0) / 25000);
  const score = valueScore + commissionScore + urgencyWeight[property.urgencyLevel] - difficultyPenalty;
  return Math.max(0, Math.min(100, Math.round(score)));
}

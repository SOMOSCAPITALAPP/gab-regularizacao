export type Locale = "pt-BR" | "fr";

export type CurrentStatus =
  | "newLead"
  | "analysis"
  | "contactStarted"
  | "meetingScheduled"
  | "mandateSigned"
  | "regularization"
  | "forSale"
  | "closed"
  | "lost";

export type UrgencyLevel = "low" | "medium" | "high" | "urgent";
export type ChecklistStatus = "pending" | "inProgress" | "done" | "blocked";
export type ActivityType = "call" | "whatsapp" | "meeting" | "email" | "documentRequest" | "negotiation";

export type Owner = {
  id: string;
  fullName: string;
  cpfCnpj: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  mainProblem: string;
  objections: string;
  urgencyLevel: UrgencyLevel;
  lastContactDate: string;
  nextActionDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Property = {
  id: string;
  ownerId?: string;
  address: string;
  city: string;
  neighborhood: string;
  propertyType: string;
  estimatedValue: number;
  iptuDebt: number;
  regularizationEstimatedCost: number;
  postRegularizationValue: number;
  commissionPercentage: number;
  estimatedCommission: number;
  registryNumber: string;
  cartorioStatus: string;
  legalStatus: string;
  source: string;
  urgencyLevel: UrgencyLevel;
  opportunityScore: number;
  currentStatus: CurrentStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentRecord = {
  id: string;
  propertyId: string;
  name: string;
  type: string;
  fileUrl: string;
  uploadDate: string;
  notes: string;
};

export type ChecklistItem = {
  id: string;
  propertyId: string;
  label: string;
  status: ChecklistStatus;
  responsible: string;
  dueDate: string;
  notes: string;
};

export type Activity = {
  id: string;
  propertyId: string;
  ownerId?: string;
  date: string;
  type: ActivityType;
  summary: string;
  nextStep: string;
  responsible: string;
};

export type MarketOpportunity = {
  id: string;
  title: string;
  city: string;
  neighborhood: string;
  propertyType: string;
  sourceName: string;
  sourceUrl: string;
  askingPrice: number;
  estimatedMarketValue: number;
  discountPercentage: number;
  signals: string[];
  motivation: string;
  riskLevel: "low" | "medium" | "high";
  status: "watching" | "qualified" | "contacted" | "discarded";
  notes: string;
  createdAt: string;
};

export type AppData = {
  properties: Property[];
  owners: Owner[];
  documents: DocumentRecord[];
  checklist: ChecklistItem[];
  activities: Activity[];
  marketOpportunities: MarketOpportunity[];
};

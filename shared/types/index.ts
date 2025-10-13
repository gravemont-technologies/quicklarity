/**
 * Shared types for Strategic Clarity Engine
 * Used across API and Worker services
 */

// ============= Request/Response Types =============

export interface IntakePayload {
  // Founder Profile
  founderName: string;
  founderEmail: string;
  companyName?: string;
  companyStage?: 'idea' | 'mvp' | 'early-revenue' | 'scaling';
  founderRole?: string;
  founderSkills?: string[];
  
  // Tasks
  tasks: Task[];
  
  // Optional Context
  contextNotes?: string;
  uploadedDocs?: UploadedDocument[];
  
  // Tier
  tier: 'free' | 'paid';
  
  // OAuth tokens (optional)
  googleCalendarToken?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  urgencyLevel?: 'low' | 'medium' | 'high';
  category?: string;
  estimatedEffort?: 'low' | 'medium' | 'high';
  dependencies?: string[]; // IDs of other tasks
  owner?: string; // Who should do this
}

export interface UploadedDocument {
  filename: string;
  contentType: string;
  base64Content: string; // Or URL if stored elsewhere
  sizeBytes: number;
}

export interface IntakeResponse {
  success: boolean;
  jobId: string;
  message: string;
  estimatedCompletionTime: number; // seconds
}

export interface StatusResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  
  // Results (when completed)
  notionUrl?: string;
  calendarEvents?: CalendarEvent[];
  icsDownloadUrls?: string[];
  
  // Error info (when failed)
  errorMessage?: string;
  
  // Metadata
  createdAt: string;
  completedAt?: string;
  processingDurationMs?: number;
}

// ============= Internal Processing Types =============

export interface FounderProfile {
  name: string;
  email: string;
  company?: string;
  stage?: string;
  role?: string;
  skills: string[];
  summary: string; // LLM-generated summary
}

export interface DocumentSummary {
  filename: string;
  summary: string;
  keyInsights: string[];
  tokenCount: number;
}

export interface ScoredTask extends Task {
  impactScore: number; // 0-10
  urgency: number; // 0-1
  revenueLeverage: number; // 0-1
  dependencyCount: number;
  effortEstimate: number; // 0-1 (0=low effort, 1=high effort)
  founderSkillMatch: number; // 0-1
  rawScore: number; // Before normalization
}

export interface StrategicPlan {
  executiveSummary: string;
  topPriorities: Priority[];
  schedule: ScheduleBlock[];
  risks: Risk[];
  nextSteps: string[];
  metadata: PlanMetadata;
}

export interface Priority {
  rank: number;
  taskId: string;
  taskTitle: string;
  impactScore: number;
  rationale: string;
  preworkRequired: string[];
  estimatedDuration: string;
  successMetrics: string[];
}

export interface ScheduleBlock {
  week: number;
  focus: string;
  tasks: string[]; // Task IDs
  milestones: string[];
  risksToWatch: string[];
}

export interface Risk {
  type: 'technical' | 'market' | 'execution' | 'resource';
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface PlanMetadata {
  generatedAt: string;
  founderName: string;
  totalTasks: number;
  planningHorizon: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  location?: string;
  attendees?: string[];
}

// ============= Database Types =============

export interface IntakeSubmission {
  id: string;
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  tier: 'free' | 'paid';
  
  // Founder profile
  founder_name: string;
  founder_email: string;
  company_name?: string;
  company_stage?: string;
  founder_role?: string;
  founder_skills?: string[];
  
  // Tasks and context
  tasks: Task[];
  context_notes?: string;
  uploaded_docs?: UploadedDocument[];
  
  // Processing results
  strategic_plan?: StrategicPlan;
  notion_url?: string;
  calendar_events?: CalendarEvent[];
  
  // Metadata
  llm_cost_usd: number;
  processing_duration_ms?: number;
  error_message?: string;
  
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface DocumentCacheEntry {
  id: string;
  doc_hash: string;
  original_filename: string;
  summary: string;
  token_count: number;
  created_at: string;
}

// ============= Cost Tracking Types =============

export interface CostEstimate {
  summarizationCost: number;
  planGenerationCost: number;
  totalCost: number;
  withinBudget: boolean;
  budget: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
}

// ============= LLM Configuration Types =============

export interface LLMCall {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  userPrompt: string;
}

export interface LLMResponse {
  content: string;
  usage: TokenUsage;
  finishReason: string;
}

// ============= Utility Types =============

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type UserTier = 'free' | 'paid';

// Cost constants (USD per 1K tokens)
export const PRICING = {
  GPT_4O_NANO_PROMPT: 0.00015,
  GPT_4O_NANO_COMPLETION: 0.0006,
  GPT_4O_MINI_PROMPT: 0.00015,
  GPT_4O_MINI_COMPLETION: 0.0006,
  GPT_4O_PROMPT: 0.005,
  GPT_4O_COMPLETION: 0.015,
} as const;

export const BUDGETS = {
  FREE_TIER_MAX: 0.05,
  PAID_TIER_MAX: 1.0,
} as const;


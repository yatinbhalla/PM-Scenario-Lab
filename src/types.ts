export type AppMode = 'quick_rep' | 'meeting_room' | 'end_to_end';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type ThemeFocus = 'AI-Heavy' | 'Design Thinking-Heavy' | 'Execution-Heavy' | 'Data/Metrics-Heavy' | 'Strategy-Heavy' | 'General Everyday Scenario' | 'Critical Thinking' | 'Curiosity' | 'Creative Thinking' | 'Custom Theme' | (string & {});

export interface SimulationConfig {
  mode: AppMode;
  difficulty: Difficulty;
  theme: ThemeFocus;
  timePressure: boolean;
  stakeholders?: string[];
}

export interface CompetencyScore {
  competency: string;
  score: number;
  feedback: string;
}

export interface EvaluationResult {
  overallScore: number;
  executiveSummary: string;
  yourApproach: string;
  idealApproach: string;
  unreadPolitics: string;
  alternativeStrategicPaths: string[];
  targetedAreasForImprovement: string[];
  thinkingToInvoke: string;
  competencyBreakdown: CompetencyScore[];
  actionableNextStep: string;
}

export interface PastSession {
  id: string;
  date: string;
  config: SimulationConfig;
  status: 'in-progress' | 'completed';
  evaluation?: EvaluationResult;
  messages?: Message[];
  turnCount?: number;
  timeLeft?: number;
  geminiHistory?: any[]; // To store the raw Gemini chat history
}

export interface Message {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}

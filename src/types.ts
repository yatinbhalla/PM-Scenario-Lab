export type AppMode = 'quick_rep' | 'meeting_room' | 'end_to_end';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type ThemeFocus = 'AI-Heavy' | 'Design Thinking-Heavy' | 'Execution-Heavy' | 'Data/Metrics-Heavy' | 'Strategy-Heavy' | 'General Everyday Scenario' | 'Custom Theme' | (string & {});

export interface SimulationConfig {
  mode: AppMode;
  difficulty: Difficulty;
  theme: ThemeFocus;
  timePressure: boolean;
}

export interface CompetencyScore {
  competency: string;
  score: number;
  feedback: string;
}

export interface EvaluationResult {
  overallScore: number;
  scores: CompetencyScore[];
  summary: string;
  improvementVectors: string[];
}

export interface PastSession {
  id: string;
  date: string;
  config: SimulationConfig;
  evaluation: EvaluationResult;
}

export interface Message {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}

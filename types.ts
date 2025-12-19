
export enum AppSection {
  HOME = 'HOME',
  GENERAL = 'GENERAL',
  VIT = 'VIT',
  GATE = 'GATE'
}

export enum Subject {
  OS = 'Operating Systems',
  CN = 'Computer Networks',
  DSA = 'Data Structures & Algorithms',
  CD = 'Compiler Design',
  TOC = 'Theory of Computation',
  CAO = 'Computer Architecture',
  DAA = 'Design & Analysis of Algorithms',
  SWE = 'Software Engineering',
  DSD = 'Digital System Design',
  DBMS = 'Database Management Systems'
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export enum DashboardTab {
  PRACTICE = 'Practice',
  MOCK_TEST = 'Mock Test',
  HISTORY = 'History'
}

export enum ExamType {
  REGULAR = 'Topic Wise',
  CAT1 = 'CAT-I',
  CAT2 = 'CAT-II',
  FAT = 'FAT',
  GATE_FULL = 'Full Syllabus Mock'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  suggestedQuestions?: string[]; // New: For follow-up chips
}

export interface Question {
  id: string;
  text: string;
  options: string[]; // Can be empty if descriptive
  correctAnswer: string; 
  explanation: string;
  subject: string;
  topic: string;
  difficulty: string;
}

export interface QuizAttempt {
  questionId: string;
  userAnswer?: string; // Selected option (if MCQ)
  userTextAnswer?: string; // Typed answer
  userImageAnswer?: string; // Base64 image
  isCorrect?: boolean;
  aiEvaluation?: string; // Detailed feedback
  score?: number; // 0-100
  timeTaken: number; // in seconds
  subject: string; // Added for flat analytics
  topic: string; // Added for flat analytics
  difficulty: string; // Added for flat analytics
}

export interface EvaluationResponse {
  score: number;
  isCorrect: boolean;
  feedback: string;
  mistakeAnalysis: string;
}

export interface AnalysisResult {
  percentile: number;
  accuracy: number;
  weakTopics: string[];
  strongTopics: string[];
  recommendation: string;
  speedAnalysis: string;
}

// New Interface for Material context
export interface MaterialContext {
  name: string;
  content: string; // Text content or Base64
  type: 'text' | 'image';
}

// History & Session Types
export interface QuizSession {
  id: string;
  date: string; // ISO Date string
  type: 'PRACTICE' | 'MOCK';
  section: AppSection;
  examType?: ExamType;
  subject: string;
  topic: string;
  score: number;
  totalMarks: number;
  questions: Question[];
  attempts: QuizAttempt[];
  analysis?: AnalysisResult; 
}

// --- ANALYTICS & ML TYPES ---

// Bayesian Knowledge Tracing Parameters
export interface BKTParams {
  p_learn: number;   // Probability of learning the skill in a step
  p_slip: number;    // Probability of making a mistake despite knowing the skill
  p_guess: number;   // Probability of guessing correctly without knowing
  p_known: number;   // Current probability the user KNOWS the skill
}

export interface TopicAnalytics {
  topic: string;
  masteryProbability: number; // BKT Result (0.0 to 1.0)
  forecastedScore: number; // Linear Regression Result
  attemptsCount: number;
  averageTime: number;
  lastPracticed: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface TopicStrength {
  topic: string;
  masteryScore: number;
  lastPracticed: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface UserProfile {
  id: string;
  name: string;
  totalXP: number;
  sessionsCompleted: number;
  joinedDate: string;
  // BKT State per topic
  knowledgeState: Record<string, BKTParams>; 
}
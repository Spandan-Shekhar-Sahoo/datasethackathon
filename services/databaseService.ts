
import { QuizSession, UserProfile, TopicAnalytics, BKTParams } from "../types";
import { analyzeTopicPerformance } from "./analyticsEngine";

// Database Keys
const DB_TABLES = {
  USER: 'prep_ai_db_user',
  SESSIONS: 'prep_ai_db_sessions',
  ANALYTICS: 'prep_ai_db_analytics'
};

const initializeDatabase = () => {
    if (!localStorage.getItem(DB_TABLES.USER)) {
        // Seed Data
        const sessions: any[] = [
             {
                id: 'sess_1',
                date: new Date(Date.now() - 432000000).toISOString(),
                type: 'PRACTICE',
                section: 'VIT',
                subject: 'Operating Systems',
                topic: 'Process Scheduling',
                score: 45,
                totalMarks: 50,
                questions: [],
                attempts: []
            },
            {
                id: 'sess_2',
                date: new Date(Date.now() - 259200000).toISOString(),
                type: 'MOCK',
                section: 'GATE',
                subject: 'DSA',
                topic: 'Trees & Graphs',
                score: 30,
                totalMarks: 50,
                questions: [],
                attempts: []
            },
            {
                id: 'sess_3',
                date: new Date(Date.now() - 86400000).toISOString(),
                type: 'PRACTICE',
                section: 'VIT',
                subject: 'Computer Networks',
                topic: 'IP Addressing',
                score: 20,
                totalMarks: 50,
                questions: [],
                attempts: []
            }
        ];

        const analytics: Record<string, any> = {
            'Process Scheduling': {
                topic: 'Process Scheduling',
                masteryProbability: 0.88,
                forecastedScore: 90,
                attemptsCount: 12,
                averageTime: 45,
                lastPracticed: new Date().toISOString(),
                trend: 'UP'
            },
            'Trees & Graphs': {
                topic: 'Trees & Graphs',
                masteryProbability: 0.62,
                forecastedScore: 65,
                attemptsCount: 8,
                averageTime: 120,
                lastPracticed: new Date().toISOString(),
                trend: 'STABLE'
            },
            'IP Addressing': {
                topic: 'IP Addressing',
                masteryProbability: 0.25,
                forecastedScore: 30,
                attemptsCount: 5,
                averageTime: 180,
                lastPracticed: new Date().toISOString(),
                trend: 'DOWN'
            }
        };

        const user = {
            id: 'user_' + Date.now(),
            name: 'Student',
            totalXP: 1250,
            sessionsCompleted: 14,
            joinedDate: new Date().toISOString(),
            knowledgeState: {}
        };

        localStorage.setItem(DB_TABLES.USER, JSON.stringify(user));
        localStorage.setItem(DB_TABLES.SESSIONS, JSON.stringify(sessions));
        localStorage.setItem(DB_TABLES.ANALYTICS, JSON.stringify(analytics));
    }
}

// --- DATA ACCESS OBJECTS (DAO) ---

// 1. User DAO
export const getUser = (): UserProfile => {
  initializeDatabase();
  const data = localStorage.getItem(DB_TABLES.USER);
  if (data) return JSON.parse(data);
  
  // Fallback (should be handled by init, but safe to keep)
  const newUser: UserProfile = {
    id: 'user_' + Date.now(),
    name: 'Student',
    totalXP: 0,
    sessionsCompleted: 0,
    joinedDate: new Date().toISOString(),
    knowledgeState: {}
  };
  saveUser(newUser);
  return newUser;
};

export const saveUser = (user: UserProfile) => {
  localStorage.setItem(DB_TABLES.USER, JSON.stringify(user));
};

// 2. Session DAO
export const getSessions = (): QuizSession[] => {
  initializeDatabase();
  const data = localStorage.getItem(DB_TABLES.SESSIONS);
  return data ? JSON.parse(data) : [];
};

export const addSession = (session: QuizSession) => {
  const sessions = getSessions();
  sessions.unshift(session); // Newest first
  localStorage.setItem(DB_TABLES.SESSIONS, JSON.stringify(sessions));
  
  // Trigger Analytics Pipeline
  processSessionData(session);
};

// 3. Analytics DAO (Stores computed insights)
export const getAnalytics = (): Record<string, TopicAnalytics> => {
  initializeDatabase();
  const data = localStorage.getItem(DB_TABLES.ANALYTICS);
  return data ? JSON.parse(data) : {};
};

export const saveAnalytics = (data: Record<string, TopicAnalytics>) => {
  localStorage.setItem(DB_TABLES.ANALYTICS, JSON.stringify(data));
};

// --- ANALYTICS PIPELINE ---

const processSessionData = (session: QuizSession) => {
  const user = getUser();
  const currentAnalytics = getAnalytics();

  // 1. Run Machine Learning Engine
  const { metrics, newKnowledgeState } = analyzeTopicPerformance(session.attempts, user.knowledgeState);

  // 2. Update User Knowledge State (BKT)
  user.knowledgeState = newKnowledgeState;
  user.totalXP += session.score;
  user.sessionsCompleted += 1;
  saveUser(user);

  // 3. Merge Metrics
  const updatedAnalytics = { ...currentAnalytics, ...metrics };
  saveAnalytics(updatedAnalytics);
  
  console.log("Database & Analytics Pipeline executed successfully.");
};

// --- HELPER QUERIES ---

export const getWeakestTopics = (limit: number = 3): TopicAnalytics[] => {
  const analytics = getAnalytics();
  return Object.values(analytics)
    .sort((a, b) => a.masteryProbability - b.masteryProbability)
    .slice(0, limit);
};

export const getTopicStats = (topic: string): TopicAnalytics | null => {
  const analytics = getAnalytics();
  return analytics[topic] || null;
};

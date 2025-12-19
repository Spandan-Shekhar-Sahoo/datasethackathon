
import { QuizSession, TopicStrength } from "../types";
import * as DB from "./databaseService";

// This file is kept for backward compatibility but now acts as a wrapper 
// around the robust databaseService.ts

export const saveSession = (session: QuizSession): void => {
  DB.addSession(session);
};

export const getSessions = (): QuizSession[] => {
  return DB.getSessions();
};

export const getUserProfile = () => {
  const user = DB.getUser();
  const analytics = DB.getAnalytics();
  
  // Map new structure to old structure if needed by legacy components
  const topicStrengths: Record<string, TopicStrength> = {};
  
  Object.values(analytics).forEach(a => {
    topicStrengths[a.topic] = {
      topic: a.topic,
      masteryScore: Math.round(a.masteryProbability * 100),
      lastPracticed: a.lastPracticed,
      trend: a.trend
    };
  });

  return {
    ...user,
    topicStrengths
  };
};

export const getWeakestTopics = (limit: number = 3): TopicStrength[] => {
  const analytics = DB.getWeakestTopics(limit);
  return analytics.map(a => ({
    topic: a.topic,
    masteryScore: Math.round(a.masteryProbability * 100),
    lastPracticed: a.lastPracticed,
    trend: a.trend
  }));
};

export const getStrongestTopics = (limit: number = 3): TopicStrength[] => {
  const all = Object.values(DB.getAnalytics());
  return all
    .sort((a, b) => b.masteryProbability - a.masteryProbability)
    .slice(0, limit)
    .map(a => ({
      topic: a.topic,
      masteryScore: Math.round(a.masteryProbability * 100),
      lastPracticed: a.lastPracticed,
      trend: a.trend
    }));
};

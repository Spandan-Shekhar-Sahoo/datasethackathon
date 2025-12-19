
import { BKTParams, QuizAttempt, TopicAnalytics } from "../types";

// --- MACHINE LEARNING ALGORITHMS ---

/**
 * Bayesian Knowledge Tracing (BKT) Update
 * Estimates the probability (p_known) that a student has mastered a skill
 * based on their latest attempt (correct/incorrect).
 */
export const updateBKT = (currentParams: BKTParams, isCorrect: boolean): BKTParams => {
  const { p_known, p_learn, p_slip, p_guess } = currentParams;
  let p_known_posterior = 0;

  if (isCorrect) {
    // P(L|Correct) = (P(L) * (1 - P(Slip))) / (P(L)*(1-P(Slip)) + (1-P(L))*P(Guess))
    const num = p_known * (1 - p_slip);
    const den = (p_known * (1 - p_slip)) + ((1 - p_known) * p_guess);
    p_known_posterior = num / den;
  } else {
    // P(L|Incorrect) = (P(L) * P(Slip)) / (P(L)*P(Slip) + (1-P(L))*(1-P(Guess)))
    const num = p_known * p_slip;
    const den = (p_known * p_slip) + ((1 - p_known) * (1 - p_guess));
    p_known_posterior = num / den;
  }

  // Update with probability of learning during this step
  // P(L_next) = P(L|Obs) + (1 - P(L|Obs)) * P(Learn)
  const new_p_known = p_known_posterior + ((1 - p_known_posterior) * p_learn);

  return {
    ...currentParams,
    p_known: Math.min(0.99, Math.max(0.01, new_p_known)) // Clamp between 0.01 and 0.99
  };
};

/**
 * Simple Linear Regression
 * Predicts the next score based on historical performance trend.
 * y = mx + c
 */
export const predictNextScore = (history: number[]): number => {
  if (history.length < 2) return history.length === 1 ? history[0] : 0;

  const n = history.length;
  const x = Array.from({ length: n }, (_, i) => i); // [0, 1, 2...]
  const y = history;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + (xi * y[i]), 0);
  const sumXX = x.reduce((sum, xi) => sum + (xi * xi), 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Predict for next step (x = n)
  const prediction = (slope * n) + intercept;
  return Math.min(100, Math.max(0, prediction));
};

/**
 * Calculates Peer Percentile (Simulated Normal Distribution)
 */
export const calculatePercentile = (userScore: number, mean: number = 60, stdDev: number = 15): number => {
  const z = (userScore - mean) / stdDev;
  // Approximation of CDF of Normal Distribution
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.398942280401432678 * Math.exp(-z * z / 2);
  let prob = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  if (z > 0) prob = 1 - prob;
  return Math.round(prob * 100);
};

// --- AGGREGATION SERVICES ---

export const analyzeTopicPerformance = (
  attempts: QuizAttempt[], 
  previousBKT: Record<string, BKTParams>
): { metrics: Record<string, TopicAnalytics>, newKnowledgeState: Record<string, BKTParams> } => {
  
  const topicGroups: Record<string, QuizAttempt[]> = {};
  
  // Group by topic
  attempts.forEach(a => {
    if (!topicGroups[a.topic]) topicGroups[a.topic] = [];
    topicGroups[a.topic].push(a);
  });

  const metrics: Record<string, TopicAnalytics> = {};
  const newKnowledgeState: Record<string, BKTParams> = { ...previousBKT };

  Object.keys(topicGroups).forEach(topic => {
    const topicAttempts = topicGroups[topic];
    
    // 1. Initialize or Get BKT State
    let bktParams = newKnowledgeState[topic] || {
      p_learn: 0.1,  // 10% chance to learn per step
      p_slip: 0.1,   // 10% chance to slip
      p_guess: 0.2,  // 20% chance to guess
      p_known: 0.3   // Start with 30% mastery assumption
    };

    // 2. Run BKT on new attempts
    topicAttempts.forEach(att => {
        const correct = att.isCorrect || (att.score || 0) > 7; // Threshold for subjective
        bktParams = updateBKT(bktParams, correct);
    });
    newKnowledgeState[topic] = bktParams;

    // 3. Calculate Trend (Mocking historical data + current)
    // In a real DB, we would fetch last 10 scores. Here we simulate variation around the BKT p_known.
    const projectedScore = Math.round(bktParams.p_known * 100);
    const prevScore = Math.round((previousBKT[topic]?.p_known || 0.3) * 100);

    metrics[topic] = {
      topic,
      masteryProbability: bktParams.p_known,
      forecastedScore: projectedScore,
      attemptsCount: topicAttempts.length,
      averageTime: topicAttempts.reduce((a, b) => a + b.timeTaken, 0) / topicAttempts.length,
      lastPracticed: new Date().toISOString(),
      trend: projectedScore > prevScore ? 'UP' : projectedScore < prevScore ? 'DOWN' : 'STABLE'
    };
  });

  return { metrics, newKnowledgeState };
};

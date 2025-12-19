
import { GoogleGenAI, Type } from "@google/genai";
import { Message, Question, Subject, Difficulty, EvaluationResponse, ExamType, MaterialContext, AnalysisResult } from "../types";
import * as Backend from "./mockBackend";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export interface ChatResponse {
  text: string;
  suggestedQuestions: string[];
}

export const generateChatResponse = async (
  history: Message[],
  userMessage: string,
  currentContext?: string
): Promise<ChatResponse> => {
  try {
    const formattedHistory = history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    let systemInstruction = `You are an expert AI Teaching Assistant for computer science engineering students (VIT/GATE).
        
        CRITICAL OUTPUT RULE:
        You must response in valid JSON format ONLY. 
        Schema: { "text": "your response body", "followUps": ["question 1", "question 2", "question 3"] }

        Context Rules:
        1. Be encouraging, precise, and educational.
        2. "followUps" should be 3 short, clickable questions the user might want to ask next to deepen understanding or chain learning.
        3. If the user is viewing a specific question (see Context below), the follow-ups should relate to that specific question's concept.
    `;

    if (currentContext) {
      systemInstruction += `\n\nCURRENT SCREEN CONTEXT (User is looking at): ${currentContext}\n
      Use this to explain things if the user asks "help me with this" or "explain this".`;
    }

    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json", // Enforce JSON
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                text: { type: Type.STRING },
                followUps: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["text", "followUps"]
        }
      },
      history: formattedHistory
    });

    const result = await chat.sendMessage({ message: userMessage });
    
    if (result.text) {
        const parsed = JSON.parse(result.text);
        return {
            text: parsed.text,
            suggestedQuestions: parsed.followUps || []
        };
    }
    throw new Error("Empty response");

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return {
        text: "I'm having trouble connecting. Please check your connection.",
        suggestedQuestions: []
    };
  }
};

export const generateQuizQuestions = async (
  subject: string, 
  topic: string,
  difficulty: Difficulty,
  count: number = 5,
  examMode?: ExamType,
  material?: MaterialContext,
  isVIT: boolean = false,
  blueprintContext?: string
): Promise<Question[]> => {
  try {
    let contextInstructions = "";

    if (examMode === ExamType.CAT1) {
      contextInstructions = "This is a VIT CAT-1 Exam. Focus on Module 1-3 concepts. 10 Marks complexity.";
    } else if (examMode === ExamType.CAT2) {
      contextInstructions = "This is a VIT CAT-2 Exam. Focus on Module 4-6 concepts. 10 Marks complexity.";
    } else if (examMode === ExamType.FAT) {
      contextInstructions = "This is a VIT FAT Exam. Full syllabus. 10 Marks complexity.";
    } else if (examMode === ExamType.GATE_FULL) {
      contextInstructions = "GATE Pattern. High conceptual depth. Mix of MCQ and NAT.";
    }

    let prompt = "";
    const parts: any[] = [];

    const isTheoryOnly = isVIT || !!blueprintContext; 

    const formatInstruction = isTheoryOnly 
        ? "IMPORTANT: Generate descriptive/theory questions ONLY. Do NOT generate multiple choice questions. The 'options' array in the JSON output MUST be empty. Questions should require written explanation or calculation." 
        : "Generate Multiple Choice Questions (MCQs) with 4 distinct options. The 'options' array must contain exactly 4 strings. Ensure one option is clearly correct.";

    if (material) {
      prompt = `Generate ${count} questions based STRICTLY and ONLY on the provided material content below.
      Subject: ${subject}. Topic: ${topic}. Difficulty: ${difficulty}.
      ${formatInstruction}
      Material: ${material.type === 'text' ? material.content.substring(0, 15000) : '(See attached image)'}`;
      
      if (material.type === 'image') {
          // Extract proper mime type or default to jpeg
         const mimeMatch = material.content.match(/^data:(.*);base64,/);
         const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
         const cleanBase64 = material.content.split(',')[1] || material.content;

         parts.push({ inlineData: { mimeType: mimeType, data: cleanBase64 } });
      }
    } else {
      prompt = `Generate ${count} conceptual questions for Subject: "${subject}". Topic: "${topic}". Difficulty: "${difficulty}".
      Context: ${contextInstructions}
      ${formatInstruction}
      Questions should be university/GATE level.`;
    }

    if (blueprintContext) {
        prompt += `\n\nSTRICTLY FOLLOW THIS BLUEPRINT:\n${blueprintContext}`;
    }

    prompt += `\nOutput JSON: fields id, text, options (array), correctAnswer, explanation, subject, topic, difficulty.`;
    parts.push({ text: prompt });

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              subject: { type: Type.STRING },
              topic: { type: Type.STRING },
              difficulty: { type: Type.STRING }
            },
            required: ["id", "text", "options", "correctAnswer", "explanation", "subject", "topic", "difficulty"]
          }
        }
      }
    });

    if (!result.text) throw new Error("No response from AI");
    return JSON.parse(result.text);
  } catch (error) {
    console.error("Gemini Quiz Error:", error);
    return [];
  }
};

export const evaluateSubjectiveAnswer = async (
  question: Question,
  userText: string,
  base64Image?: string,
  selectedOption?: string
): Promise<EvaluationResponse> => {
  try {
    const parts: any[] = [];
    if (base64Image) {
      // Robust MIME type extraction from Data URL
      const mimeMatch = base64Image.match(/^data:(.*);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const cleanBase64 = base64Image.split(',')[1] || base64Image;

      parts.push({ inlineData: { mimeType: mimeType, data: cleanBase64 } });
    }

    let promptText = `
    Evaluate answer for: ${question.text}
    Correct Solution: ${question.explanation}
    Correct Option: ${question.correctAnswer}
    
    Student Option: "${selectedOption || 'None'}"
    Student Text: "${userText}"
    
    Score out of 10. Rules:
    1. MCQ Wrong/Null = 0.
    2. Subjective Empty = 0.
    3. 10/10 only for perfection.
    4. Provide constructive feedback.
    `;
    parts.push({ text: promptText });

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            isCorrect: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING },
            mistakeAnalysis: { type: Type.STRING }
          },
          required: ["score", "isCorrect", "feedback", "mistakeAnalysis"]
        }
      }
    });

    if (!result.text) throw new Error("No evaluation generated");
    return JSON.parse(result.text);
  } catch (error) {
    console.error("Evaluation Error:", error);
    return {
      score: 0,
      isCorrect: false,
      feedback: "Error analyzing answer.",
      mistakeAnalysis: "System error."
    };
  }
};

export const analyzePerformance = async (
  attempts: any[]
): Promise<AnalysisResult | null> => {
  try {
    // 1. Get Session Data
    const sessionData = attempts.map(a => ({
      topic: a.question.topic,
      difficulty: a.question.difficulty,
      correct: a.isCorrect,
      score: a.score,
      timeTaken: a.timeTaken
    }));

    // 2. Get Global Context from Mock Backend
    const weakTopics = Backend.getWeakestTopics(5);
    const globalContext = `Global Weak Topics: ${weakTopics.map(w => w.topic + ' (' + w.masteryScore + '%)').join(', ')}`;

    const prompt = `Perform a Data Science Analysis on this session: ${JSON.stringify(sessionData)}.
    User's Historical Context: ${globalContext}.
    
    Tasks:
    1. Calculate weighted accuracy.
    2. Estimate Percentile Ranking (0-99).
    3. Identify Weak Topics (Local + Global context).
    4. Provide a Detailed Roadmap Recommendation based on their historical weakness.
    5. Speed Analysis.

    Output valid JSON.`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                percentile: { type: Type.NUMBER },
                accuracy: { type: Type.NUMBER },
                weakTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
                strongTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommendation: { type: Type.STRING },
                speedAnalysis: { type: Type.STRING }
            },
            required: ["percentile", "accuracy", "weakTopics", "strongTopics", "recommendation", "speedAnalysis"]
        }
      }
    });

    if (!result.text) return null;
    return JSON.parse(result.text) as AnalysisResult;
  } catch (error) {
    console.error("Analysis Error", error);
    return null;
  }
};


import React, { useState, useRef, useEffect } from 'react';
import { Question, QuizAttempt, EvaluationResponse, QuizSession, AppSection, ExamType, AnalysisResult } from '../types';
import { analyzePerformance, evaluateSubjectiveAnswer } from '../services/geminiService';
import { saveSession } from '../services/mockBackend';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface QuizInterfaceProps {
  questions: Question[];
  subject: string;
  topic: string;
  isMock: boolean;
  section: AppSection;
  examType?: ExamType;
  onComplete: (session: QuizSession) => void;
  onExit: () => void;
  onHome: () => void; // Go to Home Screen
  onContextUpdate: (ctx: string) => void;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({ 
  questions, 
  subject, 
  topic, 
  isMock, 
  section,
  examType,
  onComplete, 
  onExit, 
  onHome,
  onContextUpdate 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  
  const [userText, setUserText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  const [showResult, setShowResult] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationResponse | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isFinalAnalyzing, setIsFinalAnalyzing] = useState(false);
  
  const [startTime, setStartTime] = useState<number>(Date.now());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (currentQuestion) {
        onContextUpdate(`Current Question: ${currentQuestion.text}. Topic: ${currentQuestion.topic}. Subject: ${currentQuestion.subject}.`);
        setStartTime(Date.now()); // Reset timer for new question
    }
  }, [currentQuestion, onContextUpdate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        alert("Please upload a valid image file (JPG, JPEG, or PNG).");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the file input click
    setSelectedImage(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleEvaluate = async () => {
    if (!userText && !selectedImage && !selectedOption) return;

    setIsEvaluating(true);
    const duration = (Date.now() - startTime) / 1000; // Duration in seconds
    
    const evaluation = await evaluateSubjectiveAnswer(
        currentQuestion, 
        userText, 
        selectedImage || undefined,
        selectedOption || undefined
    );
    
    setCurrentEvaluation(evaluation);
    setShowResult(true);
    setIsEvaluating(false);

    onContextUpdate(`User answered: ${evaluation.isCorrect ? 'Correctly' : 'Incorrectly'}. Score: ${evaluation.score}/10. Feedback: ${evaluation.feedback}. Suggest follow-up questions now.`);

    const newAttempt: QuizAttempt = {
      questionId: currentQuestion.id,
      userAnswer: selectedOption || undefined,
      userTextAnswer: userText,
      userImageAnswer: selectedImage || undefined,
      isCorrect: evaluation.isCorrect,
      score: evaluation.score,
      aiEvaluation: evaluation.feedback,
      timeTaken: duration,
      subject: currentQuestion.subject,
      topic: currentQuestion.topic,
      difficulty: currentQuestion.difficulty
    };
    setAttempts(prev => [...prev, newAttempt]);
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserText('');
      setSelectedImage(null);
      setSelectedOption(null);
      setShowResult(false);
      setCurrentEvaluation(null);
    } else {
      finishQuiz(attempts); // Pass current attempts, as state update might lag slightly if called directly
    }
  };

  const finishQuiz = async (finalAttempts: QuizAttempt[]) => {
      setIsFinalAnalyzing(true);
      const result = await analyzePerformance(finalAttempts);
      if (result) {
          setAnalysisResult(result);
          onContextUpdate(`User finished quiz. Percentile: ${result.percentile}. Weak Areas: ${result.weakTopics.join(', ')}`);
          
          // Construct Session
          const totalUserScore = finalAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0);
            const session: QuizSession = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                type: isMock ? 'MOCK' : 'PRACTICE',
                section,
                examType,
                subject,
                topic,
                score: totalUserScore,
                totalMarks: questions.length * 10,
                questions,
                attempts: finalAttempts,
                analysis: result
            };
            
            // SAVE TO BACKEND SERVICE
            saveSession(session);
            
            onComplete(session);
      }
      setIsFinalAnalyzing(false);
  };

  const getOptionStyle = (option: string) => {
    let style = "p-4 rounded-xl border-2 text-left transition-all duration-300 relative overflow-hidden font-medium ";
    
    if (showResult) {
        if (option === currentQuestion.correctAnswer) {
            style += "bg-green-50 border-green-500 text-green-800 shadow-md ";
        } else if (option === selectedOption && option !== currentQuestion.correctAnswer) {
            style += "bg-red-50 border-red-500 text-red-800 opacity-80 ";
        } else {
            style += "bg-white border-slate-100 text-slate-400 opacity-50 ";
        }
    } else {
        if (option === selectedOption) {
            style += "bg-purple-50 border-purple-600 text-purple-900 shadow-md scale-[1.01] ";
        } else {
            style += "bg-white border-slate-200 text-slate-600 hover:border-purple-300 hover:bg-purple-50/30 ";
        }
    }
    return style;
  };

  if (isFinalAnalyzing) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
        <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-purple-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Generating Data Science Analysis</h2>
        <p className="text-slate-500 text-sm">Running Bayesian Knowledge Tracing & Time-Series Classification...</p>
      </div>
    );
  }

  // Analytics Dashboard View
  if (attempts.length === questions.length && !showResult && analysisResult) {
    const totalMaxScore = attempts.length * 10;
    const totalUserScore = attempts.reduce((acc, curr) => acc + (curr.score || 0), 0);
    const avgTime = attempts.reduce((acc, curr) => acc + curr.timeTaken, 0) / attempts.length;
    
    // Prepare Chart Data
    const timeData = attempts.map((a, i) => ({
        name: `Q${i + 1}`,
        time: Math.round(a.timeTaken),
        score: a.score
    }));

    return (
      <div className="h-full overflow-y-auto p-4 md:p-8 bg-slate-50">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl border border-indigo-50 shadow-sm gap-4">
              <div>
                  <h2 className="text-2xl font-black text-slate-800">Session Analytics</h2>
                  <p className="text-slate-500 text-sm">Evaluation powered by <span className="font-bold text-indigo-600">Gemini Neural Network</span></p>
              </div>
              <div className="flex gap-3">
                  <button onClick={onExit} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors">
                    <i className="fas fa-arrow-left mr-2"></i> Back
                  </button>
                  <button onClick={onHome} className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold transition-colors">
                    <i className="fas fa-home mr-2"></i> Home
                  </button>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Score Card */}
              <div className="bg-white p-6 rounded-3xl border border-indigo-50 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                      <i className="fas fa-trophy text-8xl text-purple-600"></i>
                  </div>
                  <h3 className="text-slate-500 font-bold text-xs uppercase mb-2">Overall Score</h3>
                  <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-purple-600">{totalUserScore}</span>
                      <span className="text-lg text-slate-400 font-bold">/ {totalMaxScore}</span>
                  </div>
                  <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{width: `${(totalUserScore/totalMaxScore)*100}%`}}></div>
                  </div>
              </div>

              {/* Percentile Card */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
                  <div className="absolute -bottom-4 -right-4 text-white opacity-10">
                      <i className="fas fa-chart-line text-9xl"></i>
                  </div>
                  <h3 className="text-indigo-200 font-bold text-xs uppercase mb-1">Percentile Rank</h3>
                  <p className="text-[10px] text-indigo-300 mb-3">Compared to peer group</p>
                  <div className="flex items-center gap-3">
                      <span className="text-5xl font-black">{analysisResult.percentile}th</span>
                      <div className="text-xs bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">
                          Top {100 - analysisResult.percentile}%
                      </div>
                  </div>
              </div>

              {/* Time Card */}
              <div className="bg-white p-6 rounded-3xl border border-indigo-50 shadow-sm">
                   <h3 className="text-slate-500 font-bold text-xs uppercase mb-2">Avg. Time per Qn</h3>
                   <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl font-black text-slate-800">{avgTime.toFixed(1)}s</span>
                      <span className="text-xs text-slate-400">/ qn</span>
                   </div>
                   <p className="text-xs text-indigo-600 font-medium bg-indigo-50 inline-block px-2 py-1 rounded-lg">
                      {analysisResult.speedAnalysis}
                   </p>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weak Topics */}
              <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <i className="fas fa-exclamation-triangle text-red-500"></i> Areas for Improvement
                  </h3>
                  <div className="flex flex-wrap gap-2">
                      {analysisResult.weakTopics.length > 0 ? analysisResult.weakTopics.map((t, i) => (
                          <span key={i} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm font-bold border border-red-100">
                              {t}
                          </span>
                      )) : <span className="text-slate-500 text-sm">None detected. Good job!</span>}
                  </div>
                  <p className="mt-4 text-sm text-slate-500 leading-relaxed">
                      AI Recommendation: <span className="text-slate-700 font-medium">{analysisResult.recommendation}</span>
                  </p>
              </div>

              {/* Strong Topics */}
              <div className="bg-white p-6 rounded-3xl border border-green-100 shadow-sm">
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <i className="fas fa-star text-green-500"></i> Strong Concepts
                  </h3>
                  <div className="flex flex-wrap gap-2">
                      {analysisResult.strongTopics.length > 0 ? analysisResult.strongTopics.map((t, i) => (
                          <span key={i} className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-sm font-bold border border-green-100">
                              {t}
                          </span>
                      )) : <span className="text-slate-500 text-sm">Keep practicing to build strengths.</span>}
                  </div>
              </div>
          </div>

          {/* Time Analysis Chart */}
          <div className="bg-white p-6 rounded-3xl border border-indigo-50 shadow-sm h-80">
              <h3 className="font-bold text-slate-800 mb-4">Time vs. Score Analysis</h3>
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" hide />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" hide />
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        cursor={{fill: '#f8fafc'}}
                      />
                      <Bar yAxisId="left" dataKey="time" fill="#818cf8" name="Time (s)" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar yAxisId="right" dataKey="score" fill="#c084fc" name="Score" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
              </ResponsiveContainer>
          </div>

          <div className="text-center pb-8">
               <p className="text-xs text-slate-400 mb-4">Algorithms used: Semantic Clustering, Percentile Estimation, Time-Series Anomaly Detection</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto p-4 md:p-6 overflow-y-auto custom-scrollbar">
       {/* Top Navigation for Quiz */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md ${isMock ? 'bg-indigo-600' : 'bg-purple-600'}`}>
                {currentIndex + 1}
             </div>
             <div>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{isMock ? 'Mock Test' : 'Practice Mode'}</p>
                 <h2 className="text-sm font-bold text-slate-800">{subject} &bull; {topic}</h2>
                 {examType && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">{examType}</span>}
             </div>
        </div>
        <button 
            onClick={() => {
                if(window.confirm("Are you sure you want to exit? Your progress will not be saved.")) {
                    onExit();
                }
            }}
            className="text-slate-400 hover:text-red-500 font-medium text-sm flex items-center gap-2 px-3 py-2 hover:bg-red-50 rounded-lg transition-all"
        >
            <i className="fas fa-sign-out-alt"></i> Exit
        </button>
      </div>

      <div className="w-full bg-slate-200 h-2.5 rounded-full mb-8 shrink-0">
        <div 
          className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(124,58,237,0.3)]"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
        <div className="flex flex-col gap-6">
            <div className="bg-white rounded-3xl border border-indigo-50 p-8 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-purple-600 font-bold text-xs tracking-widest uppercase bg-purple-50 px-3 py-1 rounded-full">
                    Question {currentIndex + 1}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        currentQuestion.difficulty === 'Easy' ? 'border-green-200 text-green-700 bg-green-50' :
                        currentQuestion.difficulty === 'Medium' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                        'border-red-200 text-red-700 bg-red-50'
                    }`}>
                    {currentQuestion.difficulty}
                    </span>
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-8 leading-relaxed">
                    {currentQuestion.text}
                </h2>
                
                {currentQuestion.options && currentQuestion.options.length > 0 && (
                    <div className="grid grid-cols-1 gap-3">
                        {currentQuestion.options.map((opt, i) => (
                            <button
                                key={i}
                                disabled={showResult}
                                onClick={() => setSelectedOption(opt)}
                                className={getOptionStyle(opt)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border ${
                                        selectedOption === opt || (showResult && opt === currentQuestion.correctAnswer)
                                            ? 'bg-purple-600 border-purple-600 text-white' 
                                            : 'bg-slate-100 border-slate-200 text-slate-500'
                                    }`}>
                                        {String.fromCharCode(65+i)}
                                    </div>
                                    <span className="font-medium text-sm md:text-base">{opt}</span>
                                    
                                    {showResult && opt === currentQuestion.correctAnswer && (
                                        <div className="absolute right-4 animate-scale-in">
                                            <i className="fas fa-check-circle text-green-500 text-xl"></i>
                                        </div>
                                    )}
                                    {showResult && selectedOption === opt && opt !== currentQuestion.correctAnswer && (
                                        <div className="absolute right-4 animate-scale-in">
                                            <i className="fas fa-times-circle text-red-500 text-xl"></i>
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {showResult && (
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 animate-fade-in shadow-sm">
                    <h4 className="text-sm font-bold text-blue-700 uppercase mb-2 flex items-center gap-2">
                        <i className="fas fa-lightbulb"></i> Ideal Solution
                    </h4>
                    <p className="text-blue-900 text-sm leading-relaxed whitespace-pre-line">
                        {currentQuestion.explanation}
                    </p>
                </div>
            )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-indigo-50 p-6 shadow-lg flex-1 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Your Answer</h3>
            <p className="text-xs text-slate-400 mb-4">
                Explain your reasoning for full marks.
            </p>
            
            <textarea
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              disabled={showResult}
              placeholder="Type your detailed steps here..."
              className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-4 focus:outline-none focus:border-purple-500 focus:bg-white transition-all resize-none min-h-[150px] mb-4 text-sm leading-relaxed placeholder-slate-400 shadow-inner"
            />

            <div className="mb-4">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/png, image/jpeg, image/jpg"
                className="hidden" 
                disabled={showResult}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={showResult}
                className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all group ${
                  selectedImage 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-slate-200 hover:border-purple-400 bg-slate-50 hover:bg-white'
                }`}
              >
                {selectedImage ? (
                  <div className="relative w-full h-40 group/img">
                     <img src={selectedImage} alt="Upload" className="w-full h-full object-contain rounded-lg" />
                     {!showResult && (
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm rounded-lg">
                             <span 
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                className="bg-white/20 hover:bg-white/40 text-white text-xs px-3 py-2 rounded-full font-bold cursor-pointer"
                             >
                                Change
                             </span>
                             <span 
                                onClick={handleRemoveImage}
                                className="bg-red-500/80 hover:bg-red-600 text-white text-xs px-3 py-2 rounded-full font-bold cursor-pointer"
                             >
                                Remove
                             </span>
                         </div>
                     )}
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 group-hover:scale-110 transition-transform group-hover:bg-purple-100 group-hover:text-purple-600">
                        <i className="fas fa-camera text-xl"></i>
                    </div>
                    <span className="text-sm font-semibold text-slate-500 group-hover:text-purple-600">Upload Handwritten Solution</span>
                    <span className="text-xs text-slate-400 mt-1">Supports JPG, PNG</span>
                  </>
                )}
              </button>
            </div>

            {!showResult ? (
              <button
                onClick={handleEvaluate}
                disabled={(!userText && !selectedImage && !selectedOption) || isEvaluating}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2 transform hover:scale-[1.01]"
              >
                {isEvaluating ? <><i className="fas fa-circle-notch fa-spin"></i> Evaluating...</> : <><i className="fas fa-check-circle"></i> Submit Answer</>}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="w-full bg-slate-900 text-white hover:bg-slate-800 py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-3 transform hover:scale-[1.01]"
              >
                {currentIndex === questions.length - 1 ? 'Finish Session' : 'Next Question'}
                <i className="fas fa-arrow-right"></i>
              </button>
            )}
          </div>

          {showResult && currentEvaluation && (
            <div className={`rounded-3xl border p-6 shadow-xl animate-fade-in ${
              currentEvaluation.isCorrect 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className={`text-lg font-bold ${currentEvaluation.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {currentEvaluation.isCorrect ? 'Excellent!' : 'Needs Review'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Based on content evaluation</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className={`text-4xl font-black ${currentEvaluation.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {currentEvaluation.score}<span className="text-lg text-slate-400 font-medium">/10</span>
                    </span>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Marks</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Feedback</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{currentEvaluation.feedback}</p>
                </div>
                {!currentEvaluation.isCorrect && (
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                    <p className="text-xs font-bold text-red-400 uppercase mb-2">Mistake Analysis</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{currentEvaluation.mistakeAnalysis}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizInterface;

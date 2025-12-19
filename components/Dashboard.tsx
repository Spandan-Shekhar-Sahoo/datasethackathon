
import React, { useState, useRef, useEffect } from 'react';
import { Subject, Difficulty, Question, AppSection, DashboardTab, ExamType, MaterialContext, QuizSession } from '../types';
import { generateQuizQuestions } from '../services/geminiService';
import { getVITBlueprint } from '../services/vitBlueprint';
import { getGATEBlueprint } from '../services/gateBlueprint';
import QuizInterface from './QuizInterface';

interface DashboardProps {
  section: AppSection;
  onBack: () => void; // This acts as Go Home
  onContextUpdate: (ctx: string) => void;
}

// Curriculum Data
const VIT_CURRICULUM: Record<string, string[]> = {
  [Subject.OS]: ["Process Scheduling", "Deadlocks", "Memory Management", "Virtual Memory", "File Systems", "Disk Scheduling", "Threads", "CPU Scheduling Algorithms", "Semaphores", "Inter-process Communication"],
  [Subject.CN]: ["OSI Model", "Data Link Layer", "Routing Algorithms", "TCP Congestion Control", "IP Addressing & Subnetting", "HTTP/DNS/FTP", "Network Security", "Switching Techniques", "Error Detection & Correction"],
  [Subject.DSA]: ["Arrays & Linked Lists", "Stacks & Queues", "Binary Trees & BST", "AVL & B-Trees", "Graphs (BFS/DFS)", "Sorting Algorithms", "Dynamic Programming", "Hashing", "Heaps"],
  [Subject.DBMS]: ["ER Modeling", "Relational Algebra", "SQL Queries", "Normalization (1NF-BCNF)", "Transaction Management", "Concurrency Control", "Indexing & Hashing", "ACID Properties"],
  [Subject.CD]: ["Lexical Analysis", "Parsing Techniques (LL/LR)", "Syntax Directed Translation", "Intermediate Code Generation", "Code Optimization", "Symbol Tables", "Compiler Phases"],
  [Subject.TOC]: ["Finite Automata (DFA/NFA)", "Regular Expressions", "Context-Free Grammars", "Pushdown Automata", "Turing Machines", "P vs NP", "Undecidability"],
  [Subject.CAO]: ["Instruction Set Architecture", "Pipelining", "Cache Memory Mapping", "Virtual Memory", "Input/Output Organization", "Computer Arithmetic", "Addressing Modes"],
  [Subject.DAA]: ["Divide & Conquer", "Greedy Algorithms", "Dynamic Programming", "Backtracking", "Branch & Bound", "NP-Completeness", "Graph Algorithms", "Amortized Analysis"],
  [Subject.SWE]: ["SDLC Models", "Agile & Scrum", "Requirements Engineering", "Design Patterns", "Software Testing", "Maintenance & Evolution", "Software Quality Assurance"],
  [Subject.DSD]: ["Boolean Algebra", "Combinational Circuits", "Sequential Circuits", "Flip-Flops", "Counters & Registers", "Logic Families", "Verilog/VHDL", "FSM Design"]
};

const Dashboard: React.FC<DashboardProps> = ({ section, onBack, onContextUpdate }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.PRACTICE);
  
  // Quiz History State
  const [history, setHistory] = useState<QuizSession[]>([]);

  // Input States
  const [subjectInput, setSubjectInput] = useState<string>('');
  const [topicInput, setTopicInput] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [isBlueprintMode, setIsBlueprintMode] = useState(false);

  const [materialContext, setMaterialContext] = useState<MaterialContext | undefined>(undefined);
  const [selectedExamType, setSelectedExamType] = useState<ExamType | null>(null);
  
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuizConfig, setCurrentQuizConfig] = useState<{subject: string, topic: string, isMock: boolean, examType?: ExamType} | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'dashboard' | 'quiz'>('dashboard');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history strictly for appending new sessions
  useEffect(() => {
    const saved = localStorage.getItem('prep_ai_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveHistory = (newSession: QuizSession) => {
    const updated = [newSession, ...history];
    setHistory(updated);
    localStorage.setItem('prep_ai_history', JSON.stringify(updated));
  };

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
         const content = reader.result as string;
         setMaterialContext({
           name: file.name,
           content: content,
           type: file.type.startsWith('image/') ? 'image' : 'text'
         });
      };
      if (file.type.startsWith('image/')) reader.readAsDataURL(file);
      else reader.readAsText(file);
    }
  };

  // Helper to get topics safely
  const getTopicsForSubject = (subj: string) => {
    if (!subj) return [];
    if (VIT_CURRICULUM[subj]) return VIT_CURRICULUM[subj];
    const key = Object.keys(VIT_CURRICULUM).find(k => k.toLowerCase() === subj.toLowerCase());
    return key ? VIT_CURRICULUM[key] : [];
  };

  const availableTopics = getTopicsForSubject(subjectInput);

  const startQuiz = async (isMock: boolean = false) => {
    if (!materialContext && !subjectInput && !isMock) {
         setError("Please select/type a subject OR upload material.");
         return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      let count = 5;
      let finalTopic = topicInput;
      let finalExamType = selectedExamType ? selectedExamType : undefined;

      if (isMock) {
        if (!finalExamType) {
            // Default exam type if not selected for mock
             finalExamType = section === AppSection.VIT ? ExamType.FAT : ExamType.GATE_FULL; 
        }
        count = 10;
        finalTopic = "Full Syllabus";
      } else {
        // For Practice
         if (section === AppSection.VIT && !finalExamType) {
             finalExamType = ExamType.REGULAR;
         }
      }

      const isVIT = section === AppSection.VIT;
      const isGATE = section === AppSection.GATE;
      
      let blueprint = undefined;
      if (isBlueprintMode) {
        if (isVIT) {
            blueprint = getVITBlueprint(subjectInput);
        } else if (isGATE) {
            blueprint = getGATEBlueprint(subjectInput);
        }
      }

      const questions = await generateQuizQuestions(
        subjectInput || "General", 
        finalTopic || "General", 
        difficulty, 
        count,
        finalExamType,
        materialContext,
        isVIT,
        blueprint
      );
      
      if (questions && questions.length > 0) {
        setQuizQuestions(questions);
        setCurrentQuizConfig({
            subject: subjectInput || "General",
            topic: finalTopic || "General",
            isMock,
            examType: finalExamType
        });
        onContextUpdate(`User started a session. Section: ${section}. Material: ${materialContext ? 'Yes' : 'No'}. Subject: ${subjectInput}. Topic: ${finalTopic}. Pattern: ${finalExamType}. Blueprint Mode: ${isBlueprintMode}`);
        setView('quiz');
      } else {
        setError("AI could not generate questions. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuizComplete = (session: QuizSession) => {
    saveHistory(session);
    // Note: We don't automatically go back to dashboard here anymore, 
    // because the QuizInterface shows the analytics result screen first.
  };

  const handleQuizExit = () => {
    setView('dashboard');
  };

  if (view === 'quiz' && currentQuizConfig) {
    return (
        <QuizInterface 
            questions={quizQuestions} 
            subject={currentQuizConfig.subject}
            topic={currentQuizConfig.topic}
            isMock={currentQuizConfig.isMock}
            section={section}
            examType={currentQuizConfig.examType}
            onComplete={handleQuizComplete} 
            onExit={handleQuizExit}
            onHome={onBack}
            onContextUpdate={onContextUpdate} 
        />
    );
  }

  // --- RENDERERS ---

  const renderHistory = () => {
    const sectionHistory = history.filter(h => h.section === section);

    return (
        <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <i className="fas fa-history text-indigo-500"></i> {section === AppSection.VIT ? 'VIT Prep History' : 'GATE Prep History'}
            </h2>
            
            {sectionHistory.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 text-2xl">
                        <i className="fas fa-box-open"></i>
                    </div>
                    <p className="text-slate-500 font-medium">No attempts recorded yet for this section.</p>
                    <button onClick={() => setActiveTab(DashboardTab.PRACTICE)} className="mt-4 text-indigo-600 font-bold hover:underline">Start Practice</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {sectionHistory.map((sess) => (
                        <div key={sess.id} className="bg-white p-5 rounded-2xl border border-indigo-50 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0 ${
                                    sess.type === 'MOCK' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
                                }`}>
                                    {sess.type === 'MOCK' ? 'M' : 'P'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-slate-800">{sess.subject}</h4>
                                        {sess.examType && (
                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase border border-slate-200">{sess.examType}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500">{sess.topic} &bull; {new Date(sess.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6 border-t md:border-t-0 border-slate-50 pt-3 md:pt-0">
                                <div className="text-right">
                                    <div className="text-sm font-bold text-slate-700">Score</div>
                                    <div className={`text-lg font-black ${sess.score/sess.totalMarks > 0.7 ? 'text-green-500' : 'text-indigo-500'}`}>
                                        {sess.score}/{sess.totalMarks}
                                    </div>
                                </div>
                                <div className="w-px h-10 bg-slate-100 hidden md:block"></div>
                                <div className="text-center min-w-[60px]">
                                    <div className="text-xs text-slate-400 font-bold uppercase mb-1">Accuracy</div>
                                    <div className="text-sm font-bold text-slate-700">{Math.round((sess.score/sess.totalMarks)*100)}%</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
  };

  const renderPracticeForm = () => (
    <div className="max-w-2xl mx-auto animate-fade-in p-2">
        <div className="bg-white rounded-3xl border border-indigo-50 p-8 shadow-xl">
            <h2 className="text-3xl font-bold text-slate-800 text-center mb-2">Configure Practice</h2>
            <p className="text-center text-slate-500 mb-8">Customize your learning session</p>
            
            <div className="space-y-8">
                
                {/* VIT Specific Pattern Selection */}
                {section === AppSection.VIT && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3">Examination Pattern</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[ExamType.CAT1, ExamType.CAT2, ExamType.FAT].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedExamType(selectedExamType === type ? null : type)}
                                        className={`py-3 px-2 rounded-xl text-sm font-bold border-2 transition-all ${
                                            selectedExamType === type 
                                            ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md transform scale-[1.02]' 
                                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-purple-200 hover:bg-white'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Blueprint Mode Toggle (Available for VIT and GATE) */}
                {(section === AppSection.VIT || section === AppSection.GATE) && (
                    <div 
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                            isBlueprintMode 
                            ? 'bg-indigo-50 border-indigo-500' 
                            : 'bg-white border-slate-200 hover:border-indigo-300'
                        }`}
                        onClick={() => setIsBlueprintMode(!isBlueprintMode)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${isBlueprintMode ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                <i className="fas fa-scroll"></i>
                            </div>
                            <div>
                                <h4 className={`font-bold text-sm ${isBlueprintMode ? 'text-indigo-900' : 'text-slate-700'}`}>
                                    {section === AppSection.VIT ? 'VIT PYQ Blueprint Mode' : 'GATE Pattern Mode'}
                                </h4>
                                <p className="text-xs text-slate-500">
                                    {section === AppSection.VIT 
                                     ? 'Generate questions based on historical VIT patterns' 
                                     : 'Focus on GATE previous year concepts and style'}
                                </p>
                            </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isBlueprintMode ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${isBlueprintMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </div>
                )}

                {/* Subject Type+Select */}
                <div className="relative">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                    <div className="relative group">
                        <input 
                            type="text" 
                            value={subjectInput}
                            onChange={(e) => setSubjectInput(e.target.value)}
                            onFocus={() => setShowSubjectDropdown(true)}
                            onBlur={() => setTimeout(() => setShowSubjectDropdown(false), 200)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all placeholder-slate-400 font-medium"
                            placeholder="Type to search or select..."
                        />
                        {showSubjectDropdown && (
                             <div className="absolute w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-20 animate-fade-in">
                                {Object.values(Subject).filter(s => s.toLowerCase().includes(subjectInput.toLowerCase())).map((sub) => (
                                    <div 
                                        key={sub} 
                                        onClick={() => { setSubjectInput(sub); setTopicInput(''); }} 
                                        className="px-4 py-3 hover:bg-purple-50 cursor-pointer text-sm text-slate-700 hover:text-purple-700 font-medium transition-colors border-b border-slate-50 last:border-0"
                                    >
                                        {sub}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400">
                            <i className="fas fa-search"></i>
                        </div>
                    </div>
                </div>

                {/* Topic Type+Select */}
                <div className="relative">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Topic</label>
                    <div className="relative group">
                        <input 
                            type="text" 
                            value={topicInput}
                            onChange={(e) => setTopicInput(e.target.value)}
                            onFocus={() => setShowTopicDropdown(true)}
                            onBlur={() => setTimeout(() => setShowTopicDropdown(false), 200)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all placeholder-slate-400 font-medium"
                            placeholder={subjectInput ? "Type to search or select topic..." : "Select a subject first..."}
                        />
                         {showTopicDropdown && (
                             <div className="absolute w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-20 animate-fade-in">
                                {availableTopics.filter(t => t.toLowerCase().includes(topicInput.toLowerCase())).map((topic) => (
                                    <div 
                                        key={topic} 
                                        onClick={() => setTopicInput(topic)} 
                                        className="px-4 py-3 hover:bg-purple-50 cursor-pointer text-sm text-slate-700 hover:text-purple-700 font-medium transition-colors border-b border-slate-50 last:border-0"
                                    >
                                        {topic}
                                    </div>
                                ))}
                                {availableTopics.length === 0 && (
                                     <div className="px-4 py-3 text-sm text-slate-400 italic">
                                         {subjectInput ? "No preset topics found. Type your own." : "Select a subject to see topics."}
                                     </div>
                                )}
                            </div>
                        )}
                         <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400">
                            <i className="fas fa-lightbulb"></i>
                        </div>
                    </div>
                </div>

                {/* Difficulty Dropdown */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Difficulty</label>
                    <div className="relative">
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-slate-900 appearance-none focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-medium"
                        >
                            {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-500">
                            <i className="fas fa-chevron-down"></i>
                        </div>
                    </div>
                </div>

                {/* Material Upload */}
                <div className="bg-indigo-50/50 rounded-xl p-6 border border-indigo-100">
                     <label className="block text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                        <i className="fas fa-book-open text-indigo-500"></i> Reference Material
                     </label>
                     <p className="text-xs text-indigo-600 mb-4">Upload notes or papers to generate questions specifically from them.</p>
                     
                     <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden" 
                     />
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-3 transition-all ${materialContext ? 'bg-white border-purple-500 text-purple-700 shadow-sm' : 'bg-white/50 border-indigo-200 text-slate-500 hover:border-purple-400 hover:bg-white'}`}
                     >
                        {materialContext ? (
                            <>
                                <i className="fas fa-check-circle text-green-500 text-xl"></i>
                                <span className="font-semibold">{materialContext.name}</span>
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">Ready</span>
                            </>
                        ) : (
                            <>
                                <i className="fas fa-cloud-upload-alt text-xl"></i>
                                <span className="font-medium">Click to upload PDF / Image / Text</span>
                            </>
                        )}
                     </button>
                </div>
                
                {error && (
                    <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-xl border border-red-100 font-medium animate-pulse">
                        <i className="fas fa-exclamation-circle mr-2"></i> {error}
                    </div>
                )}

                <button
                    onClick={() => startQuiz(false)}
                    disabled={isGenerating}
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-5 rounded-xl font-bold text-lg shadow-xl shadow-purple-200 transition-all flex items-center justify-center gap-3 transform hover:scale-[1.01] active:scale-95"
                >
                    {isGenerating ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-play"></i>}
                    {isGenerating ? 'Analyzing & Generating...' : 'Start Practice Session'}
                </button>
            </div>
        </div>
    </div>
  );

  const renderMockTest = () => (
    <div className="max-w-5xl mx-auto animate-fade-in p-2">
        <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Examination Mode</h2>
            <p className="text-slate-500">Simulate real exam conditions. Time-bound and strictly evaluated.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-indigo-50 shadow-xl max-w-2xl mx-auto">
             <h3 className="text-xl font-bold text-slate-800 mb-8 text-center flex items-center justify-center gap-2">
                <i className="fas fa-clock text-purple-500"></i> Configure Mock Exam
             </h3>

             {/* VIT Specific Pattern Selection */}
             {section === AppSection.VIT && (
                <div className="mb-8">
                    <label className="block text-sm font-semibold text-slate-700 mb-3 text-center">Select Examination Type</label>
                    <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                        {[ExamType.CAT1, ExamType.CAT2, ExamType.FAT].map((type) => (
                            <button
                                key={type}
                                onClick={() => setSelectedExamType(selectedExamType === type ? null : type)}
                                className={`py-4 px-2 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                                    selectedExamType === type 
                                    ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md transform scale-[1.02]' 
                                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-purple-200 hover:bg-white'
                                }`}
                            >
                                <span className={`w-3 h-3 rounded-full ${selectedExamType === type ? 'bg-purple-500' : 'bg-slate-300'}`}></span>
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
             )}
             
             {/* Subject */}
             <div className="mb-8">
                 <label className="block text-sm font-semibold text-slate-700 mb-3">Subject Scope</label>
                 <div className="relative">
                    <select 
                        value={subjectInput}
                        onChange={(e) => setSubjectInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-slate-900 focus:border-purple-500 focus:outline-none appearance-none font-medium"
                    >
                        <option value="Full Syllabus">Full Syllabus (All Subjects)</option>
                        {Object.values(Subject).map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-500">
                        <i className="fas fa-chevron-down"></i>
                    </div>
                 </div>
             </div>

             <button
                onClick={() => startQuiz(true)}
                disabled={isGenerating}
                className="w-full bg-slate-900 text-white hover:bg-slate-800 font-bold py-5 px-12 rounded-xl shadow-xl transition-all transform hover:scale-[1.01] flex items-center justify-center gap-3"
            >
                {isGenerating ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-file-signature"></i>}
                {isGenerating ? 'Preparing Exam Paper...' : 'Begin Examination'}
            </button>
        </div>
        
        {error && (
            <div className="text-center mt-4 text-red-500 text-sm font-medium">{error}</div>
        )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="border-b border-indigo-100 bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
                onClick={onBack}
                className="text-slate-400 hover:text-purple-600 transition-colors"
                title="Back to Home"
            >
                <i className="fas fa-arrow-left text-lg"></i>
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                {section === AppSection.VIT ? 'VIT Prep' : 'GATE Prep'}
            </h1>
          </div>
          
          <nav className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200">
            <button onClick={() => handleTabChange(DashboardTab.PRACTICE)} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === DashboardTab.PRACTICE ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}>Practice</button>
            <button onClick={() => handleTabChange(DashboardTab.MOCK_TEST)} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === DashboardTab.MOCK_TEST ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}>Mock Test</button>
            <button onClick={() => handleTabChange(DashboardTab.HISTORY)} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === DashboardTab.HISTORY ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}>History</button>
          </nav>

          <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-md border-2 border-white">JS</div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 relative">
         <div className="max-w-7xl mx-auto">
            {activeTab === DashboardTab.PRACTICE && renderPracticeForm()}
            {activeTab === DashboardTab.MOCK_TEST && renderMockTest()}
            {activeTab === DashboardTab.HISTORY && renderHistory()}
         </div>
      </main>
    </div>
  );
};

export default Dashboard;

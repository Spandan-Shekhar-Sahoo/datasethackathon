
import React, { useEffect, useState } from 'react';
import { AppSection, QuizSession } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import * as DB from '../services/databaseService';

interface HomePageProps {
  onNavigate: (section: AppSection) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [history, setHistory] = useState<QuizSession[]>([]);
  const [weakAreas, setWeakAreas] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    // Fetch from new Database Service
    const sessions = DB.getSessions();
    setHistory(sessions);
    
    const user = DB.getUser();
    setUserProfile(user);

    const weak = DB.getWeakestTopics(4);
    setWeakAreas(weak);
  }, []);

  // Stats Calculation
  const totalXP = userProfile?.totalXP || 0;
  const completedTests = userProfile?.sessionsCompleted || 0;
  const recentHistory = history.slice(0, 4);

  // Chart Data based on BKT Mastery Probabilities
  const analytics = DB.getAnalytics();
  const masteryValues = Object.values(analytics).map(a => a.masteryProbability);
  
  const proficiencyData = [
    { name: 'Mastered (>80%)', value: masteryValues.filter(v => v > 0.8).length, color: '#22c55e' }, 
    { name: 'Learning (40-80%)', value: masteryValues.filter(v => v > 0.4 && v <= 0.8).length, color: '#eab308' }, 
    { name: 'Novice (<40%)', value: masteryValues.filter(v => v <= 0.4).length, color: '#ef4444' } 
  ];

  const finalPieData = proficiencyData.every(d => d.value === 0) 
    ? [{ name: 'No Data', value: 1, color: '#e2e8f0' }] 
    : proficiencyData;

  const barData = history.slice(0, 7).reverse().map(h => ({
    name: h.subject.length > 15 ? h.subject.substring(0, 12) + '...' : h.subject,
    score: Math.round((h.score / h.totalMarks) * 100),
    date: new Date(h.date).toLocaleDateString()
  }));

  return (
    <div className="min-h-screen bg-slate-50 overflow-y-auto p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                    Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">{userProfile?.name || 'Student'}</span>
                </h1>
                <p className="text-slate-500 mt-1">Here is your AI-driven learning overview.</p>
            </div>
            <div className="flex gap-4">
                <div className="bg-white px-6 py-3 rounded-2xl border border-indigo-50 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                        <i className="fas fa-bolt"></i>
                    </div>
                    <div>
                        <div className="text-xl font-bold text-slate-800">{totalXP}</div>
                        <div className="text-xs text-slate-400 font-bold uppercase">Total XP</div>
                    </div>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border border-indigo-50 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        <i className="fas fa-check"></i>
                    </div>
                    <div>
                        <div className="text-xl font-bold text-slate-800">{completedTests}</div>
                        <div className="text-xs text-slate-400 font-bold uppercase">Tests Taken</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Action Cards (Navigation) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button 
                onClick={() => onNavigate(AppSection.VIT)}
                className="group relative bg-white border border-slate-200 hover:border-purple-400 rounded-3xl p-6 text-left transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <i className="fas fa-university text-8xl text-purple-600"></i>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                     <i className="fas fa-university"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">VIT Preparation</h3>
                <p className="text-sm text-slate-500">Practice module-wise questions for CAT1, CAT2, and FAT exams.</p>
                <div className="mt-4 text-purple-600 font-bold text-sm flex items-center gap-2">
                    Enter Section <i className="fas fa-arrow-right"></i>
                </div>
            </button>

            <button 
                onClick={() => onNavigate(AppSection.GATE)}
                className="group relative bg-white border border-slate-200 hover:border-indigo-400 rounded-3xl p-6 text-left transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden"
            >
                 <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <i className="fas fa-cogs text-8xl text-indigo-600"></i>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                     <i className="fas fa-cogs"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">GATE Prep</h3>
                <p className="text-sm text-slate-500">Advanced difficulty conceptual questions and NAT problems.</p>
                 <div className="mt-4 text-indigo-600 font-bold text-sm flex items-center gap-2">
                    Enter Section <i className="fas fa-arrow-right"></i>
                </div>
            </button>

            <button 
                onClick={() => onNavigate(AppSection.GENERAL)}
                className="group relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-left transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden"
            >
                 <div className="absolute top-0 right-0 p-6 opacity-10">
                    <i className="fas fa-robot text-8xl text-white"></i>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center text-2xl mb-4 backdrop-blur-sm">
                     <i className="fas fa-robot"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">AI Tutor</h3>
                <p className="text-sm text-slate-300">Interact with the teaching assistant to clear doubts.</p>
                 <div className="mt-4 text-white font-bold text-sm flex items-center gap-2">
                    Start Chat <i className="fas fa-arrow-right"></i>
                </div>
            </button>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Charts */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl border border-indigo-50 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <i className="fas fa-chart-bar text-indigo-500"></i> Data Insights
                    </h3>
                    <div className="h-64 w-full">
                        {history.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                    <ReTooltip 
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                        cursor={{fill: '#f8fafc'}}
                                    />
                                    <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} name="Skill Score %" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <i className="fas fa-chart-line text-4xl mb-2 opacity-20"></i>
                                <p>Complete a session to generate learning curves</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl border border-indigo-50 p-6 shadow-sm flex items-center justify-between relative overflow-hidden">
                        <div className="z-10">
                            <h3 className="font-bold text-slate-800 mb-1">Proficiency</h3>
                            <p className="text-xs text-slate-500 mb-4">Topic Mastery Distribution</p>
                            <div className="flex flex-col gap-1 text-xs">
                                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Mastered</span>
                                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Learning</span>
                                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> Novice</span>
                            </div>
                        </div>
                        <div className="h-32 w-32 relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={finalPieData} 
                                        innerRadius={25} 
                                        outerRadius={40} 
                                        dataKey="value"
                                        stroke="none"
                                        paddingAngle={5}
                                    >
                                        {finalPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                         <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-lg mb-1"><i className="fas fa-lightbulb text-yellow-300 mr-2"></i>AI Insight</h3>
                                <p className="text-indigo-100 text-sm leading-relaxed mt-2">
                                    {weakAreas.length > 0 
                                      ? `Your mastery in ${weakAreas[0].topic} is low (${Math.round(weakAreas[0].masteryProbability * 100)}%). Recommend specialized practice.`
                                      : "Start your first Mock Test to get personalized AI insights tailored to your weak spots."}
                                </p>
                            </div>
                            <button onClick={() => onNavigate(AppSection.GENERAL)} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-bold py-2 px-4 rounded-lg self-start mt-4 transition-colors">
                                Ask Tutor Now
                            </button>
                        </div>
                        <div className="absolute -bottom-6 -right-6 text-9xl opacity-10 rotate-12">
                            <i className="fas fa-brain"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Col: Recent Activity & Weakest Links */}
            <div className="space-y-6">
                
                {/* Weakest Areas */}
                <div className="bg-white rounded-3xl border border-indigo-50 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <i className="fas fa-exclamation-triangle text-orange-500"></i> Focus Areas
                    </h3>
                    <div className="space-y-3">
                        {weakAreas.length > 0 ? weakAreas.map((area, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">{area.topic}</h4>
                                    <p className="text-[10px] text-slate-500">Probability: {area.masteryProbability.toFixed(2)}</p>
                                </div>
                                <div className="text-orange-600 font-bold text-sm">{Math.round(area.masteryProbability * 100)}%</div>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-400 italic">No weak areas identified yet.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-indigo-50 p-6 shadow-sm h-full">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                        {recentHistory.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <p className="text-sm">No activity yet.</p>
                            </div>
                        ) : (
                            recentHistory.map((sess) => (
                                <div key={sess.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-md cursor-default">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                                            sess.type === 'MOCK' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'
                                        }`}>
                                            {sess.type}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {new Date(sess.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">{sess.subject}</h4>
                                    <p className="text-xs text-slate-500 mb-3 line-clamp-1">{sess.topic}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-bold text-slate-700">
                                            Score: <span className={sess.score/sess.totalMarks > 0.7 ? 'text-green-600' : 'text-orange-500'}>{sess.score}</span> / {sess.totalMarks}
                                        </div>
                                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${sess.score/sess.totalMarks > 0.7 ? 'bg-green-500' : 'bg-orange-500'}`} 
                                                style={{ width: `${(sess.score/sess.totalMarks)*100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;

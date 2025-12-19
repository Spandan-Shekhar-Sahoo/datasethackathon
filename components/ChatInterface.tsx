
import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { generateChatResponse } from '../services/geminiService';

interface ChatInterfaceProps {
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm your AI Teaching Assistant. I can help you prepare for VIT exams, GATE, or general computer science concepts. What topic would you like to learn today?",
      timestamp: new Date(),
      suggestedQuestions: ["Explain Operating System Scheduling", "How to prepare for GATE?", "VIT Exam Pattern"]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string = inputText) => {
    if (!text.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setIsLoading(true);

    const response = await generateChatResponse(messages, text);

    const newAiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: response.text,
      timestamp: new Date(),
      suggestedQuestions: response.suggestedQuestions
    };

    setMessages(prev => [...prev, newAiMsg]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden border border-indigo-50 shadow-2xl">
      <div className="p-4 border-b border-indigo-50 bg-white/80 backdrop-blur-md flex items-center gap-3">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-purple-600 transition-colors"
          title="Back to Home"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center shadow-md">
          <i className="fas fa-robot text-white text-lg"></i>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">AI Teaching Assistant</h2>
          <p className="text-xs text-green-500 font-medium flex items-center gap-1">
             <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Always online
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-6 py-4 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-none'
                  : 'bg-white text-slate-700 rounded-bl-none border border-indigo-50'
              }`}
            >
              <div className="prose prose-sm max-w-none">
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} className={`mb-1 last:mb-0 ${msg.role === 'user' ? 'text-purple-50' : 'text-slate-700'}`}>{line}</p>
                ))}
              </div>
              <span className={`text-[10px] block text-right mt-2 ${msg.role === 'user' ? 'text-purple-200' : 'text-slate-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            {/* Suggested Follow-up Chips (Only for last model message) */}
            {msg.role === 'model' && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && msg.id === messages[messages.length - 1].id && (
                <div className="mt-3 flex flex-wrap gap-2 max-w-[80%] animate-fade-in">
                    {msg.suggestedQuestions.map((q, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSendMessage(q)}
                            disabled={isLoading}
                            className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full hover:bg-indigo-100 hover:border-indigo-300 transition-colors flex items-center gap-1"
                        >
                            <span>{q}</span>
                            <i className="fas fa-chevron-right text-[10px]"></i>
                        </button>
                    ))}
                </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-none px-6 py-4 border border-indigo-50 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-indigo-50 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask a doubt or request a topic explanation..."
            className="flex-1 bg-slate-50 border border-indigo-100 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:bg-white transition-all placeholder-slate-400 shadow-inner"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputText.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-xl px-6 transition-colors duration-200 shadow-lg shadow-purple-200"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

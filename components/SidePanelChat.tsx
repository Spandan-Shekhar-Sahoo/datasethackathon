
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { generateChatResponse } from '../services/geminiService';

interface SidePanelChatProps {
  currentContext?: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SidePanelChat: React.FC<SidePanelChatProps> = ({ currentContext, isOpen, setIsOpen }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hi! I'm your study companion. I can see what you're working on. Ask me anything!",
      timestamp: new Date(),
      suggestedQuestions: ["Help me solve this", "Explain this concept", "Show examples"]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

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

    const response = await generateChatResponse(messages, text, currentContext);

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
    <div 
        className={`fixed right-0 top-16 bottom-0 z-40 bg-white border-l border-indigo-100 transition-all duration-300 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.05)]
        ${isOpen ? 'w-96 translate-x-0' : 'w-12 translate-x-0'}
        `}
    >
      {/* Toggle Handle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -left-3 top-1/2 transform -translate-y-1/2 bg-white border border-indigo-100 text-indigo-500 p-1.5 rounded-full shadow-md hover:text-indigo-700 z-50 flex items-center justify-center transition-colors"
      >
        <i className={`fas fa-chevron-${isOpen ? 'right' : 'left'}`}></i>
      </button>

      {/* Header */}
      <div className={`p-4 border-b border-indigo-50 bg-white/80 backdrop-blur-sm flex items-center justify-between ${!isOpen && 'hidden'}`}>
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
                <i className="fas fa-sparkles text-white text-xs"></i>
            </div>
            <div>
                <h3 className="font-bold text-slate-800 text-sm">AI Tutor</h3>
                <span className="text-[10px] text-green-500 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
                </span>
            </div>
        </div>
        <button onClick={() => setMessages([])} className="text-slate-400 hover:text-red-500 text-xs transition-colors" title="Clear Chat">
            <i className="fas fa-trash"></i>
        </button>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 ${!isOpen && 'hidden'}`}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white text-slate-700 border border-indigo-50 rounded-bl-none'
            }`}>
               <div className="prose prose-sm max-w-none">
                {msg.text.split('\n').map((line, i) => <p key={i} className={`mb-1 last:mb-0 ${msg.role === 'user' ? 'text-indigo-50' : 'text-slate-700'}`}>{line}</p>)}
               </div>
            </div>

            {/* Chips for Side Panel */}
             {msg.role === 'model' && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && msg.id === messages[messages.length - 1].id && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%] justify-start animate-fade-in">
                    {msg.suggestedQuestions.map((q, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSendMessage(q)}
                            disabled={isLoading}
                            className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-full hover:bg-indigo-100 transition-colors text-left"
                        >
                           {q}
                        </button>
                    ))}
                </div>
            )}
          </div>
        ))}
         {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-3 border border-indigo-50 shadow-sm">
               <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`p-4 border-t border-indigo-50 bg-white ${!isOpen && 'hidden'}`}>
        <div className="relative">
             <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask relevant questions..."
                className="w-full bg-slate-50 border border-indigo-100 text-slate-800 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner placeholder-slate-400"
            />
            <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-indigo-500 hover:text-indigo-700 disabled:opacity-50 p-2"
            >
                <i className="fas fa-paper-plane"></i>
            </button>
        </div>
      </div>
      
      {/* Closed State Vertical Text */}
      {!isOpen && (
        <div className="flex-1 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setIsOpen(true)}>
            <div className="transform -rotate-90 whitespace-nowrap text-indigo-400 font-bold tracking-wider flex items-center gap-2">
                <i className="fas fa-comment-dots"></i> AI ASSISTANT
            </div>
        </div>
      )}
    </div>
  );
};

export default SidePanelChat;

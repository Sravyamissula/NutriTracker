import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { geminiService } from '../services/geminiService';
import { ChatMessage, GeminiChatInstance, GroundingChunk } from '../types';
import { ICONS, GEMINI_CHATBOT_MODEL } from '../constants';
import LoadingSpinner from './common/LoadingSpinner';
import { useTranslation } from 'react-i18next';

const ChatbotTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  
  const [chatSession, setChatSession] = useState<GeminiChatInstance | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getLocalStorageKey = useCallback((baseKey: string) => {
    return currentUser ? `${baseKey}_${currentUser.uid}` : null;
  }, [currentUser]);

  // Load messages from localStorage on user change
  useEffect(() => {
    if (currentUser) {
      const chatHistoryKey = getLocalStorageKey('chatHistory');
      if (chatHistoryKey) {
        const savedMessages = localStorage.getItem(chatHistoryKey);
        setMessages(savedMessages ? JSON.parse(savedMessages) : []);
      }
    } else {
      setMessages([]); // Clear messages if no user
    }
  }, [currentUser, getLocalStorageKey]);

  // Save messages to localStorage
  useEffect(() => {
    if (currentUser && messages.length > 0) {
      const chatHistoryKey = getLocalStorageKey('chatHistory');
      if (chatHistoryKey) {
        localStorage.setItem(chatHistoryKey, JSON.stringify(messages));
      }
    } else if (currentUser && messages.length === 0) { // Clear storage if messages are empty for the user
        const chatHistoryKey = getLocalStorageKey('chatHistory');
        if (chatHistoryKey) localStorage.removeItem(chatHistoryKey);
    }
  }, [messages, currentUser, getLocalStorageKey]);

  // Initialize or re-initialize chat session on language or user change
  useEffect(() => {
    setError(null);
    const initializeChat = async () => {
      if (currentUser) { // Only initialize if user is logged in
        try {
          const session = await geminiService.createChatSession(i18n.language, currentUser);
          setChatSession(session);
        } catch (err) {
          console.error("Error initializing chat session:", err);
          setError(t('chatbot.errorInitSession'));
        }
      } else {
        setChatSession(null); // Clear session if no user
      }
    };
    initializeChat();
  }, [i18n.language, currentUser, t]); // Re-initialize if language or user changes

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !chatSession || isLoadingResponse) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      text: currentMessage.trim(),
      sender: 'user',
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoadingResponse(true);
    setError(null);

    try {
      const response = await chatSession.sendMessage(userMessage.text);
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        text: response.text,
        sender: 'ai',
        timestamp: Date.now(),
        sources: response.sources,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error("Error sending/receiving chat message:", err);
      setError(t('chatbot.errorSendMessage'));
      // Optionally add an error message to chat
      const errorAiMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai-error`,
        text: t('chatbot.errorResponse'),
        sender: 'ai',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorAiMessage]);
    } finally {
      setIsLoadingResponse(false);
    }
  };
  
  const handleClearChat = () => {
      if (confirm(t('chatbot.confirmClearChat'))) {
        setMessages([]);
        // Optionally, re-initialize chat session to clear history on Gemini's side if `createChatSession` resets it.
        // For now, this only clears local display.
      }
  };


  if (isAuthLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><LoadingSpinner /></div>;
  }

  if (!currentUser) {
    return (
        <div className="p-6 bg-white shadow-card rounded-xl text-center">
            <p className="text-lg text-slate-700">{t('chatbot.pleaseLogin')}</p>
        </div>
    );
  }


  return (
    <div className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-150px)] bg-white shadow-card rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-dark flex items-center space-x-2">
          {React.cloneElement(ICONS.chatBubbleLeftRight, { className: "w-7 h-7 text-primary" })}
          <span>{t('tabChatbot')}</span>
        </h2>
        <button 
            onClick={handleClearChat}
            className="p-1.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors flex items-center space-x-1"
            title={t('chatbot.clearChatHistory')}
            disabled={messages.length === 0}
        >
           {React.cloneElement(ICONS.trash, { className: "w-4 h-4"})}
           <span>{t('chatbot.clearChat')}</span>
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-xl shadow-sm ${msg.sender === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}>
              <p className="text-sm whitespace-pre-line break-words">{msg.text}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-1.5 border-t border-slate-300 opacity-80">
                  <p className="text-xs font-semibold mb-0.5">{t('chatbot.sources')}:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {msg.sources.map((source, index) => source.web && (
                      <li key={`${msg.id}-source-${index}`} className="text-xs">
                        <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-1 decoration-dotted">
                          {source.web.title || source.web.uri}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className={`text-xs mt-1.5 ${msg.sender === 'user' ? 'text-green-200 text-right' : 'text-slate-500 text-left'}`}>
                {new Date(msg.timestamp).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {error && <p className="p-2 text-center text-sm text-red-600 bg-red-100 border-t border-red-200">{error}</p>}

      <div className="p-4 border-t border-slate-200 bg-white">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center space-x-2">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder={t('chatbot.inputPlaceholder')}
            className="flex-grow p-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-focus focus:border-primary-focus sm:text-sm"
            disabled={!chatSession || isLoadingResponse}
            aria-label={t('chatbot.inputPlaceholder')}
          />
          <button type="submit" disabled={!chatSession || isLoadingResponse || !currentMessage.trim()} className="px-5 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-1 transition-colors disabled:opacity-60 flex items-center justify-center">
            {isLoadingResponse ? <LoadingSpinner size="h-5 w-5" /> : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M3.105 3.105a.5.5 0 01.815-.086L15.44 9.353a.5.5 0 010 .294L3.92 15.98a.5.5 0 01-.815-.086L1.905 3.905a.5.5 0 01.2-.815L3.105 3.105z" />
              </svg>
            )}
            <span className="sr-only">{t('chatbot.sendButton')}</span>
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-2 text-center">{t('chatbot.disclaimer')}</p>
      </div>
    </div>
  );
};

export default ChatbotTab;

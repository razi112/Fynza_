import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Menu, SendHorizontal, StopCircle, Compass, Code, Lightbulb, PenTool, Plus, 
  Paperclip, Image as ImageIcon, Telescope, ShoppingBag, MoreHorizontal, 
  BookOpen, Globe, Music, ChevronRight, X
} from 'lucide-react';
import { geminiService } from './services/geminiService';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { SettingsModal } from './components/SettingsModal';
import { ChatSession, Message, LoadingState, AppSettings, DEFAULT_SETTINGS } from './types';

// Mock Suggestions
const SUGGESTIONS = [
  { icon: Compass, text: "Plan a trip to Kyoto", sub: "for 3 days in spring" },
  { icon: Code, text: "Debug this Python script", sub: "finding memory leaks" },
  { icon: Lightbulb, text: "Brainstorm marketing ideas", sub: "for a coffee shop" },
  { icon: PenTool, text: "Write a thank you note", sub: "for a job interview" },
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  // App Settings State
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Attachment Menu State
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isMoreMenuHovered, setIsMoreMenuHovered] = useState(false);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  // Click outside to close attachment menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setIsAttachMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingState]);

  const handleLogin = (email: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
    handleNewChat();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    setSessions([]);
    setMessages([]);
    setCurrentSessionId(null);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    // Apply new settings to the service immediately, preserving current context
    geminiService.updateSettings(newSettings, messages);
  };

  const handleNewChat = () => {
    const newSessionId = Date.now().toString();
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Chat',
      messages: [],
      updatedAt: Date.now(),
    };
    
    // Only save to sessions list if NOT in incognito mode
    if (!settings.incognito) {
      setSessions(prev => [newSession, ...prev]);
    }
    
    setCurrentSessionId(newSessionId);
    setMessages([]);
    setInputValue('');
    
    // Initialize Gemini with current settings
    geminiService.startNewChat(settings);
    setSidebarOpen(false);
  };

  const handleSelectSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      setMessages(session.messages);
      // Restore context for this session
      geminiService.startNewChat(settings, session.messages);
    }
    setSidebarOpen(false);
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    
    // If we deleted the current session, reset to an empty state
    if (currentSessionId === id) {
      setCurrentSessionId(null);
      setMessages([]);
      setInputValue('');
      geminiService.startNewChat(settings);
    }
  };

  const updateCurrentSession = useCallback((updatedMessages: Message[]) => {
    if (!currentSessionId || settings.incognito) return;
    
    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        // Generate a title if it's the first prompt
        let title = session.title;
        if (session.messages.length === 0 && updatedMessages.length > 0) {
            const firstMsg = updatedMessages[0];
            if (firstMsg.role === 'user') {
                title = firstMsg.text.slice(0, 30) + (firstMsg.text.length > 30 ? '...' : '');
            }
        }
        return { ...session, messages: updatedMessages, title, updatedAt: Date.now() };
      }
      return session;
    }));
  }, [currentSessionId, settings.incognito]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loadingState !== LoadingState.IDLE) return;

    const userText = inputValue.trim();
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    updateCurrentSession(newMessages);
    setLoadingState(LoadingState.STREAMING);

    // Placeholder for AI response
    const botMessageId = (Date.now() + 1).toString();
    const botMessage: Message = {
      id: botMessageId,
      role: 'model',
      text: '', // Start empty for streaming
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, botMessage]);

    try {
      let accumulatedText = '';
      const stream = geminiService.sendMessageStream(userText);

      for await (const chunk of stream) {
        const parts = chunk.split(/(\s+)/);
        
        for (const part of parts) {
            if (part.length === 0) continue;
            
            accumulatedText += part;
            
            setMessages(prev => prev.map(msg => 
              msg.id === botMessageId 
                ? { ...msg, text: accumulatedText }
                : msg
            ));
            
            await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      updateCurrentSession([...newMessages, { ...botMessage, text: accumulatedText }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, text: "Sorry, I encountered an error processing your request.", isError: true }
          : msg
      ));
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- Menu Option Handlers ---
  const handleMenuOption = (action: string) => {
    setIsAttachMenuOpen(false);
    
    // Helper to focus input after selection
    const focusInput = () => setTimeout(() => textareaRef.current?.focus(), 100);

    switch (action) {
        case 'upload':
            fileInputRef.current?.click();
            break;
        case 'image':
            setInputValue(prev => prev + "Generate an image of ");
            focusInput();
            break;
        case 'thinking':
            const newThinkingState = !settings.enableThinking;
            const newSettings = { ...settings, enableThinking: newThinkingState };
            setSettings(newSettings);
            geminiService.updateSettings(newSettings, messages);
            setInputValue(prev => prev + `[System: Thinking Mode ${newThinkingState ? 'Enabled' : 'Disabled'}] `);
            focusInput();
            break;
        case 'deep_research':
            setInputValue(prev => prev + "Conduct deep research on: ");
            focusInput();
            break;
        case 'shopping':
            setInputValue(prev => prev + "Find the best price for: ");
            focusInput();
            break;
        case 'study':
            setInputValue(prev => prev + "Create a study plan for: ");
            focusInput();
            break;
        case 'web_search':
            setInputValue(prev => prev + "Search the web for: ");
            focusInput();
            break;
        case 'canvas':
            alert("Canvas feature is coming soon!");
            break;
        case 'spotify':
            alert("Spotify integration is coming soon!");
            break;
        default:
            break;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const fileName = e.target.files[0].name;
        setInputValue(prev => prev + `[Attached: ${fileName}] `);
        // Reset file input so same file can be selected again if needed
        e.target.value = ''; 
        if(textareaRef.current) textareaRef.current.focus();
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Dynamic font size class
  const fontSizeClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  }[settings.fontSize];

  return (
    <div className={`flex h-screen bg-[#0f1115] text-gray-100 overflow-hidden ${fontSizeClass}`}>
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
        userEmail={userEmail}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 md:hidden absolute top-0 left-0 right-0 z-30 bg-[#0f1115]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 hover:bg-gray-800 rounded-lg text-gray-400"
            >
                <Menu size={20} />
            </button>
            <span className="font-semibold text-gray-200">Gemini</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
              {userEmail[0].toUpperCase()}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto pt-16 md:pt-0 scroll-smooth">
          <div className="max-w-3xl mx-auto px-4 pb-32 min-h-full flex flex-col">
            
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 mt-20 md:mt-0">
                <div className="mb-8">
                   <h2 className="text-4xl font-semibold bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 text-transparent bg-clip-text mb-2">
                       Hello, {userEmail.split('@')[0]}
                   </h2>
                   <h3 className="text-4xl font-semibold text-gray-600">How can I help you today?</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    {SUGGESTIONS.map((s, idx) => (
                        <button 
                            key={idx}
                            onClick={() => {
                                setInputValue(s.text + " " + s.sub);
                                if(textareaRef.current) textareaRef.current.focus();
                            }}
                            className="bg-[#1e1f24] hover:bg-[#2b2d35] border border-gray-800 p-4 rounded-xl text-left transition-all group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-gray-200 font-medium">{s.text}</span>
                                <s.icon size={20} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                            </div>
                            <span className="text-sm text-gray-500">{s.sub}</span>
                        </button>
                    ))}
                </div>
              </div>
            ) : (
              <div className="pt-6">
                {messages.map((msg, index) => (
                  <ChatMessage 
                    key={msg.id} 
                    message={msg} 
                    isStreaming={loadingState === LoadingState.STREAMING && index === messages.length - 1 && msg.role === 'model'}
                    codeBlockTheme={settings.codeBlockTheme}
                    showLineNumbers={settings.showCodeLineNumbers}
                  />
                ))}
                
                {/* Visual indicator for thinking BEFORE response starts */}
                {loadingState === LoadingState.STREAMING && messages.length > 0 && messages[messages.length - 1].role === 'model' && messages[messages.length - 1].text === '' && (
                     <div className="flex w-full justify-start mb-6 px-4 md:px-0 ml-[52px]">
                         <span className="text-sm text-gray-500 animate-pulse">Thinking...</span>
                     </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0f1115] via-[#0f1115] to-transparent pt-10 pb-6 px-4">
          <div className="max-w-3xl mx-auto relative">
             <div className="bg-[#1e1f24] border border-gray-700 rounded-[24px] shadow-lg flex flex-col transition-colors focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-500/30">
                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${settings.model.replace('gemini-', '')}...`}
                    rows={1}
                    className="w-full bg-transparent text-gray-100 placeholder-gray-500 px-6 py-4 rounded-[24px] focus:outline-none resize-none max-h-[200px]"
                />
                
                <div className="flex justify-between items-center px-4 pb-3 pt-1">
                    <div className="flex gap-2 relative" ref={attachMenuRef}>
                        <button 
                            onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                            className={`p-2 rounded-full transition-colors ${isAttachMenuOpen ? 'text-gray-200 bg-[#2b2d35]' : 'text-gray-400 hover:text-gray-200 hover:bg-[#2b2d35]'}`} 
                            title="Add attachment"
                        >
                            {isAttachMenuOpen ? <X size={20} /> : <Plus size={20} />}
                        </button>

                        {/* Attachment Menu */}
                        {isAttachMenuOpen && (
                          <div className="absolute bottom-full left-0 mb-3 w-64 bg-[#1e1f20] border border-gray-700/50 rounded-2xl shadow-2xl p-1.5 z-50">
                             
                             <button 
                                onClick={() => handleMenuOption('upload')}
                                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#2b2d35] rounded-xl text-sm text-gray-200 transition-colors"
                             >
                                <Paperclip size={18} />
                                <span>Add photos & files</span>
                             </button>

                             <button 
                                onClick={() => handleMenuOption('image')}
                                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#2b2d35] rounded-xl text-sm text-gray-200 transition-colors"
                             >
                                <ImageIcon size={18} />
                                <span>Create image</span>
                             </button>

                             <button 
                                onClick={() => handleMenuOption('thinking')}
                                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#2b2d35] rounded-xl text-sm text-gray-200 transition-colors"
                             >
                                <Lightbulb size={18} className={settings.enableThinking ? "text-yellow-400" : ""} />
                                <span>Thinking</span>
                             </button>
                             
                             <button 
                                onClick={() => handleMenuOption('deep_research')}
                                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#2b2d35] rounded-xl text-sm text-gray-200 transition-colors"
                             >
                                <Telescope size={18} />
                                <span>Deep research</span>
                             </button>

                             <button 
                                onClick={() => handleMenuOption('shopping')}
                                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#2b2d35] rounded-xl text-sm text-gray-200 transition-colors"
                             >
                                <ShoppingBag size={18} />
                                <span>Shopping research</span>
                             </button>

                             {/* More Menu Item */}
                             <div 
                                className="relative"
                                onMouseEnter={() => setIsMoreMenuHovered(true)}
                                onMouseLeave={() => setIsMoreMenuHovered(false)}
                             >
                                <button className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-[#2b2d35] rounded-xl text-sm text-gray-200 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <MoreHorizontal size={18} />
                                        <span>More</span>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-500" />
                                </button>
                                
                                {/* Sub Menu */}
                                {isMoreMenuHovered && (
                                    <div className="absolute bottom-0 left-full ml-2 w-56 bg-[#1e1f20] border border-gray-700/50 rounded-2xl shadow-2xl p-1.5 z-50">
                                         <button 
                                            onClick={() => handleMenuOption('study')}
                                            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#2b2d35] rounded-xl text-sm text-gray-200 transition-colors"
                                         >
                                            <BookOpen size={18} />
                                            <span>Study and learn</span>
                                         </button>
                                         
                                         <button 
                                            onClick={() => handleMenuOption('web_search')}
                                            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#2b2d35] rounded-xl text-sm text-gray-200 transition-colors"
                                         >
                                            <Globe size={18} />
                                            <span>Web search</span>
                                         </button>

                                         <button 
                                            onClick={() => handleMenuOption('canvas')}
                                            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#2b2d35] rounded-xl text-sm text-gray-200 transition-colors"
                                         >
                                            <PenTool size={18} />
                                            <span>Canvas</span>
                                         </button>

                                         <button 
                                            onClick={() => handleMenuOption('spotify')}
                                            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#2b2d35] rounded-xl text-sm text-gray-200 transition-colors"
                                         >
                                            <Music size={18} className="text-green-500" />
                                            <span>Spotify</span>
                                         </button>
                                    </div>
                                )}
                             </div>

                          </div>
                        )}
                    </div>
                    
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || loadingState !== LoadingState.IDLE}
                        className={`
                             p-2 rounded-full transition-all
                             ${inputValue.trim() && loadingState === LoadingState.IDLE
                                ? 'bg-white text-black hover:bg-gray-200' 
                                : 'bg-[#2b2d35] text-gray-500 cursor-not-allowed'
                             }
                        `}
                    >
                        {loadingState === LoadingState.STREAMING ? (
                            <StopCircle size={20} />
                        ) : (
                            <SendHorizontal size={20} />
                        )}
                    </button>
                </div>
             </div>
             <div className="text-center mt-3">
                 <p className="text-[10px] text-gray-500">
                     {settings.incognito ? "Incognito Mode • " : ""}Gemini may display inaccurate info, including about people, so double-check its responses.
                 </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
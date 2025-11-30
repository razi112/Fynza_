import React, { useState } from 'react';
import { Plus, MessageSquare, Settings, LogOut, X, Sparkles, Trash2 } from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  userEmail: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onLogout,
  onOpenSettings,
  userEmail,
}) => {
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const confirmDelete = () => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete);
      setSessionToDelete(null);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1e1f20] w-full max-w-sm rounded-2xl border border-gray-800 shadow-2xl p-6 transform scale-100 transition-all">
            <h3 className="text-lg font-medium text-white mb-2">Delete chat?</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              This will permanently delete this chat history. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 h-full w-[280px] bg-[#13151a] border-r border-gray-800 z-50
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static
      `}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-100 font-semibold text-lg tracking-tight">
                <Sparkles size={20} className="text-blue-500" />
                <span>Fynza</span>
            </div>
            <button 
                onClick={onClose}
                className="md:hidden p-2 hover:bg-gray-800 rounded-full text-gray-400"
            >
                <X size={20} />
            </button>
        </div>

        {/* New Chat Button */}
        <div className="px-4 mb-4">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-[#1e2026] hover:bg-[#2b2d35] 
                     text-gray-200 rounded-full transition-colors duration-200 border border-gray-700/50"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">New chat</span>
          </button>
        </div>

        {/* Recent Chats List */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <div className="text-xs font-semibold text-gray-500 px-4 mb-2 uppercase tracking-wider">Recent</div>
          {sessions.map((session) => (
            <div key={session.id} className="group relative mb-1 px-2">
              <button
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm text-left transition-colors pr-10
                  ${currentSessionId === session.id 
                    ? 'bg-[#2b2f3a] text-blue-100 font-medium' 
                    : 'text-gray-400 hover:bg-[#1e2026] hover:text-gray-200'
                  }
                `}
              >
                <MessageSquare size={16} className="flex-shrink-0" />
                <span className="truncate">{session.title}</span>
              </button>
              
              {/* Delete Button (visible on hover) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSessionToDelete(session.id);
                }}
                className={`
                  absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-md
                  text-gray-500 hover:text-red-400 hover:bg-[#2b2d35]
                  opacity-0 group-hover:opacity-100 transition-all duration-200
                  ${currentSessionId === session.id ? 'group-hover:bg-[#1e2026]' : ''}
                `}
                aria-label="Delete chat"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
              <div className="px-4 text-sm text-gray-600 italic">No recent history</div>
          )}
        </div>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-gray-800 bg-[#0f1115]">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
              {userEmail[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-200 truncate">{userEmail}</div>
              <div className="text-xs text-gray-500">Free Plan</div>
            </div>
          </div>
          
          <div className="flex gap-1">
             <button 
                onClick={() => {
                  onOpenSettings();
                  if (window.innerWidth < 768) onClose();
                }}
                className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-gray-800 rounded-lg text-gray-400 text-xs transition-colors"
             >
                 <Settings size={14} /> Settings
             </button>
             <button 
                onClick={onLogout}
                className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-red-900/20 hover:text-red-400 rounded-lg text-gray-400 text-xs transition-colors"
             >
                 <LogOut size={14} /> Log out
             </button>
          </div>
        </div>
      </div>
    </>
  );
};
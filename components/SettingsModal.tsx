import React, { useState } from 'react';
import { X, Cpu, User, Lock, Sliders, Zap, MessageSquare, Monitor, Shield, Save, RotateCcw, Moon, Sun } from 'lucide-react';
import { AppSettings, DEFAULT_SETTINGS, Personality } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

type Tab = 'general' | 'personality' | 'privacy' | 'advanced';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS);
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'general', label: 'AI Model', icon: Cpu },
    { id: 'personality', label: 'Personality', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'advanced', label: 'Developer', icon: Sliders },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1e1f24] w-full max-w-4xl h-[80vh] rounded-2xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#13151a]">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Sliders size={20} className="text-blue-500" />
            Settings
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-[#13151a] border-r border-gray-800 flex flex-col py-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors relative
                  ${activeTab === tab.id ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}
                `}
              >
                {activeTab === tab.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                )}
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-[#0f1115] p-8">
            
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-8">
                <section>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Zap size={18} className="text-yellow-500" /> Model Configuration
                  </h3>
                  
                  <div className="grid gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">AI Model</label>
                      <select 
                        value={localSettings.model}
                        onChange={(e) => updateSetting('model', e.target.value)}
                        className="w-full bg-[#1e1f24] border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                      >
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest)</option>
                        <option value="gemini-3-pro-preview">Gemini 3 Pro Preview (High Intelligence)</option>
                        <option value="gemini-2.0-flash-lite-preview-02-05">Gemini 2.0 Flash Lite (Cost Efficient)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-2">
                        Select the model architecture. Flash is optimized for speed, Pro for complex reasoning.
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-gray-400">Temperature (Creativity)</label>
                        <span className="text-sm text-blue-400">{localSettings.temperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={localSettings.temperature}
                        onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                        className="w-full accent-blue-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>Precise</span>
                        <span>Balanced</span>
                        <span>Creative</span>
                      </div>
                    </div>

                    <div className="bg-[#1e1f24] p-4 rounded-xl border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">Advanced Reasoning (Thinking)</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={localSettings.enableThinking}
                            onChange={(e) => updateSetting('enableThinking', e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">
                        Enables the model to "think" before responding, improving performance on math and logic tasks.
                      </p>
                      
                      {localSettings.enableThinking && (
                        <div>
                          <div className="flex justify-between mb-2">
                             <label className="text-xs font-medium text-gray-400">Thinking Budget (Tokens)</label>
                             <span className="text-xs text-blue-400">{localSettings.thinkingBudget}</span>
                          </div>
                          <input
                            type="range"
                            min="1024"
                            max="8192"
                            step="1024"
                            value={localSettings.thinkingBudget}
                            onChange={(e) => updateSetting('thinkingBudget', parseInt(e.target.value))}
                            className="w-full accent-purple-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Personality Settings */}
            {activeTab === 'personality' && (
              <div className="space-y-8">
                <section>
                   <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <MessageSquare size={18} className="text-purple-500" /> Persona & Behavior
                  </h3>
                  
                  <div className="grid gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-3">Personality Style</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {['professional', 'friendly', 'creative', 'humorous', 'strict'].map((p) => (
                          <button
                            key={p}
                            onClick={() => updateSetting('personality', p as Personality)}
                            className={`
                              px-4 py-3 rounded-xl border text-sm font-medium capitalize transition-all
                              ${localSettings.personality === p 
                                ? 'bg-blue-500/10 border-blue-500 text-blue-400' 
                                : 'bg-[#1e1f24] border-gray-700 text-gray-400 hover:border-gray-600'
                              }
                            `}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Custom System Instruction</label>
                      <textarea
                        value={localSettings.customSystemInstruction}
                        onChange={(e) => updateSetting('customSystemInstruction', e.target.value)}
                        placeholder="e.g., You are an expert Python developer who prefers functional programming patterns..."
                        className="w-full h-32 bg-[#1e1f24] border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        These instructions will be appended to the selected personality profile.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
               <div className="space-y-8">
                 <section>
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                      <Lock size={18} className="text-green-500" /> Privacy & Data
                    </h3>

                    <div className="space-y-4">
                       <div className="flex items-center justify-between p-4 bg-[#1e1f24] rounded-xl border border-gray-800">
                          <div>
                            <span className="block text-sm font-medium text-white">Incognito Mode</span>
                            <span className="text-xs text-gray-500">Chats will not be saved to your local history.</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={localSettings.incognito}
                              onChange={(e) => updateSetting('incognito', e.target.checked)}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                          </label>
                       </div>

                       <div className="p-4 bg-[#1e1f24] rounded-xl border border-gray-800 opacity-60 cursor-not-allowed">
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-sm font-medium text-white">Data Collection</span>
                             <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">Coming Soon</span>
                          </div>
                          <p className="text-xs text-gray-500">Allow us to improve the model using your chats.</p>
                       </div>
                    </div>
                 </section>
               </div>
            )}

            {/* Developer/Advanced Settings */}
            {activeTab === 'advanced' && (
              <div className="space-y-8">
                 <section>
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                      <Monitor size={18} className="text-red-500" /> Advanced Options
                    </h3>
                    
                    <div className="grid gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Code Block Theme</label>
                          <div className="grid grid-cols-2 gap-3">
                             <button
                               onClick={() => updateSetting('codeBlockTheme', 'dark')}
                               className={`
                                 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all
                                 ${localSettings.codeBlockTheme === 'dark' 
                                   ? 'bg-blue-500/10 border-blue-500 text-blue-400' 
                                   : 'bg-[#1e1f24] border-gray-700 text-gray-400 hover:border-gray-600'
                                 }
                               `}
                             >
                               <Moon size={16} /> Dark
                             </button>
                             <button
                               onClick={() => updateSetting('codeBlockTheme', 'light')}
                               className={`
                                 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all
                                 ${localSettings.codeBlockTheme === 'light' 
                                   ? 'bg-white text-black border-white' 
                                   : 'bg-[#1e1f24] border-gray-700 text-gray-400 hover:border-gray-600'
                                 }
                               `}
                             >
                               <Sun size={16} /> Light
                             </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Max Output Tokens</label>
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              min="100"
                              max="8192"
                              step="100"
                              value={localSettings.maxOutputTokens}
                              onChange={(e) => updateSetting('maxOutputTokens', parseInt(e.target.value))}
                              className="flex-1 accent-red-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <input 
                              type="number" 
                              value={localSettings.maxOutputTokens}
                              onChange={(e) => updateSetting('maxOutputTokens', parseInt(e.target.value))}
                              className="w-20 bg-[#1e1f24] border border-gray-700 rounded px-2 py-1 text-sm text-white text-center" 
                            />
                          </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">UI Font Size</label>
                            <div className="flex gap-2">
                               {['small', 'medium', 'large'].map(size => (
                                   <button
                                     key={size}
                                     onClick={() => updateSetting('fontSize', size as any)}
                                     className={`flex-1 py-2 rounded-lg border text-xs uppercase tracking-wide
                                        ${localSettings.fontSize === size 
                                            ? 'bg-white text-black border-white' 
                                            : 'bg-[#1e1f24] text-gray-400 border-gray-700'
                                        }
                                     `}
                                   >
                                       {size}
                                   </button>
                               ))}
                            </div>
                        </div>

                         <div className="flex items-center justify-between p-4 bg-[#1e1f24] rounded-xl border border-gray-800">
                          <div>
                            <span className="block text-sm font-medium text-white">Show Code Line Numbers</span>
                            <span className="text-xs text-gray-500">Display line numbers in code blocks.</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={localSettings.showCodeLineNumbers}
                              onChange={(e) => updateSetting('showCodeLineNumbers', e.target.checked)}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                       </div>
                    </div>
                 </section>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#13151a] border-t border-gray-800 flex justify-between items-center">
          <button 
             onClick={handleReset}
             className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
             <RotateCcw size={16} /> Reset Defaults
          </button>
          <div className="flex gap-3">
             <button 
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
             >
                Cancel
             </button>
             <button 
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl text-sm font-medium bg-white text-black hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-lg shadow-white/10"
             >
                <Save size={16} /> Save Changes
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LayoutDashboard,
  Terminal,
  Mail,
  FileText,
  CalendarCheck,
  Search,
  MessageSquare,
  Clock,
  BookOpen,
  BarChart2,
  Settings as SettingsIcon,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Bookmark,
  RefreshCw,
  Plus,
  Trash2,
  Send,
  Sparkles,
  Menu,
  X,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  Filter,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  ChevronRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

// Midnight Citrus Theme Tokens:
// Warm Ivory Workspace: #F6F5F0
// Dark Sidebar: #20251F
// Electric Citrus Accent: #C8F169
// Surface Cards: #FFFFFF
// Primary Ink: #161817
// Muted Text: #72756F
// Borders: #DFE1D8

const STORAGE_KEYS = {
  UNIFIED_HISTORY: 'workflow_unified_history',
  TASKS: 'workflow_tasks_data',
  SAVED_PLANS: 'workflow_saved_plans',
  CHAT: 'workflow_chat_messages',
  PROMPTS_BOOKMARKS: 'workflow_prompt_bookmarks',
  FOCUS_STATS: 'workflow_focus_time_seconds',
  SETTINGS: 'workflow_user_settings'
};


async function callGeminiService(prompt: string, systemInstruction = ''): Promise<string> {
  let attempt = 0;
  const maxAttempts = 3;
  let delay = 1000;

  while (attempt < maxAttempts) {
    try {
      const response = await fetch('../api/gemini.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction })
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const result = await response.json();
      const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) throw new Error('Empty response received from AI service.');
      return content;
    } catch (err) {
      attempt++;
      if (attempt >= maxAttempts) {
        throw new Error('The AI request could not be completed. Please verify connection and try again.');
      }
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
  throw new Error('The AI request could not be completed.');
}

function getLocalItem(key, defaultValue) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setLocalItem(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage write failed:', e);
  }
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#20251F] text-white px-4 py-2.5 rounded-lg shadow-lg border border-[#DFE1D8]/20 animate-fade-in text-xs font-medium">
      <CheckCircle2 className="w-4 h-4 text-[#C8F169]" />
      <span>{toast.message}</span>
      <button onClick={onClose} className="ml-2 text-white/50 hover:text-white">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function HumanReviewBadge({ className = '' }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F6F5F0] border border-[#DFE1D8] text-[11px] font-medium text-[#72756F] ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#D08A3C]" />
      <span>Human review required</span>
    </div>
  );
}

function CommandPalette({ isOpen, onClose, onNavigate, tasks, onRunCommand }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const actions = [
    { id: 'overview', title: 'Go to Overview / Dashboard', category: 'Navigation', icon: LayoutDashboard },
    { id: 'command-center', title: 'Open AI Command Center', category: 'Navigation', icon: Terminal },
    { id: 'email', title: 'Draft an Email', category: 'Work Tools', icon: Mail },
    { id: 'meetings', title: 'Summarize Meeting Notes', category: 'Work Tools', icon: FileText },
    { id: 'tasks', title: 'Plan Tasks & Schedule', category: 'Work Tools', icon: CalendarCheck },
    { id: 'research', title: 'Open Research Workspace', category: 'Work Tools', icon: Search },
    { id: 'chat', title: 'Chat with Assistant Copilot', category: 'AI Copilot', icon: MessageSquare },
    { id: 'history', title: 'Browse Unified AI History', category: 'Work Tools', icon: Clock },
    { id: 'prompts', title: 'Open Prompt Library', category: 'AI Copilot', icon: BookOpen },
    { id: 'productivity', title: 'View Productivity Insights', category: 'Insights', icon: BarChart2 },
    { id: 'focus', title: 'Enter Focus Mode (Pomodoro)', category: 'System', icon: Maximize2 },
    { id: 'settings', title: 'Open Settings & Privacy', category: 'System', icon: SettingsIcon },
  ];

  const filtered = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-[#20251F]/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-[#DFE1D8] overflow-hidden">
        <div className="flex items-center px-4 py-3 border-b border-[#DFE1D8]">
          <Search className="w-4 h-4 text-[#72756F] mr-2.5 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, tool, or workflow..."
            className="w-full text-sm text-[#161817] placeholder-[#72756F] bg-transparent focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && filtered[0]) {
                onNavigate(filtered[0].id);
                onClose();
              }
            }}
          />
          <kbd className="text-[10px] px-2 py-0.5 rounded bg-[#F6F5F0] border border-[#DFE1D8] text-[#72756F] font-mono">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#72756F]">No commands match your query.</div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs hover:bg-[#F6F5F0] group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-[#F6F5F0] group-hover:bg-[#EAF8C7] flex items-center justify-center text-[#20251F]">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#161817]">{item.title}</div>
                      <div className="text-[11px] text-[#72756F]">{item.category}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#72756F]/40 group-hover:text-[#161817]" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function FocusModeOverlay({ isOpen, onClose, tasks, onLogFocusTime }) {
  const [selectedTask, setSelectedTask] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            setIsRunning(false);
            onLogFocusTime(25 * 60);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft, onLogFocusTime]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = ((25 * 60 - secondsLeft) / (25 * 60)) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-[#20251F] text-white flex flex-col justify-between p-6 sm:p-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C8F169]" />
          <span className="text-xs uppercase tracking-widest text-[#C8F169] font-bold">Focus Mode Active</span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 text-xs hover:bg-white/10 transition-colors"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Exit Focus</span>
        </button>
      </div>

      <div className="max-w-md mx-auto w-full text-center space-y-8">
        <div>
          <label className="block text-xs uppercase tracking-wider text-white/50 mb-2 font-medium">Current Focus Task</label>
          <select
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            className="w-full text-center bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C8F169]"
          >
            <option value="" className="bg-[#20251F] text-white">Select a task from your board...</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.name} className="bg-[#20251F] text-white">
                {t.name} ({t.duration})
              </option>
            ))}
          </select>
        </div>

        {/* Large Minimal Timer */}
        <div className="relative py-8">
          <div className="text-7xl sm:text-8xl font-mono font-bold tracking-tight text-white select-none">
            {timeFormatted}
          </div>
          <div className="w-48 h-1 bg-white/10 rounded-full mx-auto mt-6 overflow-hidden">
            <div
              className="h-full bg-[#C8F169] transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C8F169] text-[#20251F] font-bold text-sm hover:opacity-90 transition-opacity"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Start Focus Session
              </>
            )}
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(25 * 60);
            }}
            className="p-3 rounded-xl border border-white/15 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-white/40">
        Pomodoro 25-minute sprint. Single-tasking maximizes executive cognitive output.
      </div>
    </div>
  );
}

function CommandCenterView({ onNavigate, onDirectToolLoad }) {
  const [commandInput, setCommandInput] = useState('');
  const [isRouting, setIsRouting] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [error, setError] = useState(null);

  const suggestedCommands = [
    { label: 'Draft client extension email', prompt: 'Draft an email requesting a deadline extension for client deliverables', tool: 'email' },
    { label: 'Summarize today’s standup', prompt: 'Summarize our standup notes and isolate action items with deadlines', tool: 'meetings' },
    { label: 'Plan my workday priorities', prompt: 'Plan my high-intensity morning tasks using an Eisenhower Matrix schedule', tool: 'tasks' },
    { label: 'Research modern async workflows', prompt: 'Research best practices for asynchronous team decision making', tool: 'research' },
    { label: 'Improve my meeting agenda', prompt: 'Critique and refine an agenda for a product strategy roadmap meeting', tool: 'chat' }
  ];

  const handleRoute = async (textToRoute) => {
    const query = textToRoute || commandInput;
    if (!query.trim()) return;

    setIsRouting(true);
    setError(null);
    setRouteResult(null);

    const systemInstruction = `
You are the central dispatcher for WorkFlow AI. 
Determine the single best tool for the user's intent:
- 'email': For writing, drafting, requesting, apologizing, or sending messages.
- 'meetings': For transcripts, meeting agendas, notes, decisions, action lists.
- 'tasks': For scheduling, to-do lists, time blocking, planning the day/week.
- 'research': For analyzing long articles, exploring topics, synthesizing reports.
- 'chat': For general advice, brainstorming, drafting ad-hoc advice.

Respond strictly with valid JSON:
{
  "tool": "email" | "meetings" | "tasks" | "research" | "chat",
  "reasoning": "Short 1-sentence rationale",
  "prefill": "Clean payload text to pass into the destination tool"
}
`;

    try {
      const response = await callGeminiService(`User query: "${query}"`, systemInstruction);
      let parsed;
      try {
        const cleaned = response.replace(/```json/gi, '').replace(/```/gi, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (e) {
        parsed = {
          tool: query.toLowerCase().includes('email') ? 'email' : 'chat',
          reasoning: 'Routed via keyword heuristic analysis.',
          prefill: query
        };
      }
      setRouteResult(parsed);
    } catch (err) {
      setError(err.message || 'Routing failed. Please choose a tool manually.');
    } finally {
      setIsRouting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#EAF8C7] text-[#20251F] text-xs font-semibold">
          <Terminal className="w-3.5 h-3.5" />
          <span>Universal AI Command Center</span>
        </div>
        <h1 className="text-3xl font-bold text-[#161817] tracking-tight">What would you like to get done?</h1>
        <p className="text-sm text-[#72756F]">
          Express your task in natural language. WorkFlow AI will determine the optimal workflow, extract parameters, and route your request instantly.
        </p>
      </div>

      {/* Main Command Input Box */}
      <div className="bg-white rounded-xl border border-[#DFE1D8] shadow-sm p-4 focus-within:border-[#C8F169] focus-within:ring-2 focus-within:ring-[#C8F169]/30 transition-all">
        <textarea
          rows={3}
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          placeholder="e.g., 'Draft a formal email to our client explaining our server migration this Saturday', or 'Analyze these product release notes'..."
          className="w-full text-sm text-[#161817] placeholder-[#72756F]/60 bg-transparent resize-none focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleRoute();
            }
          }}
        />
        <div className="flex items-center justify-between pt-3 border-t border-[#DFE1D8]/60 mt-2">
          <span className="text-[11px] text-[#72756F]">
            Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-[#F6F5F0] border border-[#DFE1D8] font-mono">⌘+Enter</kbd> to execute
          </span>
          <button
            onClick={() => handleRoute()}
            disabled={isRouting || !commandInput.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C8F169] text-[#20251F] font-semibold text-xs hover:bg-[#bfe85f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRouting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing intent...</span>
              </>
            ) : (
              <>
                <span>Route Workflow</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Suggested Quick Triggers */}
      <div>
        <h3 className="text-xs uppercase tracking-wider font-semibold text-[#72756F] mb-3">Suggested Prompt Starters</h3>
        <div className="flex flex-wrap gap-2">
          {suggestedCommands.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCommandInput(item.prompt);
                handleRoute(item.prompt);
              }}
              className="px-3 py-2 rounded-lg bg-white border border-[#DFE1D8] hover:border-[#C8F169] text-xs font-medium text-[#161817] hover:bg-[#F6F5F0] transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Intent Decision Route Card */}
      {routeResult && (
        <div className="bg-white rounded-xl border border-[#DFE1D8] p-5 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C8F169]" />
              <span className="text-xs uppercase tracking-wider font-bold text-[#161817]">Intelligent Dispatch Complete</span>
            </div>
            <HumanReviewBadge />
          </div>

          <div className="p-3 bg-[#F6F5F0] rounded-lg border border-[#DFE1D8] text-xs space-y-1">
            <div className="font-semibold text-[#161817]">
              Recommended Target: <span className="uppercase text-[#20251F] font-bold underline">{routeResult.tool}</span>
            </div>
            <p className="text-[#72756F]">{routeResult.reasoning}</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setRouteResult(null)}
              className="px-3 py-1.5 rounded-lg border border-[#DFE1D8] text-xs text-[#72756F] hover:bg-[#F6F5F0]"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                onDirectToolLoad(routeResult.tool, routeResult.prefill);
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#20251F] text-[#C8F169] text-xs font-semibold hover:bg-black transition-colors"
            >
              <span>Launch into {routeResult.tool.toUpperCase()} Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewView({ onNavigate, stats, recentHistory, tasks }) {
  const quickActions = [
    { id: 'email', title: 'Draft an email', desc: 'Tone-calibrated client or team communications', tag: 'Communication' },
    { id: 'tasks', title: 'Plan my day', desc: 'Eisenhower matrix prioritization & timeline', tag: 'Execution' },
    { id: 'meetings', title: 'Summarize notes', desc: 'Extract decisions, action items & questions', tag: 'Collaboration' },
    { id: 'research', title: 'Research a topic', desc: 'Executive briefings & structured synthesis', tag: 'Knowledge' },
    { id: 'chat', title: 'Brainstorm with AI', desc: 'Strategic thinking partner & drafting copilot', tag: 'Intelligence' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Calm Personal Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DFE1D8] pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#72756F] font-semibold">Workspace Overview</span>
          <h1 className="text-3xl font-bold text-[#161817] tracking-tight mt-1">Good day, Professional.</h1>
          <p className="text-sm text-[#72756F] mt-1">Here is what needs your attention and execution today.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('command-center')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#DFE1D8] text-xs font-semibold text-[#161817] hover:border-[#C8F169] transition-colors shadow-xs"
          >
            <Terminal className="w-3.5 h-3.5 text-[#20251F]" />
            <span>AI Command Center</span>
          </button>
          <button
            onClick={() => onNavigate('focus')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#20251F] text-[#C8F169] text-xs font-semibold hover:bg-black transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Focus Mode</span>
          </button>
        </div>
      </div>

      {/* Metrics Row (Estimated time saved explicitly labeled) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#DFE1D8] shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#72756F]">
            Est. Time Saved <span className="text-[9px] font-normal lowercase">(model estimate)</span>
          </div>
          <div className="text-2xl font-bold text-[#161817] mt-1">{stats.estimatedHoursSaved}</div>
          <div className="text-[11px] text-[#5B8C5A] mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>~{stats.totalActions * 15} min of automated draft work</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#DFE1D8] shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#72756F]">Active Tasks</div>
          <div className="text-2xl font-bold text-[#161817] mt-1">{tasks.length}</div>
          <div className="text-[11px] text-[#72756F] mt-1">
            {tasks.filter((t) => t.urgency === 'Urgent' && t.importance === 'Important').length} high-priority
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#DFE1D8] shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#72756F]">Saved Workspace Artifacts</div>
          <div className="text-2xl font-bold text-[#161817] mt-1">{stats.savedArtifactsCount}</div>
          <div className="text-[11px] text-[#72756F] mt-1">Across 4 core productivity tools</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#DFE1D8] shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#72756F]">Copilot Exchanges</div>
          <div className="text-2xl font-bold text-[#161817] mt-1">{stats.chatCount}</div>
          <div className="text-[11px] text-[#72756F] mt-1">Stored in private local storage</div>
        </div>
      </div>

      {/* Suggested Quick Workspace Actions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-wider font-bold text-[#72756F]">Suggested Next Steps</h2>
          <span className="text-xs text-[#72756F]">Press Cmd+K anytime</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onNavigate(tool.id)}
              className="p-4 rounded-xl bg-white border border-[#DFE1D8] text-left hover:border-[#C8F169] hover:shadow-xs transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F6F5F0] text-[#72756F]">
                    {tool.tag}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#72756F] group-hover:text-[#161817] group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="font-semibold text-sm text-[#161817]">{tool.title}</h3>
                <p className="text-xs text-[#72756F] mt-1 leading-relaxed">{tool.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Split Grid: Today's Tasks & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Urgent Task Queue */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-[#DFE1D8] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-[#161817]">Priority Task Queue</h3>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-semibold text-[#161817] hover:underline"
            >
              View Matrix →
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#72756F]">
              Nothing on your plate. Click "View Matrix" to add tasks.
            </div>
          ) : (
            <div className="space-y-2.5">
              {tasks.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#F6F5F0] border border-[#DFE1D8] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        t.urgency === 'Urgent' ? 'bg-[#C65D5D]' : 'bg-[#D08A3C]'
                      }`}
                    />
                    <span className="font-medium text-[#161817]">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#72756F] font-mono">{t.duration}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#DFE1D8] text-[#72756F]">
                      {t.importance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Unified Activity Feed */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-[#DFE1D8] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-[#161817]">Recent Saved Activity</h3>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-[#161817] hover:underline"
            >
              All History →
            </button>
          </div>

          {recentHistory.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#72756F]">
              Your workspace is still quiet. Generated artifacts will appear here.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentHistory.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigate('history')}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-[#DFE1D8] hover:bg-[#F6F5F0] transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#EAF8C7] text-[#20251F]">
                      {item.tool}
                    </span>
                    <span className="font-medium text-[#161817] truncate max-w-[200px]">{item.title}</span>
                  </div>
                  <span className="text-[11px] text-[#72756F]">{item.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmailGeneratorView({ initialData, onSaveHistory, showToast }) {
  const [purpose, setPurpose] = useState(initialData?.purpose || '');
  const [audience, setAudience] = useState(initialData?.audience || 'Client');
  const [tone, setTone] = useState(initialData?.tone || 'Formal');
  const [keyPoints, setKeyPoints] = useState(initialData?.keyPoints || '');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleGenerate = async () => {
    if (!purpose.trim()) {
      setError('Please provide the objective or context for this email.');
      return;
    }
    setIsLoading(true);
    setError(null);

    const prompt = `
Generate a professional email based on the following:
- Purpose/Context: "${purpose}"
- Intended Audience: "${audience}"
- Tone: "${tone}"
- Key Points to address: "${keyPoints || 'None specified'}"

Strict output format:
Subject: [Clear, relevant subject line]
Body:
[Complete email body ready to review and send. Do not include markdown code ticks, meta preamble, or placeholders.]
`;

    try {
      const response = await callGeminiService(
        prompt,
        'You are an executive corporate communications strategist. You write clear, concise, and persuasive emails.'
      );

      const subjectMatch = response.match(/Subject:\s*(.*)/i);
      const extractedSubject = subjectMatch ? subjectMatch[1].trim() : 'Project Update & Follow-up';
      const extractedBody = response
        .replace(/Subject:\s*.*\n*/i, '')
        .replace(/^Body:\s*/i, '')
        .trim();

      setSubject(extractedSubject);
      setBody(extractedBody);
    } catch (err) {
      setError(err.message || 'Something went wrong while generating this email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!body) return;
    const full = `Subject: ${subject}\n\n${body}`;
    await navigator.clipboard.writeText(full);
    showToast('Copied email draft to clipboard');
  };

  const handleSave = () => {
    if (!body) return;
    onSaveHistory({
      tool: 'Email',
      title: subject || 'Email Draft',
      content: `Subject: ${subject}\n\n${body}`,
      meta: { audience, tone }
    });
    showToast('Saved to Workspace History');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DFE1D8] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#161817]" />
            <h1 className="text-2xl font-bold text-[#161817]">Smart Email Generator</h1>
          </div>
          <p className="text-xs text-[#72756F] mt-0.5">
            Calibrated communications structured for maximum recipient responsiveness.
          </p>
        </div>
        <HumanReviewBadge />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Form */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#DFE1D8] p-5 shadow-xs space-y-4">
          <h2 className="text-xs uppercase tracking-wider font-bold text-[#72756F]">Parameters</h2>

          <div>
            <label className="block text-xs font-semibold text-[#161817] mb-1">
              Purpose / Context <span className="text-[#C65D5D]">*</span>
            </label>
            <textarea
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Requesting a 3-day extension on Q3 budget submission due to unexpected vendor invoice updates..."
              className="w-full text-xs p-3 rounded-lg border border-[#DFE1D8] bg-[#F6F5F0]/50 text-[#161817] focus:outline-none focus:border-[#C8F169] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#161817] mb-1">Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-[#DFE1D8] bg-white text-[#161817] focus:outline-none"
              >
                <option value="Client">Client</option>
                <option value="Manager">Manager</option>
                <option value="Team">Team</option>
                <option value="Vendor">Vendor</option>
                <option value="Executive">Executive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#161817] mb-1">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-[#DFE1D8] bg-white text-[#161817] focus:outline-none"
              >
                <option value="Formal">Formal</option>
                <option value="Direct & Crisp">Direct & Crisp</option>
                <option value="Persuasive">Persuasive</option>
                <option value="Apologetic">Apologetic</option>
                <option value="Friendly">Friendly</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#161817] mb-1">
              Key Talking Points <span className="font-normal text-[#72756F]">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={keyPoints}
              onChange={(e) => setKeyPoints(e.target.value)}
              placeholder="• 85% of slide deck complete&#10;• New review session proposed for Thursday 2 PM"
              className="w-full text-xs p-3 rounded-lg border border-[#DFE1D8] bg-[#F6F5F0]/50 text-[#161817] focus:outline-none focus:border-[#C8F169] focus:bg-white"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !purpose.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#20251F] text-[#C8F169] text-xs font-semibold hover:bg-black transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Thinking through this...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Email</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output Document Surface */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#DFE1D8] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#DFE1D8] pb-3 mb-4">
              <span className="text-xs uppercase tracking-wider font-bold text-[#72756F]">Document Workspace</span>
              {body && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 rounded border border-[#DFE1D8] text-xs text-[#161817] hover:bg-[#F6F5F0]"
                  >
                    <Copy className="w-3 h-3 text-[#72756F]" />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-2.5 py-1 rounded border border-[#DFE1D8] text-xs text-[#161817] hover:bg-[#F6F5F0]"
                  >
                    <Bookmark className="w-3 h-3 text-[#72756F]" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-1 px-2.5 py-1 rounded border border-[#DFE1D8] text-xs text-[#161817] hover:bg-[#F6F5F0]"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-3 h-3 text-[#72756F]" />
                    <span>Regen</span>
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-lg flex items-center justify-between mb-4">
                <span>{error}</span>
                <button onClick={handleGenerate} className="underline font-semibold ml-2">Try again</button>
              </div>
            )}

            {!body && !isLoading && !error && (
              <div className="py-20 text-center text-xs text-[#72756F] space-y-2">
                <Mail className="w-8 h-8 text-[#72756F]/40 mx-auto" />
                <p className="font-medium text-[#161817]">Your email draft will render here.</p>
                <p>Fill out the parameters on the left and click "Generate Email".</p>
              </div>
            )}

            {isLoading && (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-[#20251F] mx-auto" />
                <div className="text-xs font-semibold text-[#161817]">Formulating tailored message...</div>
                <div className="text-[11px] text-[#72756F]">Applying professional {tone.toLowerCase()} etiquette</div>
              </div>
            )}

            {body && !isLoading && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#72756F] mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-lg border border-[#DFE1D8] bg-[#F6F5F0]/40 text-[#161817] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#72756F] mb-1">Editable Draft</label>
                  <textarea
                    rows={12}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full text-xs leading-relaxed p-3.5 rounded-lg border border-[#DFE1D8] bg-[#F6F5F0]/30 text-[#161817] focus:outline-none font-sans"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#DFE1D8] mt-4 flex items-center justify-between text-[11px] text-[#72756F]">
            <span>Draft state: ready for personal refinement</span>
            <span>Does not dispatch emails automatically</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MeetingNotesView({ onSaveHistory, showToast }) {
  const [meetingTitle, setMeetingTitle] = useState('');
  const [participants, setParticipants] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rawNotes, setRawNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [structuredOutput, setStructuredOutput] = useState(null);

  const handleSummarize = async () => {
    if (!rawNotes.trim()) {
      setError('Please paste or enter meeting notes to synthesize.');
      return;
    }
    setIsLoading(true);
    setError(null);

    const prompt = `
Analyze the following meeting transcript/notes and generate a structured executive brief:

Meeting Title: "${meetingTitle || 'Workspace Meeting'}"
Participants: "${participants || 'Not specified'}"
Date: "${date}"

Raw Notes:
"${rawNotes}"

Format strictly as JSON with this structure:
{
  "summary": "Plain-language concise summary of main discussions",
  "decisions": ["Key decision 1", "Key decision 2"],
  "actionItems": [
    { "task": "Description", "owner": "Name or Unassigned", "deadline": "Date/Timeframe or None" }
  ],
  "openQuestions": ["Question or ambiguity that remains unanswered"]
}
`;

    try {
      const response = await callGeminiService(
        prompt,
        'You are an executive chief of staff. You never hallucinate missing people or deadlines. If not explicitly stated, note "Unassigned" or "None".'
      );

      let parsed;
      try {
        const cleaned = response.replace(/```json/gi, '').replace(/```/gi, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (e) {
        parsed = {
          summary: response,
          decisions: ['Refer to summary notes'],
          actionItems: [{ task: 'Review notes', owner: 'Team', deadline: 'Soon' }],
          openQuestions: []
        };
      }
      setStructuredOutput(parsed);
    } catch (err) {
      setError(err.message || 'The AI request could not be completed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!structuredOutput) return;
    onSaveHistory({
      tool: 'Meetings',
      title: meetingTitle || 'Meeting Brief',
      content: JSON.stringify(structuredOutput, null, 2),
      meta: { participants, date }
    });
    showToast('Saved meeting brief to Workspace History');
  };

  const handleCopyAll = async () => {
    if (!structuredOutput) return;
    const text = `
MEETING: ${meetingTitle} (${date})
PARTICIPANTS: ${participants}

SUMMARY:
${structuredOutput.summary}

KEY DECISIONS:
${structuredOutput.decisions?.map((d) => `• ${d}`).join('\n')}

ACTION ITEMS:
${structuredOutput.actionItems?.map((a) => `[ ] ${a.task} (Owner: ${a.owner} | Due: ${a.deadline})`).join('\n')}

OPEN QUESTIONS:
${structuredOutput.openQuestions?.map((q) => `? ${q}`).join('\n')}
    `.trim();

    await navigator.clipboard.writeText(text);
    showToast('Copied full meeting synthesis');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DFE1D8] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
            <h1 className="text-2xl font-bold text-[#161817]">Meeting Notes Summarizer</h1>
          </div>
          <p className="text-xs text-[#72756F] mt-0.5">
            Turn disorganized discussions into actionable decisions, verified checklists, and open questions.
          </p>
        </div>
        <HumanReviewBadge />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#DFE1D8] p-5 shadow-xs space-y-4">
          <h2 className="text-xs uppercase tracking-wider font-bold text-[#72756F]">Meeting Metadata</h2>

          <div>
            <label className="block text-xs font-semibold text-[#161817] mb-1">Meeting Title</label>
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              placeholder="e.g. Q4 Infrastructure Architecture Review"
              className="w-full text-xs p-2.5 rounded-lg border border-[#DFE1D8] bg-[#F6F5F0]/50 text-[#161817] focus:outline-none focus:border-[#C8F169] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#161817] mb-1">Participants</label>
              <input
                type="text"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="Sarah, David, Maya"
                className="w-full text-xs p-2.5 rounded-lg border border-[#DFE1D8] bg-white text-[#161817] focus:outline-none"
              >
              </input>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#161817] mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-[#DFE1D8] bg-white text-[#161817] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#161817] mb-1">
              Raw Notes or Audio Transcript <span className="text-[#C65D5D]">*</span>
            </label>
            <textarea
              rows={8}
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="Paste raw bullet points, transcript snippets, or conversation notes here..."
              className="w-full text-xs p-3 rounded-lg border border-[#DFE1D8] bg-[#F6F5F0]/50 text-[#161817] focus:outline-none focus:border-[#C8F169] focus:bg-white font-mono"
            />
          </div>

          <button
            onClick={handleSummarize}
            disabled={isLoading || !rawNotes.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#20251F] text-[#C8F169] text-xs font-semibold hover:bg-black transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Extracting decisions & items...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Synthesize Meeting</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output Structure */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#DFE1D8] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#DFE1D8] pb-3 mb-4">
              <span className="text-xs uppercase tracking-wider font-bold text-[#72756F]">Structured Meeting Brief</span>
              {structuredOutput && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyAll}
                    className="flex items-center gap-1 px-2.5 py-1 rounded border border-[#DFE1D8] text-xs text-[#161817] hover:bg-[#F6F5F0]"
                  >
                    <Copy className="w-3 h-3 text-[#72756F]" />
                    <span>Copy All</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-2.5 py-1 rounded border border-[#DFE1D8] text-xs text-[#161817] hover:bg-[#F6F5F0]"
                  >
                    <Bookmark className="w-3 h-3 text-[#72756F]" />
                    <span>Save</span>
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-lg flex items-center justify-between mb-4">
                <span>{error}</span>
                <button onClick={handleSummarize} className="underline font-semibold ml-2">Try again</button>
              </div>
            )}

            {!structuredOutput && !isLoading && (
              <div className="py-20 text-center text-xs text-[#72756F] space-y-2">
                <FileText className="w-8 h-8 text-[#72756F]/40 mx-auto" />
                <p className="font-medium text-[#161817]">No meeting synthesized yet.</p>
                <p>Provide your notes on the left to extract decisions and assigned tasks.</p>
              </div>
            )}

            {isLoading && (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-[#20251F] mx-auto" />
                <div className="text-xs font-semibold text-[#161817]">Parsing transcript context...</div>
                <div className="text-[11px] text-[#72756F]">Checking accountable owners and stated deadlines</div>
              </div>
            )}

            {structuredOutput && !isLoading && (
              <div className="space-y-4">
                {/* 1. Concise Summary */}
                <div className="p-3.5 bg-[#F6F5F0] rounded-lg border border-[#DFE1D8]">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#20251F] mb-1">
                    Executive Summary
                  </h4>
                  <p className="text-xs text-[#161817] leading-relaxed">{structuredOutput.summary}</p>
                </div>

                {/* 2. Decisions */}
                <div className="p-3.5 bg-[#F6F5F0] rounded-lg border border-[#DFE1D8]">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#20251F] mb-2">
                    Key Decisions ({structuredOutput.decisions?.length || 0})
                  </h4>
                  <ul className="space-y-1.5">
                    {structuredOutput.decisions?.map((dec, i) => (
                      <li key={i} className="text-xs text-[#161817] flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#5B8C5A] mt-1.5 flex-shrink-0" />
                        <span>{dec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Action Items Checklist */}
                <div className="p-3.5 bg-[#F6F5F0] rounded-lg border border-[#DFE1D8]">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#20251F] mb-2">
                    Action Items ({structuredOutput.actionItems?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {structuredOutput.actionItems?.map((act, i) => (
                      <div key={i} className="p-2.5 rounded bg-white border border-[#DFE1D8] text-xs flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#72756F] mt-0.5" />
                          <span className="font-medium text-[#161817]">{act.task}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-[#F6F5F0] border border-[#DFE1D8] text-[#161817]">
                            {act.owner}
                          </span>
                          <span className="text-[#72756F]">{act.deadline}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Open Questions */}
                {structuredOutput.openQuestions?.length > 0 && (
                  <div className="p-3.5 bg-[#F6F5F0] rounded-lg border border-[#DFE1D8]">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#20251F] mb-1">
                      Open Questions & Follow-ups
                    </h4>
                    <ul className="space-y-1">
                      {structuredOutput.openQuestions.map((q, i) => (
                        <li key={i} className="text-xs text-[#72756F] italic">
                          • {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskPlannerView({ tasks, onAddTask, onRemoveTask, onSaveHistory, showToast }) {
  const [taskName, setTaskName] = useState('');
  const [duration, setDuration] = useState('45m');
  const [urgency, setUrgency] = useState('Urgent');
  const [importance, setImportance] = useState('Important');
  const [scheduleType, setScheduleType] = useState('Daily');

  const [isLoading, setIsLoading] = useState(false);
  const [aiSchedule, setAiSchedule] = useState('');
  const [error, setError] = useState(null);

  const handleSubmitTask = (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    onAddTask({
      id: Date.now().toString(),
      name: taskName.trim(),
      duration,
      urgency,
      importance
    });
    setTaskName('');
  };

  // Group into 4 quadrants
  const doTasks = tasks.filter((t) => t.urgency === 'Urgent' && t.importance === 'Important');
  const scheduleTasks = tasks.filter((t) => t.urgency === 'Not urgent' && t.importance === 'Important');
  const delegateTasks = tasks.filter((t) => t.urgency === 'Urgent' && t.importance === 'Not important');
  const eliminateTasks = tasks.filter((t) => t.urgency === 'Not urgent' && t.importance === 'Not important');

  const handleGenerateSchedule = async () => {
    if (tasks.length === 0) {
      setError('Please add at least one task to schedule.');
      return;
    }
    setIsLoading(true);
    setError(null);

    const taskList = tasks
      .map((t, idx) => `${idx + 1}. "${t.name}" (${t.duration}) - ${t.urgency}, ${t.importance}`)
      .join('\n');

    const prompt = `
Create an optimal ${scheduleType} prioritized schedule for these tasks:
${taskList}

Requirements:
1. ORDERED TIME-BLOCKED SCHEDULE:
   Create a realistic 9:00 AM onwards timeline (e.g., 09:00 - 10:15 [Task], 10:15 - 10:30 [Buffer break]).
2. CONCISE USER-FACING RATIONALE:
   2 sentences explaining why this sequencing protects deep cognitive bandwidth (Do not expose private chain-of-thought).
3. OPTIMIZATION TIP:
   1 concrete strategy for batching or handling interruptions.
`;

    try {
      const response = await callGeminiService(
        prompt,
        'You are a high-performance executive coach. You arrange work by cognitive stamina and urgent constraints.'
      );
      setAiSchedule(response);
    } catch (err) {
      setError(err.message || 'Failed to generate schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSchedule = () => {
    if (!aiSchedule) return;
    onSaveHistory({
      tool: 'Tasks',
      title: `${scheduleType} Task Schedule (${tasks.length} tasks)`,
      content: aiSchedule,
      meta: { taskCount: tasks.length, scheduleType }
    });
    showToast('Saved schedule to Workspace History');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DFE1D8] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F97316]" />
            <h1 className="text-2xl font-bold text-[#161817]">Task Planner & Matrix</h1>
          </div>
          <p className="text-xs text-[#72756F] mt-0.5">
            Visual Eisenhower priority classification with AI-generated time-blocked execution blocks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-[#DFE1D8] p-0.5 bg-white text-xs">
            <button
              onClick={() => setScheduleType('Daily')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                scheduleType === 'Daily' ? 'bg-[#20251F] text-[#C8F169]' : 'text-[#72756F]'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setScheduleType('Weekly')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                scheduleType === 'Weekly' ? 'bg-[#20251F] text-[#C8F169]' : 'text-[#72756F]'
              }`}
            >
              Weekly
            </button>
          </div>
          <HumanReviewBadge />
        </div>
      </div>

      {/* Add Task Input Row */}
      <form onSubmit={handleSubmitTask} className="bg-white rounded-xl border border-[#DFE1D8] p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-semibold text-[#161817] mb-1">New Task Name</label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="e.g. Audit API authentication latency"
              className="w-full text-xs p-2.5 rounded-lg border border-[#DFE1D8] bg-[#F6F5F0]/40 text-[#161817] focus:outline-none focus:bg-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-[#161817] mb-1">Est. Duration</label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="45m / 2h"
              className="w-full text-xs p-2.5 rounded-lg border border-[#DFE1D8] bg-[#F6F5F0]/40 text-[#161817] focus:outline-none focus:bg-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-[#161817] mb-1">Urgency</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-[#DFE1D8] bg-white text-[#161817] focus:outline-none"
            >
              <option value="Urgent">Urgent</option>
              <option value="Not urgent">Not urgent</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-[#161817] mb-1">Importance</label>
            <select
              value={importance}
              onChange={(e) => setImportance(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-[#DFE1D8] bg-white text-[#161817] focus:outline-none"
            >
              <option value="Important">Important</option>
              <option value="Not important">Not important</option>
            </select>
          </div>
          <div className="sm:col-span-1">
            <button
              type="submit"
              className="w-full p-2.5 rounded-lg bg-[#20251F] text-[#C8F169] hover:bg-black transition-colors flex items-center justify-center"
              title="Add task"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Visual Eisenhower Matrix 2x2 Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-wider font-bold text-[#72756F]">
            Eisenhower Matrix ({tasks.length} Total Tasks)
          </h2>
          <button
            onClick={handleGenerateSchedule}
            disabled={isLoading || tasks.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#20251F] text-[#C8F169] text-xs font-semibold hover:bg-black transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scheduling...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate AI {scheduleType} Schedule</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quadrant 1: DO */}
          <div className="bg-white rounded-xl border-2 border-[#C65D5D]/30 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C65D5D]">1. Do First</span>
              <span className="text-[10px] text-[#72756F]">Urgent & Important</span>
            </div>
            <div className="space-y-2 min-h-[90px]">
              {doTasks.length === 0 ? (
                <div className="text-[11px] text-[#72756F]/60 italic py-4">No critical blockers.</div>
              ) : (
                doTasks.map((t) => (
                  <div key={t.id} className="p-2 rounded-lg bg-[#F6F5F0] border border-[#DFE1D8] text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#161817]">{t.name}</div>
                      <div className="text-[10px] text-[#72756F]">{t.duration}</div>
                    </div>
                    <button onClick={() => onRemoveTask(t.id)} className="text-[#72756F]/60 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quadrant 2: SCHEDULE */}
          <div className="bg-white rounded-xl border-2 border-[#161817]/20 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#161817]">2. Schedule</span>
              <span className="text-[10px] text-[#72756F]">Not Urgent & Important</span>
            </div>
            <div className="space-y-2 min-h-[90px]">
              {scheduleTasks.length === 0 ? (
                <div className="text-[11px] text-[#72756F]/60 italic py-4">No proactive goals added.</div>
              ) : (
                scheduleTasks.map((t) => (
                  <div key={t.id} className="p-2 rounded-lg bg-[#F6F5F0] border border-[#DFE1D8] text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#161817]">{t.name}</div>
                      <div className="text-[10px] text-[#72756F]">{t.duration}</div>
                    </div>
                    <button onClick={() => onRemoveTask(t.id)} className="text-[#72756F]/60 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quadrant 3: DELEGATE */}
          <div className="bg-white rounded-xl border-2 border-[#D08A3C]/30 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D08A3C]">3. Delegate</span>
              <span className="text-[10px] text-[#72756F]">Urgent & Not Important</span>
            </div>
            <div className="space-y-2 min-h-[90px]">
              {delegateTasks.length === 0 ? (
                <div className="text-[11px] text-[#72756F]/60 italic py-4">No interruptive tasks.</div>
              ) : (
                delegateTasks.map((t) => (
                  <div key={t.id} className="p-2 rounded-lg bg-[#F6F5F0] border border-[#DFE1D8] text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#161817]">{t.name}</div>
                      <div className="text-[10px] text-[#72756F]">{t.duration}</div>
                    </div>
                    <button onClick={() => onRemoveTask(t.id)} className="text-[#72756F]/60 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quadrant 4: ELIMINATE */}
          <div className="bg-white rounded-xl border-2 border-[#DFE1D8] p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#72756F]">4. Eliminate / Defer</span>
              <span className="text-[10px] text-[#72756F]">Not Urgent & Not Important</span>
            </div>
            <div className="space-y-2 min-h-[90px]">
              {eliminateTasks.length === 0 ? (
                <div className="text-[11px] text-[#72756F]/60 italic py-4">No low-value activities.</div>
              ) : (
                eliminateTasks.map((t) => (
                  <div key={t.id} className="p-2 rounded-lg bg-[#F6F5F0] border border-[#DFE1D8] text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#161817]">{t.name}</div>
                      <div className="text-[10px] text-[#72756F]">{t.duration}</div>
                    </div>
                    <button onClick={() => onRemoveTask(t.id)} className="text-[#72756F]/60 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Schedule Timeline Output */}
      {aiSchedule && !isLoading && (
        <div className="bg-white rounded-xl border border-[#DFE1D8] p-5 shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#DFE1D8] pb-3">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-[#161817]">
                AI {scheduleType} Execution Blueprint
              </span>
              <div className="text-[11px] text-[#72756F]">Calculated for cognitive rhythm & deep work</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(aiSchedule);
                  showToast('Copied schedule to clipboard');
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded border border-[#DFE1D8] text-xs text-[#161817] hover:bg-[#F6F5F0]"
              >
                <Copy className="w-3 h-3 text-[#72756F]" />
                <span>Copy</span>
              </button>
              <button
                onClick={handleSaveSchedule}
                className="flex items-center gap-1 px-2.5 py-1 rounded border border-[#DFE1D8] text-xs text-[#161817] hover:bg-[#F6F5F0]"
              >
                <Bookmark className="w-3 h-3 text-[#72756F]" />
                <span>Save</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-[#F6F5F0] rounded-lg border border-[#DFE1D8] text-xs text-[#161817] leading-relaxed whitespace-pre-line font-sans">
            {aiSchedule}
          </div>
        </div>
      )}
    </div>
  );
}

function ResearchAssistantView({ onSaveHistory, showToast }) {
  const [mode, setMode] = useState('analyse'); // 'analyse' | 'topic'
  const [inputText, setInputText] = useState('');
  const [topic, setTopic] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [researchOutput, setResearchOutput] = useState(null);

  const handleResearch = async () => {
    if (mode === 'analyse' && !inputText.trim()) {
      setError('Please paste document or report text to analyze.');
      return;
    }
    if (mode === 'topic' && !topic.trim()) {
      setError('Please enter a topic or research question.');
      return;
    }

    setIsLoading(true);
    setError(null);

    let prompt = '';
    if (mode === 'analyse') {
      prompt = `
Analyze this workplace document and produce a structured brief in JSON:
Document: "${inputText}"

Strict JSON structure:
{
  "overview": "Concise plain-language summary of core message",
  "keyFindings": ["Key finding 1", "Key finding 2", "Key finding 3"],
  "importantConcepts": ["Concept or metric 1", "Concept or metric 2"],
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2"]
}
`;
    } else {
      prompt = `
Produce an objective workplace intelligence brief on this topic:
Topic: "${topic}"

Strict JSON structure (DO NOT fabricate fake URLs or external links; state established organizational knowledge):
{
  "overview": "Executive overview of topic and significance",
  "keyFindings": ["Core factor 1", "Core factor 2", "Core factor 3"],
  "importantConcepts": ["Framework/Term 1", "Framework/Term 2"],
  "recommendations": ["Best practice for implementation 1", "Best practice 2"]
}
`;
    }

    try {
      const response = await callGeminiService(
        prompt,
        'You are an executive research director. Deliver structured, objective, and dense intellectual briefings.'
      );

      let parsed;
      try {
        const cleaned = response.replace(/```json/gi, '').replace(/```/gi, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (e) {
        parsed = {
          overview: response,
          keyFindings: ['Review full response text'],
          importantConcepts: ['Synthesized knowledge'],
          recommendations: ['Apply insights directly']
        };
      }
      setResearchOutput(parsed);
    } catch (err) {
      setError(err.message || 'Research synthesis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!researchOutput) return;
    onSaveHistory({
      tool: 'Research',
      title: mode === 'analyse' ? 'Document Analysis Brief' : `Topic Brief: ${topic}`,
      content: JSON.stringify(researchOutput, null, 2),
      meta: { mode }
    });
    showToast('Saved research brief to Workspace History');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DFE1D8] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
            <h1 className="text-2xl font-bold text-[#161817]">Research Workspace</h1>
          </div>
          <p className="text-xs text-[#72756F] mt-0.5">
            Digest complex reports or explore domain concepts without fabricated citations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-[#DFE1D8] p-0.5 bg-white text-xs">
            <button
              onClick={() => setMode('analyse')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                mode === 'analyse' ? 'bg-[#20251F] text-[#C8F169]' : 'text-[#72756F]'
              }`}
            >
              Analyse Text
            </button>
            <button
              onClick={() => setMode('topic')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                mode === 'topic' ? 'bg-[#20251F] text-[#C8F169]' : 'text-[#72756F]'
              }`}
            >
              Research Topic
            </button>
          </div>
          <HumanReviewBadge />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#DFE1D8] p-5 shadow-xs space-y-4">
          <h2 className="text-xs uppercase tracking-wider font-bold text-[#72756F]">
            {mode === 'analyse' ? 'Document Source' : 'Topic Query'}
          </h2>

          {mode === 'analyse' ? (
            <div>
              <label className="block text-xs font-semibold text-[#161817] mb-1">
                Pasted Article or Documentation <span className="text-[#C65D5D]">*</span>
              </label>
              <textarea
                rows={10}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste research papers, internal docs, release reports, or industry articles..."
                className="w-full text-xs p-3 rounded-lg border border-[#DFE1D8] bg-[#F6F5F0]/50 text-[#161817] focus:outline-none focus:border-[#C8F169] focus:bg-white"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-[#161817] mb-1">
                Topic or Question <span className="text-[#C65D5D]">*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Distributed database failover protocols in fintech"
                className="w-full text-xs p-3 rounded-lg border border-[#DFE1D8] bg-[#F6F5F0]/50 text-[#161817] focus:outline-none focus:border-[#C8F169] focus:bg-white"
              />
              <p className="text-[11px] text-[#72756F] mt-2">
                Note: WorkFlow AI synthesizes deep structural organizational knowledge without fabricated search sources.
              </p>
            </div>
          )}

          <button
            onClick={handleResearch}
            disabled={isLoading || (mode === 'analyse' ? !inputText.trim() : !topic.trim())}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#20251F] text-[#C8F169] text-xs font-semibold hover:bg-black transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing intelligence...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Execute Synthesis</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#DFE1D8] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#DFE1D8] pb-3 mb-4">
              <span className="text-xs uppercase tracking-wider font-bold text-[#72756F]">Executive Research Output</span>
              {researchOutput && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(JSON.stringify(researchOutput, null, 2));
                      showToast('Copied research brief to clipboard');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded border border-[#DFE1D8] text-xs text-[#161817] hover:bg-[#F6F5F0]"
                  >
                    <Copy className="w-3 h-3 text-[#72756F]" />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-2.5 py-1 rounded border border-[#DFE1D8] text-xs text-[#161817] hover:bg-[#F6F5F0]"
                  >
                    <Bookmark className="w-3 h-3 text-[#72756F]" />
                    <span>Save</span>
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-lg flex items-center justify-between mb-4">
                <span>{error}</span>
                <button onClick={handleResearch} className="underline font-semibold ml-2">Try again</button>
              </div>
            )}

            {!researchOutput && !isLoading && (
              <div className="py-20 text-center text-xs text-[#72756F] space-y-2">
                <Search className="w-8 h-8 text-[#72756F]/40 mx-auto" />
                <p className="font-medium text-[#161817]">Research synthesis workspace ready.</p>
                <p>Select a mode on the left to extract insights or explore complex concepts.</p>
              </div>
            )}

            {isLoading && (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-[#20251F] mx-auto" />
                <div className="text-xs font-semibold text-[#161817]">Synthesizing core takeaways...</div>
                <div className="text-[11px] text-[#72756F]">Isolating high-impact concepts and recommendations</div>
              </div>
            )}

            {researchOutput && !isLoading && (
              <div className="space-y-4">
                <div className="p-3.5 bg-[#F6F5F0] rounded-lg border border-[#DFE1D8]">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#20251F] mb-1">
                    Plain-Language Overview
                  </h4>
                  <p className="text-xs text-[#161817] leading-relaxed">{researchOutput.overview}</p>
                </div>

                <div className="p-3.5 bg-[#F6F5F0] rounded-lg border border-[#DFE1D8]">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#20251F] mb-2">
                    Key Findings ({researchOutput.keyFindings?.length || 0})
                  </h4>
                  <ul className="space-y-1.5">
                    {researchOutput.keyFindings?.map((f, idx) => (
                      <li key={idx} className="text-xs text-[#161817] flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] mt-1.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-[#F6F5F0] rounded-lg border border-[#DFE1D8]">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#20251F] mb-2">
                    Core Concepts
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {researchOutput.importantConcepts?.map((c, idx) => (
                      <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-white border border-[#DFE1D8] text-[#161817]">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-[#F6F5F0] rounded-lg border border-[#DFE1D8]">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#20251F] mb-1">
                    Actionable Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {researchOutput.recommendations?.map((r, idx) => (
                      <li key={idx} className="text-xs text-[#161817] flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#5B8C5A] mt-0.5 flex-shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatAssistantView({ messages, onSendMessage, onClearChat, isLoading, onNavigate }) {
  const [inputVal, setInputVal] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const starterPrompts = [
    'Help me plan my day',
    'Turn this into tasks',
    'Rewrite this professionally',
    'Help me prepare for a meeting'
  ];

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;
    onSendMessage(inputVal.trim());
    setInputVal('');
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col bg-white rounded-xl border border-[#DFE1D8] shadow-xs overflow-hidden">
      {/* Copilot Header */}
      <div className="px-5 py-3.5 border-b border-[#DFE1D8] flex items-center justify-between bg-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#EC4899]" />
          <div>
            <h2 className="text-sm font-bold text-[#161817]">WorkFlow Copilot</h2>
            <p className="text-[10px] text-[#72756F]">Context-aware workplace intelligence partner</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <HumanReviewBadge />
          <button
            onClick={onClearChat}
            className="text-xs text-[#72756F] hover:text-[#161817] transition-colors"
          >
            Clear History
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F6F5F0]/30">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-[#20251F] text-white rounded-br-none shadow-xs'
                    : 'bg-white text-[#161817] border border-[#DFE1D8] rounded-bl-none shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1 text-[10px] font-bold uppercase tracking-wider">
                  <span className={isUser ? 'text-[#C8F169]' : 'text-[#72756F]'}>
                    {isUser ? 'You' : 'WorkFlow AI'}
                  </span>
                  {!isUser && (
                    <button
                      onClick={() => navigator.clipboard.writeText(m.text)}
                      className="text-[#72756F] hover:text-[#161817]"
                      title="Copy message"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="whitespace-pre-line font-sans">{m.text}</div>

                {/* Helpful contextual workflow suggestions */}
                {!isUser && idx === messages.length - 1 && (
                  <div className="mt-3 pt-2.5 border-t border-[#DFE1D8]/60 flex items-center gap-2 text-[11px] text-[#72756F]">
                    <span>Need to action this?</span>
                    <button
                      onClick={() => onNavigate('tasks')}
                      className="text-[#161817] font-semibold underline hover:text-black"
                    >
                      Add to Tasks
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => onNavigate('email')}
                      className="text-[#161817] font-semibold underline hover:text-black"
                    >
                      Draft Email
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#DFE1D8] rounded-xl rounded-bl-none p-3.5 text-xs text-[#161817] flex items-center gap-2.5 shadow-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#20251F]" />
              <span>Thinking through workplace solution...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Starter Chips */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 bg-white border-t border-[#DFE1D8] flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-semibold uppercase text-[#72756F] flex-shrink-0">Quick Ask:</span>
          {starterPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => onSendMessage(p)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-[#F6F5F0] border border-[#DFE1D8] text-[#161817] hover:bg-[#EAF8C7] transition-colors whitespace-nowrap flex-shrink-0"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#DFE1D8] flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask anything, request an edit, or brainstorm strategy..."
            className="flex-1 text-xs p-3 rounded-lg border border-[#DFE1D8] bg-[#F6F5F0]/40 text-[#161817] focus:outline-none focus:bg-white focus:border-[#C8F169]"
          />
          <button
            type="submit"
            disabled={isLoading || !inputVal.trim()}
            className="p-3 rounded-lg bg-[#20251F] text-[#C8F169] hover:bg-black transition-colors disabled:opacity-50"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function UnifiedHistoryView({ history, onDeleteItem, onClearAll, showToast }) {
  const [filterTool, setFilterTool] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewItem, setViewItem] = useState(null);

  const filtered = history.filter((item) => {
    const matchesTool = filterTool === 'All' || item.tool.toLowerCase() === filterTool.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTool && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DFE1D8] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#161817]">Unified Workspace History</h1>
          <p className="text-xs text-[#72756F] mt-0.5">
            Single chronological audit log for all generated emails, meeting briefs, schedules, and research reports.
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-red-600 hover:underline font-medium"
          >
            Clear All History
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['All', 'Email', 'Meetings', 'Tasks', 'Research'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterTool(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterTool === t
                  ? 'bg-[#20251F] text-[#C8F169]'
                  : 'bg-white border border-[#DFE1D8] text-[#72756F] hover:bg-[#F6F5F0]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#72756F] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved artifacts..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#DFE1D8] bg-white text-[#161817] focus:outline-none"
          />
        </div>
      </div>

      {/* Chronological Timeline Feed */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#DFE1D8] p-12 text-center text-xs text-[#72756F] space-y-2">
            <Clock className="w-8 h-8 text-[#72756F]/40 mx-auto" />
            <div className="font-semibold text-[#161817]">No history matches your query.</div>
            <p>Save outputs from Email, Meetings, Tasks, or Research to build your repository.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-[#DFE1D8] p-4 shadow-xs hover:border-[#C8F169] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EAF8C7] text-[#20251F]">
                    {item.tool}
                  </span>
                  <span className="text-[11px] text-[#72756F]">{item.date}</span>
                </div>
                <h3 className="font-semibold text-sm text-[#161817]">{item.title}</h3>
                <p className="text-xs text-[#72756F] line-clamp-1">{item.content}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setViewItem(item)}
                  className="px-3 py-1.5 rounded-lg border border-[#DFE1D8] text-xs font-semibold text-[#161817] hover:bg-[#F6F5F0]"
                >
                  View
                </button>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(item.content);
                    showToast('Copied content to clipboard');
                  }}
                  className="p-1.5 rounded-lg border border-[#DFE1D8] text-[#72756F] hover:text-[#161817] hover:bg-[#F6F5F0]"
                  title="Copy"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="p-1.5 rounded-lg border border-[#DFE1D8] text-[#72756F] hover:text-red-600 hover:bg-[#F6F5F0]"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inspect Item Modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#20251F]/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-xl border border-[#DFE1D8] shadow-2xl p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#DFE1D8] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#72756F]">{viewItem.tool}</span>
                <h3 className="text-base font-bold text-[#161817]">{viewItem.title}</h3>
              </div>
              <button onClick={() => setViewItem(null)} className="p-1 text-[#72756F] hover:text-[#161817]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 bg-[#F6F5F0] rounded-lg border border-[#DFE1D8] text-xs text-[#161817] leading-relaxed whitespace-pre-line font-mono">
              {viewItem.content}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#72756F]">{viewItem.date}</span>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(viewItem.content);
                  showToast('Copied content to clipboard');
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#20251F] text-[#C8F169] text-xs font-semibold hover:bg-black"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Payload</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PromptLibraryView({ onUsePrompt, showToast }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');

  const library = [
    {
      category: 'Communication',
      title: 'Follow up after meeting',
      prompt: 'Draft a polite follow-up email confirming our meeting decisions and reiterating agreed deadlines without sounding pushy.',
      tool: 'email'
    },
    {
      category: 'Communication',
      title: 'Request a deadline extension',
      prompt: 'Write an honest, professional request for an extra 48 hours on the client deliverable citing additional QA validation.',
      tool: 'email'
    },
    {
      category: 'Communication',
      title: 'Diplomatic project status update',
      prompt: 'Draft a crisp bulleted executive status update highlighting completed deliverables and non-blocking external dependencies.',
      tool: 'email'
    },
    {
      category: 'Meetings',
      title: 'Extract accountable action items',
      prompt: 'Extract all tasks from the following transcript with clear owner identification and timeline requirements.',
      tool: 'meetings'
    },
    {
      category: 'Meetings',
      title: 'Generate structured decision log',
      prompt: 'Synthesize the notes below into an authoritative decision log detailing what was approved and what was deprioritized.',
      tool: 'meetings'
    },
    {
      category: 'Productivity',
      title: 'Plan my workday priorities',
      prompt: 'Categorize my day’s tasks using the Eisenhower Matrix and establish time blocks that minimize cognitive context switching.',
      tool: 'tasks'
    },
    {
      category: 'Productivity',
      title: 'Break ambiguous project into tasks',
      prompt: 'Deconstruct this vague initiative into 5 discrete, sequential, and estimated work packages with clear definitions of done.',
      tool: 'tasks'
    },
    {
      category: 'Research',
      title: 'Synthesize dense report',
      prompt: 'Summarize the core takeaways, methodology findings, and commercial implications of the attached whitepaper.',
      tool: 'research'
    },
    {
      category: 'Research',
      title: 'Explain architecture concept',
      prompt: 'Provide a structured workplace brief explaining event-driven microservices architecture for non-technical stakeholders.',
      tool: 'research'
    }
  ];

  const categories = ['All', 'Communication', 'Meetings', 'Productivity', 'Research'];

  const filtered = library.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.prompt.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="border-b border-[#DFE1D8] pb-4">
        <h1 className="text-2xl font-bold text-[#161817]">Workplace Prompt Library</h1>
        <p className="text-xs text-[#72756F] mt-0.5">
          Battle-tested system prompts tailored for executive communications, meeting audits, and agenda formulation.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === c
                  ? 'bg-[#20251F] text-[#C8F169]'
                  : 'bg-white border border-[#DFE1D8] text-[#72756F] hover:bg-[#F6F5F0]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#72756F] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#DFE1D8] bg-white text-[#161817] focus:outline-none"
          />
        </div>
      </div>

      {/* Prompt Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-[#DFE1D8] p-5 shadow-xs hover:border-[#C8F169] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#F6F5F0] text-[#72756F]">
                  {item.category}
                </span>
                <span className="text-[10px] text-[#72756F]">Direct Tool: {item.tool}</span>
              </div>
              <h3 className="font-semibold text-sm text-[#161817] mb-2">{item.title}</h3>
              <p className="text-xs text-[#72756F] leading-relaxed bg-[#F6F5F0]/60 p-3 rounded-lg border border-[#DFE1D8]/60 font-sans">
                "{item.prompt}"
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#DFE1D8]/60 mt-4">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(item.prompt);
                  showToast('Copied prompt to clipboard');
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#DFE1D8] text-xs text-[#161817] hover:bg-[#F6F5F0]"
              >
                <Copy className="w-3 h-3 text-[#72756F]" />
                <span>Copy</span>
              </button>
              <button
                onClick={() => onUsePrompt(item.tool, item.prompt)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#20251F] text-[#C8F169] text-xs font-semibold hover:bg-black transition-colors"
              >
                <span>Use in Tool</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductivityInsightsView({ stats, history, focusSeconds }) {
  const focusMinutes = Math.floor(focusSeconds / 60);

  // Group tool frequencies
  const toolCounts = history.reduce((acc, item) => {
    acc[item.tool] = (acc[item.tool] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      <div className="border-b border-[#DFE1D8] pb-4">
        <h1 className="text-2xl font-bold text-[#161817]">Productivity Insights</h1>
        <p className="text-xs text-[#72756F] mt-0.5">
          Quantified operational metrics calculated strictly from verified client-side local workspace activity.
        </p>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#DFE1D8] p-5 shadow-xs">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#72756F]">
            Estimated Time Saved
          </div>
          <div className="text-3xl font-bold text-[#161817] mt-1">{stats.estimatedHoursSaved}</div>
          <div className="text-[11px] text-[#72756F] mt-1">
            Explicitly marked as an algorithm approximation (~15m per draft)
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#DFE1D8] p-5 shadow-xs">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#72756F]">
            Focus Sprints Completed
          </div>
          <div className="text-3xl font-bold text-[#161817] mt-1">{focusMinutes}m</div>
          <div className="text-[11px] text-[#5B8C5A] mt-1">
            Total distraction-free pomodoro execution time
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#DFE1D8] p-5 shadow-xs">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#72756F]">
            Total Artifacts Generated
          </div>
          <div className="text-3xl font-bold text-[#161817] mt-1">{stats.totalActions}</div>
          <div className="text-[11px] text-[#72756F] mt-1">
            Across email, notes, agendas, and briefs
          </div>
        </div>
      </div>

      {/* Distribution by Tool */}
      <div className="bg-white rounded-xl border border-[#DFE1D8] p-5 shadow-xs">
        <h2 className="text-sm font-bold text-[#161817] mb-3">Tool Usage Breakdown</h2>
        <div className="space-y-3">
          {['Email', 'Meetings', 'Tasks', 'Research'].map((tool) => {
            const count = toolCounts[tool] || 0;
            const pct = stats.totalActions > 0 ? (count / stats.totalActions) * 100 : 0;
            return (
              <div key={tool}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-[#161817]">{tool}</span>
                  <span className="text-[#72756F] font-mono">{count} artifacts ({Math.round(pct)}%)</span>
                </div>
                <div className="w-full h-2 bg-[#F6F5F0] rounded-full overflow-hidden border border-[#DFE1D8]">
                  <div
                    className="h-full bg-[#20251F]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust & Transparency Note */}
      <div className="p-4 bg-[#F6F5F0] rounded-xl border border-[#DFE1D8] text-xs text-[#72756F] flex items-start gap-3">
        <CheckCircle2 className="w-4 h-4 text-[#5B8C5A] flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-[#161817]">No Fabricated Metrics Policy</div>
          <p className="mt-0.5 leading-relaxed">
            All tallies reflect direct artifacts saved in your browser's private storage. No synthetic vanity counters or inflated metrics are introduced.
          </p>
        </div>
      </div>
    </div>
  );
}

function SettingsView({ onClearAllData, stats, showToast }) {
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
      return;
    }
    onClearAllData();
    setConfirmClear(false);
    showToast('All local storage records have been permanently cleared');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      <div className="border-b border-[#DFE1D8] pb-4">
        <h1 className="text-2xl font-bold text-[#161817]">Settings & Governance</h1>
        <p className="text-xs text-[#72756F] mt-0.5">
          Privacy management, local storage configuration, and responsible artificial intelligence transparency.
        </p>
      </div>

      {/* Section 1: System Specs */}
      <div className="bg-white rounded-xl border border-[#DFE1D8] p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#161817]">Application Specifications</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#F6F5F0] rounded-lg border border-[#DFE1D8]">
            <span className="text-[#72756F] block text-[11px]">Engine Model</span>
            <span className="font-bold text-[#161817]">gemini-2.5-flash</span>
          </div>
          <div className="p-3 bg-[#F6F5F0] rounded-lg border border-[#DFE1D8]">
            <span className="text-[#72756F] block text-[11px]">Security Posture</span>
            <span className="font-bold text-[#5B8C5A]">No Client API Key Required</span>
          </div>
          <div className="p-3 bg-[#F6F5F0] rounded-lg border border-[#DFE1D8]">
            <span className="text-[#72756F] block text-[11px]">Storage Architecture</span>
            <span className="font-bold text-[#161817]">Client-Side LocalStorage</span>
          </div>
        </div>
      </div>

      {/* Section 2: Responsible AI Principles */}
      <div className="bg-white rounded-xl border border-[#DFE1D8] p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#D08A3C]" />
          <h2 className="text-sm font-bold text-[#161817]">Responsible AI Charter</h2>
        </div>
        <div className="text-xs text-[#72756F] leading-relaxed space-y-2">
          <p>
            <strong>Human Agency:</strong> WorkFlow AI functions as an assistive draft workbench. It does not independently dispatch emails, execute transactions, alter third-party files, or contact peers without human verification.
          </p>
          <p>
            <strong>Hallucination Awareness:</strong> Large language models can formulate inaccurate statements or imperfect summaries. All generated content is tagged with "Human review required" to encourage verification.
          </p>
          <p>
            <strong>Zero Source Fabrication:</strong> The Research Workspace does not generate fake URLs or pretend to crawl live private databases unless specifically enabled.
          </p>
        </div>
      </div>

      {/* Section 3: Data & Storage Control */}
      <div className="bg-white rounded-xl border border-[#DFE1D8] p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#161817]">Local Storage Audit & Erasure</h2>
        <p className="text-xs text-[#72756F]">
          Your prompt logs, drafts, schedules, and active tasks exist purely on your local machine.
        </p>

        <div className="p-3 bg-[#F6F5F0] rounded-lg border border-[#DFE1D8] text-xs flex justify-between items-center">
          <div>
            <span className="font-semibold text-[#161817]">Total Cached Artifacts:</span>{' '}
            <span className="font-mono text-[#72756F]">{stats.savedArtifactsCount} records</span>
          </div>
          <div>
            <span className="font-semibold text-[#161817]">Copilot Messages:</span>{' '}
            <span className="font-mono text-[#72756F]">{stats.chatCount} messages</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleClear}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              confirmClear
                ? 'bg-red-600 text-white'
                : 'bg-white border border-red-300 text-red-600 hover:bg-red-50'
            }`}
          >
            {confirmClear ? 'Click again to permanently erase all workspace data' : 'Clear All Local Data'}
          </button>
          {confirmClear && (
            <button
              onClick={() => setConfirmClear(false)}
              className="ml-3 text-xs text-[#72756F] hover:underline"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Cross-tool data transfer state
  const [emailInitial, setEmailInitial] = useState(null);

  // Local Storage state hooks
  const [history, setHistory] = useState(() => getLocalItem(STORAGE_KEYS.UNIFIED_HISTORY, []));
  const [tasks, setTasks] = useState(() =>
    getLocalItem(STORAGE_KEYS.TASKS, [
      { id: '1', name: 'Refine customer onboarding presentation', duration: '45m', urgency: 'Urgent', importance: 'Important' },
      { id: '2', name: 'Draft sprint 34 retrospective summary', duration: '30m', urgency: 'Not urgent', importance: 'Important' },
      { id: '3', name: 'Review third-party vendor licensing contracts', duration: '60m', urgency: 'Urgent', importance: 'Not important' }
    ])
  );
  const [chatMessages, setChatMessages] = useState(() =>
    getLocalItem(STORAGE_KEYS.CHAT, [
      {
        role: 'model',
        text: 'Hello. I am your WorkFlow AI workbench copilot. How can I assist you with communications, meeting audits, task planning, or research today?'
      }
    ])
  );
  const [focusSeconds, setFocusSeconds] = useState(() => getLocalItem(STORAGE_KEYS.FOCUS_STATS, 0));
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Sync to localStorage
  useEffect(() => setLocalItem(STORAGE_KEYS.UNIFIED_HISTORY, history), [history]);
  useEffect(() => setLocalItem(STORAGE_KEYS.TASKS, tasks), [tasks]);
  useEffect(() => setLocalItem(STORAGE_KEYS.CHAT, chatMessages), [chatMessages]);
  useEffect(() => setLocalItem(STORAGE_KEYS.FOCUS_STATS, focusSeconds), [focusSeconds]);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (message) => {
    setToast({ message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveToHistory = (item) => {
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      ...item
    };
    setHistory((prev) => [newEntry, ...prev]);
  };

  const handleDeleteHistoryItem = (id) => {
    setHistory((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearAllHistory = () => {
    setHistory([]);
    showToast('History cleared');
  };

  const handleAddTask = (task) => {
    setTasks((prev) => [...prev, task]);
    showToast(`Added "${task.name}"`);
  };

  const handleRemoveTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSendChatMessage = async (userText) => {
    const updated = [...chatMessages, { role: 'user', text: userText }];
    setChatMessages(updated);
    setIsChatLoading(true);

    const prompt = `
Conversation history:
${updated.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n')}

System Directive:
You are a helpful workplace assistant. Help the user with workplace communication, planning, organization, summarization, brainstorming, and productivity tasks. Be practical, clear, professional, and concise.
`;

    try {
      const reply = await callGeminiService(prompt);
      setChatMessages([...updated, { role: 'model', text: reply }]);
    } catch (err) {
      setChatMessages([
        ...updated,
        { role: 'model', text: 'I encountered an issue processing that query. Please try again.' }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleDirectToolLoad = (tool, prefill) => {
    if (tool === 'email') {
      setEmailInitial({ purpose: prefill });
      setActiveTab('email');
    } else if (tool === 'tasks') {
      setActiveTab('tasks');
    } else if (tool === 'meetings') {
      setActiveTab('meetings');
    } else if (tool === 'research') {
      setActiveTab('research');
    } else {
      setActiveTab('chat');
    }
  };

  const handleUsePrompt = (tool, promptText) => {
    if (tool === 'email') {
      setEmailInitial({ purpose: promptText });
      setActiveTab('email');
    } else if (tool === 'meetings') {
      setActiveTab('meetings');
    } else if (tool === 'tasks') {
      setActiveTab('tasks');
    } else if (tool === 'research') {
      setActiveTab('research');
    } else {
      handleSendChatMessage(promptText);
      setActiveTab('chat');
    }
    showToast(`Loaded prompt into ${tool.toUpperCase()}`);
  };

  // Aggregated live statistics
  const stats = useMemo(() => {
    const totalActions = history.length;
    const estimatedHoursSaved = (totalActions * 0.25).toFixed(1) + 'h';
    return {
      totalActions,
      estimatedHoursSaved,
      savedArtifactsCount: history.length,
      chatCount: chatMessages.length
    };
  }, [history, chatMessages]);

  /* Sidebar Navigation Sections */
  const navSections = [
    {
      label: 'HOME',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'command-center', label: 'Command Center', icon: Terminal }
      ]
    },
    {
      label: 'WORK',
      items: [
        { id: 'email', label: 'Email', icon: Mail },
        { id: 'meetings', label: 'Meetings', icon: FileText },
        { id: 'tasks', label: 'Tasks', icon: CalendarCheck },
        { id: 'research', label: 'Research', icon: Search }
      ]
    },
    {
      label: 'AI',
      items: [
        { id: 'chat', label: 'Assistant Copilot', icon: MessageSquare },
        { id: 'history', label: 'Unified History', icon: Clock },
        { id: 'prompts', label: 'Prompt Library', icon: BookOpen }
      ]
    },
    {
      label: 'INSIGHTS',
      items: [
        { id: 'productivity', label: 'Productivity', icon: BarChart2 }
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', icon: SettingsIcon }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F6F5F0] text-[#161817] flex font-sans antialiased selection:bg-[#C8F169] selection:text-[#20251F]">
      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(target) => {
          if (target === 'focus') setFocusModeOpen(true);
          else setActiveTab(target);
        }}
        tasks={tasks}
      />

      {/* Focus Mode Fullscreen Overlay */}
      <FocusModeOverlay
        isOpen={focusModeOpen}
        onClose={() => setFocusModeOpen(false)}
        tasks={tasks}
        onLogFocusTime={(secs) => {
          setFocusSeconds((prev) => prev + secs);
          showToast('Focus session logged to Insights');
        }}
      />

      {/* Left Dark Sidebar (#20251F) */}
      <aside className="hidden lg:flex flex-col w-[250px] bg-[#20251F] text-white flex-shrink-0 z-30 select-none">
        {/* Brand Header with Citrus Mark */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-6 h-6 rounded-md bg-[#C8F169] flex items-center justify-center text-[#20251F] font-bold text-xs shadow-xs">
            W
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>WorkFlow AI</span>
            </div>
            <div className="text-[10px] text-white/50 tracking-tight">Your intelligent workbench.</div>
          </div>
        </div>

        {/* Navigation Categories */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((sec, sIdx) => (
            <div key={sIdx}>
              <div className="px-3 text-[10px] uppercase font-bold tracking-widest text-white/40 mb-1.5">
                {sec.label}
              </div>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#C8F169] text-[#20251F] shadow-xs'
                          : 'text-white/80 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#20251F]' : 'text-white/60'}`} />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer Focus Mode Trigger */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => setFocusModeOpen(true)}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/90 border border-white/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Maximize2 className="w-3.5 h-3.5 text-[#C8F169]" />
              <span>Enter Focus Mode</span>
            </div>
            <span className="text-[10px] text-white/40 font-mono">25m</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 max-w-[80%] bg-[#20251F] text-white h-full flex flex-col p-4 z-10">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#C8F169] text-[#20251F] font-bold text-xs flex items-center justify-center">
                  W
                </div>
                <span className="font-bold text-sm">WorkFlow AI</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-white/70">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {navSections.map((sec, sIdx) => (
                <div key={sIdx}>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-1">
                    {sec.label}
                  </div>
                  <div className="space-y-1">
                    {sec.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
                          activeTab === item.id ? 'bg-[#C8F169] text-[#20251F]' : 'text-white/80'
                        }`}
                      >
                        <item.icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Environment (#F6F5F0) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 px-4 sm:px-8 border-b border-[#DFE1D8] bg-[#F6F5F0] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#161817] hover:bg-[#DFE1D8]/40"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-xs uppercase tracking-widest text-[#72756F] font-semibold hidden sm:block">
              Workbench / <span className="text-[#161817] font-bold capitalize">{activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Command Palette Button */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#DFE1D8] text-xs text-[#72756F] hover:text-[#161817] hover:border-[#C8F169] transition-colors shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Command Palette</span>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-[#F6F5F0] border border-[#DFE1D8] font-mono text-[#72756F]">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={() => setFocusModeOpen(true)}
              className="p-2 rounded-lg bg-white border border-[#DFE1D8] text-[#161817] hover:border-[#C8F169] transition-colors"
              title="Start Focus Timer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Workspace Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {activeTab === 'overview' && (
            <OverviewView
              onNavigate={setActiveTab}
              stats={stats}
              recentHistory={history}
              tasks={tasks}
            />
          )}

          {activeTab === 'command-center' && (
            <CommandCenterView
              onNavigate={setActiveTab}
              onDirectToolLoad={handleDirectToolLoad}
            />
          )}

          {activeTab === 'email' && (
            <EmailGeneratorView
              initialData={emailInitial}
              onSaveHistory={handleSaveToHistory}
              showToast={showToast}
            />
          )}

          {activeTab === 'meetings' && (
            <MeetingNotesView
              onSaveHistory={handleSaveToHistory}
              showToast={showToast}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskPlannerView
              tasks={tasks}
              onAddTask={handleAddTask}
              onRemoveTask={handleRemoveTask}
              onSaveHistory={handleSaveToHistory}
              showToast={showToast}
            />
          )}

          {activeTab === 'research' && (
            <ResearchAssistantView
              onSaveHistory={handleSaveToHistory}
              showToast={showToast}
            />
          )}

          {activeTab === 'chat' && (
            <ChatAssistantView
              messages={chatMessages}
              onSendMessage={handleSendChatMessage}
              onClearChat={() => {
                setChatMessages([
                  {
                    role: 'model',
                    text: 'Chat history cleared. How can I assist you now?'
                  }
                ]);
                showToast('Cleared conversation history');
              }}
              isLoading={isChatLoading}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'history' && (
            <UnifiedHistoryView
              history={history}
              onDeleteItem={handleDeleteHistoryItem}
              onClearAll={handleClearAllHistory}
              showToast={showToast}
            />
          )}

          {activeTab === 'prompts' && (
            <PromptLibraryView
              onUsePrompt={handleUsePrompt}
              showToast={showToast}
            />
          )}

          {activeTab === 'productivity' && (
            <ProductivityInsightsView
              stats={stats}
              history={history}
              focusSeconds={focusSeconds}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              onClearAllData={() => {
                setHistory([]);
                setTasks([]);
                setChatMessages([]);
                setFocusSeconds(0);
              }}
              stats={stats}
              showToast={showToast}
            />
          )}
        </main>

        {/* Persistent Responsible AI Footer */}
        <footer className="border-t border-[#DFE1D8] bg-[#F6F5F0] py-2 px-6 flex items-center justify-between text-[11px] text-[#72756F] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B8C5A]" />
            <span>AI outputs are assistive drafts. Review before sharing.</span>
          </div>
          <div className="hidden sm:block">WorkFlow AI • Version 2.0 (Midnight Citrus)</div>
        </footer>
      </div>
    </div>
  );
}
// Run from your project root:  node fix-types.cjs
// Adds TypeScript types to src/App.tsx so that "tsc -b && vite build" passes.
const fs = require('fs');
const FILE = process.argv[2] || 'src/App.tsx';

let raw = fs.readFileSync(FILE, 'utf8');
const crlf = raw.includes('\r\n');
let src = raw.replace(/\r\n/g, '\n');
let failed = 0;

function rep(oldStr, newStr) {
  const n = src.split(oldStr).length - 1;
  if (n !== 1) {
    failed++;
    console.log(`  NOT APPLIED (found ${n}x): ${oldStr.slice(0, 70).replace(/\n/g, '\\n')}`);
    return;
  }
  src = src.replace(oldStr, () => newStr);
}

// 1. Shared types + helper
rep('function getLocalItem(key, defaultValue) {', `// ---------- Shared types ----------
interface ToastData {
  message: string;
}

interface Task {
  id: string;
  name: string;
  duration: string;
  urgency: string;
  importance: string;
}

interface HistoryItem {
  id: string;
  date: string;
  tool: string;
  title: string;
  content: string;
  meta?: Record<string, unknown>;
}

type NewHistoryItem = Omit<HistoryItem, 'id' | 'date'>;

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface Stats {
  totalActions: number;
  estimatedHoursSaved: string;
  savedArtifactsCount: number;
  chatCount: number;
}

interface RouteResult {
  tool: string;
  reasoning: string;
  prefill: string;
}

interface EmailInitial {
  purpose?: string;
  audience?: string;
  tone?: string;
  keyPoints?: string;
}

interface MeetingOutput {
  summary: string;
  decisions?: string[];
  actionItems?: { task: string; owner: string; deadline: string }[];
  openQuestions?: string[];
}

interface ResearchOutput {
  overview: string;
  keyFindings?: string[];
  importantConcepts?: string[];
  recommendations?: string[];
}

type ShowToast = (message: string) => void;
type SaveHistory = (item: NewHistoryItem) => void;
type Navigate = (tab: string) => void;

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function getLocalItem<T>(key: string, defaultValue: T): T {`);
rep('function setLocalItem(key, val) {', 'function setLocalItem(key: string, val: unknown): void {');

// 2. Error messages
let count = 0;
src = src.replace(/err\.message \|\| ('(?:[^'\\]|\\.)*')\)/g, (_m, s) => { count++; return `getErrorMessage(err, ${s}))`; });
console.log(`  error-message fixes: ${count}`);

// 3. Component signatures
rep('function Toast({ toast, onClose }) {',
  'function Toast({ toast, onClose }: { toast: ToastData | null; onClose: () => void }) {');
rep("function HumanReviewBadge({ className = '' }) {",
  "function HumanReviewBadge({ className = '' }: { className?: string }) {");
rep("function CommandPalette({ isOpen, onClose, onNavigate, tasks, onRunCommand }) {\n  const [query, setQuery] = useState('');\n  const inputRef = useRef(null);",
  "function CommandPalette({\n  isOpen,\n  onClose,\n  onNavigate\n}: {\n  isOpen: boolean;\n  onClose: () => void;\n  onNavigate: Navigate;\n  tasks?: Task[];\n}) {\n  const [query, setQuery] = useState('');\n  const inputRef = useRef<HTMLInputElement>(null);");
rep('function FocusModeOverlay({ isOpen, onClose, tasks, onLogFocusTime }) {',
  'function FocusModeOverlay({\n  isOpen,\n  onClose,\n  tasks,\n  onLogFocusTime\n}: {\n  isOpen: boolean;\n  onClose: () => void;\n  tasks: Task[];\n  onLogFocusTime: (secs: number) => void;\n}) {');
rep('    let interval = null;', '    let interval: ReturnType<typeof setInterval> | null = null;');
rep('    return () => clearInterval(interval);', '    return () => {\n      if (interval) clearInterval(interval);\n    };');

rep('function CommandCenterView({ onNavigate, onDirectToolLoad }) {',
  'function CommandCenterView({\n  onDirectToolLoad\n}: {\n  onNavigate?: Navigate;\n  onDirectToolLoad: (tool: string, prefill: string) => void;\n}) {');
rep('  const [routeResult, setRouteResult] = useState(null);\n  const [error, setError] = useState(null);\n\n  const suggestedCommands',
  '  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);\n  const [error, setError] = useState<string | null>(null);\n\n  const suggestedCommands');
rep('const handleRoute = async (textToRoute) => {', 'const handleRoute = async (textToRoute?: string) => {');

rep('function OverviewView({ onNavigate, stats, recentHistory, tasks }) {',
  'function OverviewView({\n  onNavigate,\n  stats,\n  recentHistory,\n  tasks\n}: {\n  onNavigate: Navigate;\n  stats: Stats;\n  recentHistory: HistoryItem[];\n  tasks: Task[];\n}) {');

rep('function EmailGeneratorView({ initialData, onSaveHistory, showToast }) {',
  'function EmailGeneratorView({\n  initialData,\n  onSaveHistory,\n  showToast\n}: {\n  initialData: EmailInitial | null;\n  onSaveHistory: SaveHistory;\n  showToast: ShowToast;\n}) {');
rep('  const [isLoading, setIsLoading] = useState(false);\n  const [error, setError] = useState(null);\n  const [subject, setSubject]',
  '  const [isLoading, setIsLoading] = useState(false);\n  const [error, setError] = useState<string | null>(null);\n  const [subject, setSubject]');

rep('function MeetingNotesView({ onSaveHistory, showToast }) {',
  'function MeetingNotesView({\n  onSaveHistory,\n  showToast\n}: {\n  onSaveHistory: SaveHistory;\n  showToast: ShowToast;\n}) {');
rep('  const [error, setError] = useState(null);\n  const [structuredOutput, setStructuredOutput] = useState(null);',
  '  const [error, setError] = useState<string | null>(null);\n  const [structuredOutput, setStructuredOutput] = useState<MeetingOutput | null>(null);');
rep('{structuredOutput.openQuestions?.length > 0 && (', '{(structuredOutput.openQuestions?.length ?? 0) > 0 && (');
rep('{structuredOutput.openQuestions.map((q, i) => (', '{structuredOutput.openQuestions?.map((q, i) => (');

rep('function TaskPlannerView({ tasks, onAddTask, onRemoveTask, onSaveHistory, showToast }) {',
  'function TaskPlannerView({\n  tasks,\n  onAddTask,\n  onRemoveTask,\n  onSaveHistory,\n  showToast\n}: {\n  tasks: Task[];\n  onAddTask: (task: Task) => void;\n  onRemoveTask: (id: string) => void;\n  onSaveHistory: SaveHistory;\n  showToast: ShowToast;\n}) {');
rep("  const [aiSchedule, setAiSchedule] = useState('');\n  const [error, setError] = useState(null);",
  "  const [aiSchedule, setAiSchedule] = useState('');\n  const [error, setError] = useState<string | null>(null);");
rep('const handleSubmitTask = (e) => {', 'const handleSubmitTask = (e: React.FormEvent) => {');

rep('function ResearchAssistantView({ onSaveHistory, showToast }) {',
  'function ResearchAssistantView({\n  onSaveHistory,\n  showToast\n}: {\n  onSaveHistory: SaveHistory;\n  showToast: ShowToast;\n}) {');
rep('  const [error, setError] = useState(null);\n  const [researchOutput, setResearchOutput] = useState(null);',
  '  const [error, setError] = useState<string | null>(null);\n  const [researchOutput, setResearchOutput] = useState<ResearchOutput | null>(null);');

rep("function ChatAssistantView({ messages, onSendMessage, onClearChat, isLoading, onNavigate }) {\n  const [inputVal, setInputVal] = useState('');\n  const chatBottomRef = useRef(null);",
  "function ChatAssistantView({\n  messages,\n  onSendMessage,\n  onClearChat,\n  isLoading,\n  onNavigate\n}: {\n  messages: ChatMessage[];\n  onSendMessage: (text: string) => void;\n  onClearChat: () => void;\n  isLoading: boolean;\n  onNavigate: Navigate;\n}) {\n  const [inputVal, setInputVal] = useState('');\n  const chatBottomRef = useRef<HTMLDivElement>(null);");
rep('const handleSend = (e) => {', 'const handleSend = (e: React.FormEvent) => {');

rep('function UnifiedHistoryView({ history, onDeleteItem, onClearAll, showToast }) {',
  'function UnifiedHistoryView({\n  history,\n  onDeleteItem,\n  onClearAll,\n  showToast\n}: {\n  history: HistoryItem[];\n  onDeleteItem: (id: string) => void;\n  onClearAll: () => void;\n  showToast: ShowToast;\n}) {');
rep('  const [viewItem, setViewItem] = useState(null);', '  const [viewItem, setViewItem] = useState<HistoryItem | null>(null);');

rep('function PromptLibraryView({ onUsePrompt, showToast }) {',
  'function PromptLibraryView({\n  onUsePrompt,\n  showToast\n}: {\n  onUsePrompt: (tool: string, promptText: string) => void;\n  showToast: ShowToast;\n}) {');

rep('function ProductivityInsightsView({ stats, history, focusSeconds }) {',
  'function ProductivityInsightsView({\n  stats,\n  history,\n  focusSeconds\n}: {\n  stats: Stats;\n  history: HistoryItem[];\n  focusSeconds: number;\n}) {');
rep('  const toolCounts = history.reduce((acc, item) => {', '  const toolCounts = history.reduce<Record<string, number>>((acc, item) => {');

rep('function SettingsView({ onClearAllData, stats, showToast }) {',
  'function SettingsView({\n  onClearAllData,\n  stats,\n  showToast\n}: {\n  onClearAllData: () => void;\n  stats: Stats;\n  showToast: ShowToast;\n}) {');

// 4. App component
rep('  const [toast, setToast] = useState(null);', '  const [toast, setToast] = useState<ToastData | null>(null);');
rep('  const [emailInitial, setEmailInitial] = useState(null);', '  const [emailInitial, setEmailInitial] = useState<EmailInitial | null>(null);');
rep('useState(() => getLocalItem(STORAGE_KEYS.UNIFIED_HISTORY, []));',
  'useState<HistoryItem[]>(() => getLocalItem<HistoryItem[]>(STORAGE_KEYS.UNIFIED_HISTORY, []));');
rep('  const [tasks, setTasks] = useState(() =>\n    getLocalItem(STORAGE_KEYS.TASKS, [',
  '  const [tasks, setTasks] = useState<Task[]>(() =>\n    getLocalItem<Task[]>(STORAGE_KEYS.TASKS, [');
rep('  const [chatMessages, setChatMessages] = useState(() =>\n    getLocalItem(STORAGE_KEYS.CHAT, [',
  '  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>\n    getLocalItem<ChatMessage[]>(STORAGE_KEYS.CHAT, [');
rep('useState(() => getLocalItem(STORAGE_KEYS.FOCUS_STATS, 0));',
  'useState<number>(() => getLocalItem<number>(STORAGE_KEYS.FOCUS_STATS, 0));');
rep('const handleKeyDown = (e) => {', 'const handleKeyDown = (e: KeyboardEvent) => {');
rep('const showToast = (message) => {', 'const showToast: ShowToast = (message) => {');
rep('const handleSaveToHistory = (item) => {', 'const handleSaveToHistory: SaveHistory = (item) => {');
rep('const handleDeleteHistoryItem = (id) => {', 'const handleDeleteHistoryItem = (id: string) => {');
rep('const handleAddTask = (task) => {', 'const handleAddTask = (task: Task) => {');
rep('const handleRemoveTask = (id) => {', 'const handleRemoveTask = (id: string) => {');
rep("const handleSendChatMessage = async (userText) => {\n    const updated = [...chatMessages, { role: 'user', text: userText }];",
  "const handleSendChatMessage = async (userText: string) => {\n    const updated: ChatMessage[] = [...chatMessages, { role: 'user', text: userText }];");
rep('const handleDirectToolLoad = (tool, prefill) => {', 'const handleDirectToolLoad = (tool: string, prefill: string) => {');
rep('const handleUsePrompt = (tool, promptText) => {', 'const handleUsePrompt = (tool: string, promptText: string) => {');
rep('        onNavigate={(target) => {\n          if (target === \'focus\')', '        onNavigate={(target: string) => {\n          if (target === \'focus\')');
rep('        onLogFocusTime={(secs) => {', '        onLogFocusTime={(secs: number) => {');

// 5. Unused imports (Vite's tsconfig treats these as errors)
for (const name of ['Check', 'Filter', 'Sliders', 'ExternalLink']) rep(`  ${name},\n`, '');
rep('  ChevronRight,\n  ChevronDown\n}', '  ChevronRight\n}');

if (failed === 0) {
  fs.writeFileSync(FILE, crlf ? src.replace(/\n/g, '\r\n') : src, 'utf8');
  console.log('Done: all fixes applied.');
} else {
  console.log(`${failed} fix(es) could not be applied, so the file was left UNCHANGED.`);
  process.exit(1);
}
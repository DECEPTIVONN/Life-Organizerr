import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  Sparkles,
  Clock,
  Calendar,
  Repeat,
  Plus,
  Play,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  Copy,
  Check,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Zap,
  Info,
  ChevronRight
} from 'lucide-react';
import { AutoPromptSchedule, AgentConversation, AgentMessage } from '../types';
import { parseAutoPromptSchedule } from '../utils/autoPromptParser';

interface AgentesViewProps {
  autoPrompts: AutoPromptSchedule[];
  setAutoPrompts: React.Dispatch<React.SetStateAction<AutoPromptSchedule[]>>;
  conversations: AgentConversation[];
  setConversations: React.Dispatch<React.SetStateAction<AgentConversation[]>>;
  onExecutePromptNow: (schedule: AutoPromptSchedule) => Promise<void>;
  selectedConversationId?: string;
  setSelectedConversationId?: (id: string) => void;
}

export const AgentesView: React.FC<AgentesViewProps> = ({
  autoPrompts,
  setAutoPrompts,
  conversations,
  setConversations,
  onExecutePromptNow,
  selectedConversationId,
  setSelectedConversationId,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'prompts' | 'conversas'>('prompts');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // Form states
  const [quickInput, setQuickInput] = useState<string>('');
  const [promptText, setPromptText] = useState<string>('');
  const [titleText, setTitleText] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [scheduledTime, setScheduledTime] = useState<string>('15:00');
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [isExecutingId, setIsExecutingId] = useState<string | null>(null);

  // Chat conversation state
  const activeConversation = conversations.find(c => c.id === selectedConversationId) || conversations[0] || null;
  const [chatInput, setChatInput] = useState<string>('');
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter state for prompts
  const [promptFilter, setPromptFilter] = useState<'todos' | 'ativos' | 'pausados'>('todos');
  const [searchPrompt, setSearchPrompt] = useState<string>('');

  // Handle parsing when typing in quick input
  const handleQuickInputChange = (val: string) => {
    setQuickInput(val);
    if (val.includes('(') && val.includes(')')) {
      const parsed = parseAutoPromptSchedule(val);
      setPromptText(parsed.cleanPrompt);
      setScheduledDate(parsed.date);
      setScheduledTime(parsed.time);
      setRecurrence(parsed.recurrence);
    } else {
      setPromptText(val);
    }
  };

  const handleOpenCreateModal = (presetPrompt?: string) => {
    setEditingScheduleId(null);
    if (presetPrompt) {
      setQuickInput(presetPrompt);
      const parsed = parseAutoPromptSchedule(presetPrompt);
      setPromptText(parsed.cleanPrompt);
      setScheduledDate(parsed.date);
      setScheduledTime(parsed.time);
      setRecurrence(parsed.recurrence);
      setTitleText('');
    } else {
      setQuickInput('');
      setPromptText('');
      setTitleText('');
      const d = new Date();
      setScheduledDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      setScheduledTime('15:00');
      setRecurrence('daily');
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (schedule: AutoPromptSchedule) => {
    setEditingScheduleId(schedule.id);
    setQuickInput(schedule.rawInput || schedule.prompt);
    setPromptText(schedule.prompt);
    setTitleText(schedule.title || '');
    setScheduledDate(schedule.date);
    setScheduledTime(schedule.time);
    setRecurrence(schedule.recurrence);
    setIsModalOpen(true);
  };

  const handleSaveSchedule = () => {
    if (!promptText.trim()) return;

    if (editingScheduleId) {
      setAutoPrompts(prev =>
        prev.map(item =>
          item.id === editingScheduleId
            ? {
                ...item,
                title: titleText.trim() || promptText.slice(0, 40),
                prompt: promptText.trim(),
                rawInput: quickInput.trim(),
                date: scheduledDate,
                time: scheduledTime,
                recurrence,
              }
            : item
        )
      );
    } else {
      const newSchedule: AutoPromptSchedule = {
        id: 'ap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        title: titleText.trim() || promptText.slice(0, 40),
        prompt: promptText.trim(),
        rawInput: quickInput.trim(),
        date: scheduledDate,
        time: scheduledTime,
        recurrence,
        active: true,
        runCount: 0,
        createdAt: new Date().toISOString(),
      };
      setAutoPrompts(prev => [newSchedule, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Deseja realmente excluir este prompt automático?')) {
      setAutoPrompts(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setAutoPrompts(prev =>
      prev.map(item => (item.id === id ? { ...item, active: !item.active } : item))
    );
  };

  const handleRunNow = async (schedule: AutoPromptSchedule) => {
    try {
      setIsExecutingId(schedule.id);
      await onExecutePromptNow(schedule);
    } finally {
      setIsExecutingId(null);
    }
  };

  const handleSendManualMessage = async () => {
    if (!chatInput.trim() || !activeConversation || isSendingChat) return;

    const userMessage: AgentMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date().toISOString(),
    };

    const targetConvId = activeConversation.id;
    const updatedMessages = [...activeConversation.messages, userMessage];

    // Optimistically update conversation
    setConversations(prev =>
      prev.map(c =>
        c.id === targetConvId
          ? { ...c, messages: updatedMessages, updatedAt: new Date().toISOString() }
          : c
      )
    );
    setChatInput('');
    setIsSendingChat(true);

    try {
      const res = await fetch('/api/agent/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage.content,
          conversationHistory: updatedMessages,
        }),
      });

      const data = await res.json();
      const assistantMessage: AgentMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'assistant',
        content: data.response || 'Prompt processado com sucesso.',
        timestamp: new Date().toISOString(),
      };

      setConversations(prev =>
        prev.map(c =>
          c.id === targetConvId
            ? { ...c, messages: [...updatedMessages, assistantMessage], updatedAt: new Date().toISOString() }
            : c
        )
      );
    } catch (err: any) {
      const errorMsg: AgentMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'assistant',
        content: `Erro ao responder: ${err.message || 'Falha na conexão.'}`,
        timestamp: new Date().toISOString(),
      };
      setConversations(prev =>
        prev.map(c =>
          c.id === targetConvId
            ? { ...c, messages: [...updatedMessages, errorMsg], updatedAt: new Date().toISOString() }
            : c
        )
      );
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleNewManualChat = () => {
    const newChat: AgentConversation = {
      id: 'conv_' + Date.now(),
      title: 'Nova Conversa',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'welcome_' + Date.now(),
          role: 'assistant',
          content: 'Olá! Como posso ajudar você hoje com seus projetos, tarefas ou rotinas?',
          timestamp: new Date().toISOString(),
        },
      ],
      isAutomatedPrompt: false,
    };
    setConversations(prev => [newChat, ...prev]);
    if (setSelectedConversationId) {
      setSelectedConversationId(newChat.id);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPrompts = autoPrompts.filter(p => {
    if (promptFilter === 'ativos' && !p.active) return false;
    if (promptFilter === 'pausados' && p.active) return false;
    if (searchPrompt.trim()) {
      const q = searchPrompt.toLowerCase();
      return (p.title && p.title.toLowerCase().includes(q)) || p.prompt.toLowerCase().includes(q);
    }
    return true;
  });

  const recurrenceBadge: Record<string, { label: string; color: string }> = {
    none: { label: 'Uma vez', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
    daily: { label: 'Diariamente', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
    weekly: { label: 'Semanalmente', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    monthly: { label: 'Mensalmente', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
    yearly: { label: 'Anualmente', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-zinc-950/90 backdrop-blur-md border border-orange-500/20 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <Bot className="h-6 w-6 text-orange-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Agente & Prompts Automáticos
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Gemini Flash + Entalhe
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
                Configure prompts que disparam sozinhos em data e horário programados. As respostas aparecem no entalhe no formato <strong className="text-orange-400 font-mono">Agent: (resposta)</strong> e geram novas conversas em segundo plano sem interromper seu fluxo.
              </p>
            </div>
          </div>

          {/* Subtabs Switcher */}
          <div className="flex items-center gap-2 bg-zinc-950/80 p-1.5 rounded-2xl border border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubTab('prompts')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'prompts'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Prompts Programados</span>
              <span className="px-1.5 py-0.2 rounded-md bg-zinc-900/60 text-[10px] font-mono">
                {autoPrompts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('conversas')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'conversas'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Conversas do Agente</span>
              <span className="px-1.5 py-0.2 rounded-md bg-zinc-900/60 text-[10px] font-mono">
                {conversations.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: PROMPTS AUTOMÁTICOS */}
      {activeSubTab === 'prompts' && (
        <div className="space-y-6">
          {/* Quick Presets / Examples Guide */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Exemplos Prontos (Clique para usar ou testar):</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleOpenCreateModal('(todo dias as 15hrs) pesquise e informe a temperatura e previsão do tempo para São Paulo')}
                className="text-left p-3 rounded-xl bg-zinc-950/60 hover:bg-orange-500/10 border border-zinc-800 hover:border-orange-500/30 transition-all text-xs group cursor-pointer"
              >
                <div className="flex items-center justify-between text-zinc-400 group-hover:text-orange-400 text-[10px] font-mono mb-1">
                  <span>Previsão Diária</span>
                  <Plus className="h-3 w-3" />
                </div>
                <p className="text-zinc-200 line-clamp-2">
                  (todo dias as 15hrs) pesquise e informe a temperatura e previsão do tempo para São Paulo
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleOpenCreateModal('(todo dia 15 de dezembro as 7hrs) me lembre: hoje é aniversário de João Inácio , lembre-se de dar parabéns pra ele')}
                className="text-left p-3 rounded-xl bg-zinc-950/60 hover:bg-orange-500/10 border border-zinc-800 hover:border-orange-500/30 transition-all text-xs group cursor-pointer"
              >
                <div className="flex items-center justify-between text-zinc-400 group-hover:text-orange-400 text-[10px] font-mono mb-1">
                  <span>Aniversário Anual</span>
                  <Plus className="h-3 w-3" />
                </div>
                <p className="text-zinc-200 line-clamp-2">
                  (todo dia 15 de dezembro as 7hrs) me lembre: hoje é aniversário de João Inácio , lembre-se de dar parabéns pra ele
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleOpenCreateModal('(dia 28/10 não repetir) me lembre de fazer compras no mercado')}
                className="text-left p-3 rounded-xl bg-zinc-950/60 hover:bg-orange-500/10 border border-zinc-800 hover:border-orange-500/30 transition-all text-xs group cursor-pointer"
              >
                <div className="flex items-center justify-between text-zinc-400 group-hover:text-orange-400 text-[10px] font-mono mb-1">
                  <span>Lembrete Único</span>
                  <Plus className="h-3 w-3" />
                </div>
                <p className="text-zinc-200 line-clamp-2">
                  (dia 28/10 não repetir) me lembre de fazer compras no mercado
                </p>
              </button>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3.5">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setPromptFilter('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  promptFilter === 'todos'
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                Todos ({autoPrompts.length})
              </button>
              <button
                type="button"
                onClick={() => setPromptFilter('ativos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  promptFilter === 'ativos'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                Ativos ({autoPrompts.filter(p => p.active).length})
              </button>
              <button
                type="button"
                onClick={() => setPromptFilter('pausados')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  promptFilter === 'pausados'
                    ? 'bg-zinc-700 text-white'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                Pausados ({autoPrompts.filter(p => !p.active).length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar prompts..."
                  value={searchPrompt}
                  onChange={e => setSearchPrompt(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="button"
                onClick={() => handleOpenCreateModal()}
                className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>+ Novo Prompt Automático</span>
              </button>
            </div>
          </div>

          {/* Prompts Cards List */}
          {filteredPrompts.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 flex items-center justify-center mx-auto text-zinc-500">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">Nenhum prompt automático encontrado</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Crie um prompt automático para o agente pesquisar o clima, lembrar de aniversários ou executar comandos em horários programados.
              </p>
              <button
                type="button"
                onClick={() => handleOpenCreateModal()}
                className="mt-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Criar Primeiro Prompt Automático</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPrompts.map(schedule => {
                const badge = recurrenceBadge[schedule.recurrence] || recurrenceBadge.none;
                const isRunning = isExecutingId === schedule.id;

                return (
                  <div
                    key={schedule.id}
                    className={`bg-zinc-950/80 border rounded-2xl p-4 sm:p-5 transition-all shadow-lg flex flex-col justify-between ${
                      schedule.active
                        ? 'border-zinc-800/80 hover:border-orange-500/40 shadow-orange-500/5'
                        : 'border-zinc-900 opacity-65'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-orange-400" />
                            {schedule.time}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {schedule.date}
                          </span>
                        </div>

                        {/* Active Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(schedule.id)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                            schedule.active ? 'bg-orange-500' : 'bg-zinc-800'
                          }`}
                          title={schedule.active ? 'Pausar prompt' : 'Ativar prompt'}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              schedule.active ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Prompt Content */}
                      <div>
                        {schedule.title && (
                          <h4 className="text-sm font-bold text-white mb-1">{schedule.title}</h4>
                        )}
                        <p className="text-xs text-zinc-300 font-sans leading-relaxed bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/60">
                          {schedule.prompt}
                        </p>
                      </div>

                      {/* Last Execution Info */}
                      {schedule.lastRunAt && (
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-mono pt-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span>Última execução: {new Date(schedule.lastRunAt).toLocaleString('pt-BR')}</span>
                          <span className="text-zinc-600">({schedule.runCount}x)</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between gap-2 pt-4 mt-3 border-t border-zinc-800/60">
                      <button
                        type="button"
                        onClick={() => handleRunNow(schedule)}
                        disabled={isRunning}
                        className="px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 hover:text-orange-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        title="Executa o prompt agora mesmo para testar o entalhe e a nova conversa"
                      >
                        {isRunning ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>Executando...</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 fill-orange-400" />
                            <span>Executar Agora</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(schedule)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Editar agendamento"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Excluir prompt"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: CONVERSAS COM O AGENTE */}
      {activeSubTab === 'conversas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[650px]">
          {/* Left Column: Conversations History List */}
          <div className="lg:col-span-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Conversas</h3>
              </div>
              <button
                type="button"
                onClick={handleNewManualChat}
                className="px-2.5 py-1 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nova</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
              {conversations.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-xs">
                  Nenhuma conversa registrada ainda.
                </div>
              ) : (
                conversations.map(conv => {
                  const isSelected = activeConversation?.id === conv.id;
                  const lastMsg = conv.messages[conv.messages.length - 1];

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setSelectedConversationId && setSelectedConversationId(conv.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-orange-500/15 border-orange-500/40 text-white shadow-md shadow-orange-500/5'
                          : 'bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800/80 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full">
                        <span className="text-xs font-bold truncate max-w-[170px]">{conv.title}</span>
                        {conv.isAutomatedPrompt && (
                          <span className="px-1.5 py-0.2 rounded-full text-[8px] font-mono bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            Auto
                          </span>
                        )}
                      </div>
                      {lastMsg && (
                        <p className="text-[11px] text-zinc-400 truncate w-full">
                          {lastMsg.role === 'assistant' ? 'Agent: ' : 'Você: '}
                          {lastMsg.content}
                        </p>
                      )}
                      <div className="text-[9px] font-mono text-zinc-500">
                        {new Date(conv.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Chat Feed */}
          <div className="lg:col-span-8 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex flex-col h-full overflow-hidden">
            {activeConversation ? (
              <>
                {/* Chat Top Bar */}
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                        <span>{activeConversation.title}</span>
                        {activeConversation.isAutomatedPrompt && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-orange-500/15 text-orange-400 border border-orange-500/30">
                            Iniciada por Prompt Automático
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        Criada em {new Date(activeConversation.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Thread */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {activeConversation.messages.map(msg => {
                    const isAssistant = msg.role === 'assistant';

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-3xl ${isAssistant ? 'justify-start' : 'justify-end ml-auto'}`}
                      >
                        {isAssistant && (
                          <div className="w-7 h-7 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 mt-1">
                            <Bot className="h-3.5 w-3.5" />
                          </div>
                        )}

                        <div
                          className={`rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed relative group ${
                            isAssistant
                              ? 'bg-zinc-900/90 text-zinc-100 border border-zinc-800 shadow-md'
                              : 'bg-orange-500 text-white rounded-br-xs shadow-md shadow-orange-500/20'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.content}</div>

                          <div className="flex items-center justify-between gap-3 mt-2 text-[10px] opacity-75 font-mono">
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(msg.content, msg.id)}
                              className="hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer"
                              title="Copiar texto"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="h-2.5 w-2.5 text-emerald-300" />
                                  <span>Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-2.5 w-2.5" />
                                  <span>Copiar</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Chat Input Bar */}
                <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-900/30 flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendManualMessage();
                      }
                    }}
                    placeholder="Envie uma mensagem ou continue a conversa com o agente..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleSendManualMessage}
                    disabled={!chatInput.trim() || isSendingChat}
                    className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-md shadow-orange-500/30 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingChat ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-xs">
                Selecione ou inicie uma conversa para visualizar.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT AUTOMATIC PROMPT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 max-w-xl w-full relative z-10 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {editingScheduleId ? 'Editar Prompt Automático' : 'Novo Prompt Automático'}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Disparo programado para o agente com resposta instantânea no entalhe.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Natural language Quick Input helper */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Entrada Rápida com Parênteses (Opcional):</span>
                </label>
                <input
                  type="text"
                  value={quickInput}
                  onChange={e => handleQuickInputChange(e.target.value)}
                  placeholder="Ex: (todo dias as 15hrs) pesquise e informe a temperatura para São Paulo"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                />
                <p className="text-[10px] text-zinc-500">
                  Dica: Se usar parênteses com hora e frequência, o sistema preenche a data e repetição automaticamente.
                </p>
              </div>

              {/* Explicit Form Fields */}
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Título / Identificador (Opcional):
                  </label>
                  <input
                    type="text"
                    value={titleText}
                    onChange={e => setTitleText(e.target.value)}
                    placeholder="Ex: Previsão Diária SP"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Conteúdo do Prompt Enviado ao Agente: *
                  </label>
                  <textarea
                    rows={3}
                    value={promptText}
                    onChange={e => setPromptText(e.target.value)}
                    placeholder="Digite a instrução ou pergunta para o agente..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Data de Execução:
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Horário:
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={e => setScheduledTime(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Repetição:
                    </label>
                    <select
                      value={recurrence}
                      onChange={e => setRecurrence(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="none">Não repetir (única vez)</option>
                      <option value="daily">Diariamente</option>
                      <option value="weekly">Semanalmente</option>
                      <option value="monthly">Mensalmente</option>
                      <option value="yearly">Anualmente</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  disabled={!promptText.trim()}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-lg shadow-orange-500/25 cursor-pointer disabled:opacity-50"
                >
                  {editingScheduleId ? 'Salvar Alterações' : 'Criar Prompt Automático'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

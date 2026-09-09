import React from 'react';
import {
  Flame,
  Zap,
  Dumbbell,
  Mountain,
  Brain,
  Feather,
  TrendingUp,
  Coins,
  Target,
  Trophy,
  Crown,
  Shield,
  Swords,
  Sparkles,
  Lightbulb,
  Rocket,
  Sun,
  Heart,
  Compass,
  BookOpen,
  Eye,
  Gem,
  Clock,
  Activity,
  Award,
  Wallet
} from 'lucide-react';

export interface CardIconOption {
  name: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const AVAILABLE_CARD_ICONS: CardIconOption[] = [
  { name: 'Flame', label: 'Poder & Chama', icon: Flame },
  { name: 'Zap', label: 'Energia & Foco', icon: Zap },
  { name: 'Dumbbell', label: 'Força & Treino', icon: Dumbbell },
  { name: 'Mountain', label: 'Disciplina & Firmeza', icon: Mountain },
  { name: 'Brain', label: 'Estratégia & Mente', icon: Brain },
  { name: 'Feather', label: 'Paz & Serenidade', icon: Feather },
  { name: 'TrendingUp', label: 'Prosperidade & Alta', icon: TrendingUp },
  { name: 'Coins', label: 'Riqueza & Finanças', icon: Coins },
  { name: 'Target', label: 'Alvo & Precisão', icon: Target },
  { name: 'Trophy', label: 'Vitória & Conquista', icon: Trophy },
  { name: 'Crown', label: 'Liderança & Império', icon: Crown },
  { name: 'Shield', label: 'Blindagem & Proteção', icon: Shield },
  { name: 'Swords', label: 'Combate & Desafio', icon: Swords },
  { name: 'Sparkles', label: 'Excelência & Brilho', icon: Sparkles },
  { name: 'Lightbulb', label: 'Criatividade & Visão', icon: Lightbulb },
  { name: 'Rocket', label: 'Aceleração & Impacto', icon: Rocket },
  { name: 'Sun', label: 'Clube das 5h & Clareza', icon: Sun },
  { name: 'Heart', label: 'Vitalidade & Saúde', icon: Heart },
  { name: 'Compass', label: 'Direção & Propósito', icon: Compass },
  { name: 'BookOpen', label: 'Sabedoria & Estudo', icon: BookOpen }
];

export const CARD_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  // Lucide Names (normalized lowercase)
  flame: Flame,
  zap: Zap,
  dumbbell: Dumbbell,
  mountain: Mountain,
  brain: Brain,
  feather: Feather,
  trendingup: TrendingUp,
  coins: Coins,
  target: Target,
  trophy: Trophy,
  crown: Crown,
  shield: Shield,
  swords: Swords,
  sparkles: Sparkles,
  lightbulb: Lightbulb,
  rocket: Rocket,
  sun: Sun,
  heart: Heart,
  compass: Compass,
  bookopen: BookOpen,
  eye: Eye,
  gem: Gem,
  clock: Clock,
  activity: Activity,
  award: Award,
  wallet: Wallet,

  // Fallback mappings for old emojis:
  '☠️': Flame,
  '☠': Flame,
  '💪': Dumbbell,
  '⛰️': Mountain,
  '⛰': Mountain,
  '🧠': Brain,
  '🕊️': Feather,
  '🕊': Feather,
  '🤑': TrendingUp,
  '⭐': Sparkles,
  '✨': Sparkles,
  '🔥': Flame,
  '⚡': Zap,
  '🎯': Target,
  '🏆': Trophy,
  '👑': Crown,
  '🛡️': Shield,
  '🛡': Shield,
  '⚔️': Swords,
  '⚔': Swords,
  '💰': Coins,
  '💵': Coins,
  '💎': Gem,
  '💡': Lightbulb,
  '🚀': Rocket,
  '☀️': Sun,
  '❤️': Heart,
  '📚': BookOpen,
  '👁️': Eye,
  '👁': Eye
};

export function getCardIconComponent(iconOrEmoji?: string): React.ComponentType<{ className?: string }> {
  if (!iconOrEmoji) return Sparkles;
  const key = iconOrEmoji.toLowerCase().replace(/[\s_-]/g, '');
  if (CARD_ICON_MAP[key]) return CARD_ICON_MAP[key];
  if (CARD_ICON_MAP[iconOrEmoji]) return CARD_ICON_MAP[iconOrEmoji];
  return Sparkles;
}

export function normalizeCardIconName(iconOrEmoji?: string): string {
  if (!iconOrEmoji) return 'Sparkles';
  const match = AVAILABLE_CARD_ICONS.find(
    opt => opt.name.toLowerCase() === iconOrEmoji.toLowerCase()
  );
  if (match) return match.name;

  // Check emoji map
  const mappedComp = CARD_ICON_MAP[iconOrEmoji] || CARD_ICON_MAP[iconOrEmoji.toLowerCase().replace(/[\s_-]/g, '')];
  if (mappedComp) {
    const found = AVAILABLE_CARD_ICONS.find(opt => opt.icon === mappedComp);
    if (found) return found.name;
  }
  return 'Sparkles';
}

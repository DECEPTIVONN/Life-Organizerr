// src/components/LeagueRankingModal.tsx

import React from 'react';
import { LeagueRankingView } from './LeagueRankingView';

interface LeagueRankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  xpTotal: number;
  level: number;
  userName?: string;
  addXp?: (amount: number, reason: string) => void;
}

export const LeagueRankingModal: React.FC<LeagueRankingModalProps> = ({
  isOpen,
  onClose,
  xpTotal,
  level,
  userName = 'Você',
  addXp
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full h-full max-h-screen overflow-y-auto">
        <LeagueRankingView 
          xpTotal={xpTotal}
          level={level}
          userName={userName}
          addXp={addXp}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

'use client';

import Card from './Card';

interface PlayerHandProps {
  cards: number[];
  playerIndex: number;
  onPlayCard: (cardIndex: number) => void;
}

export default function PlayerHand({ cards, playerIndex, onPlayCard }: PlayerHandProps) {
  return (
    <div className="player-hand">
      <h3>Jogador {playerIndex + 1} - Suas Cartas ({cards.length})</h3>
      <div className="hand-cards">
        {cards.map((card, index) => (
          <Card
            key={`${card}-${index}`}
            value={card}
            onClick={() => onPlayCard(index)}
          />
        ))}
        {cards.length === 0 && (
          <p style={{ color: '#999', fontStyle: 'italic' }}>
            Você não tem mais cartas neste nível!
          </p>
        )}
      </div>
    </div>
  );
}


'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import Ably from 'ably';

export interface GameState {
  numPlayers: number;
  currentLevel: number;
  lives: number;
  stars: number;
  playedCards: number[];
  playerHands: number[][];
  gameOver: boolean;
  gameWon: boolean;
  levelComplete: boolean;
}

interface GameContextType {
  gameState: GameState | null;
  startGame: (numPlayers: number, ablyChannel?: Ably.RealtimeChannel, roomCode?: string) => void;
  playCard: (playerIndex: number, cardIndex: number) => void;
  useStar: () => void;
  nextLevel: () => void;
  resetGame: () => void;
  setAblyChannel: (channel: Ably.RealtimeChannel | null, roomCode?: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};

// Função para embaralhar array
const shuffle = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Função para gerar deck completo (1 a 100)
const generateDeck = (): number[] => {
  return Array.from({ length: 100 }, (_, i) => i + 1);
};

// Calcular número máximo de níveis baseado no número de jogadores
const getMaxLevels = (numPlayers: number): number => {
  if (numPlayers === 2) return 12;
  if (numPlayers === 3) return 10;
  if (numPlayers === 4) return 8;
  if (numPlayers === 5) return 7;
  if (numPlayers === 6) return 6;
  if (numPlayers === 7) return 5;
  if (numPlayers === 8) return 4;
  return 12;
};

// Calcular vidas iniciais baseado no número de jogadores
const getInitialLives = (numPlayers: number): number => {
  return numPlayers;
};

// Distribuir cartas para um nível
const dealCards = (numPlayers: number, level: number, deck: number[]): number[][] => {
  const cardsPerPlayer = level;
  const totalCardsNeeded = numPlayers * cardsPerPlayer;
  
  // Garantir que temos cartas suficientes no deck
  const availableCards = shuffle(deck);
  const hands: number[][] = [];
  
  for (let i = 0; i < numPlayers; i++) {
    const startIndex = i * cardsPerPlayer;
    const hand = availableCards.slice(startIndex, startIndex + cardsPerPlayer).sort((a, b) => a - b);
    hands.push(hand);
  }
  
  return hands;
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [ablyChannel, setAblyChannelState] = useState<Ably.RealtimeChannel | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);

  // Sincronizar estado do jogo via Ably
  useEffect(() => {
  if (!ablyChannel || !roomCode) return;

  // Crie a função separada
  const onGameStateUpdate = (message: any) => {
    setGameState(message.data);
  };

  ablyChannel.subscribe('game:state', onGameStateUpdate);

  return () => {
    // Remova apenas esta função
    ablyChannel.unsubscribe('game:state', onGameStateUpdate);
  };
}, [ablyChannel, roomCode]);

  const setAblyChannel = useCallback((channel: Ably.RealtimeChannel | null, code?: string) => {
    setAblyChannelState(channel);
    if (code) {
      setRoomCode(code);
    }
  }, []);

  const syncGameState = useCallback((newState: GameState) => {
    if (!ablyChannel || !roomCode) {
      setGameState(newState);
      return;
    }

    // ablyChannel já é o canal do jogo
    ablyChannel.publish('game:state', newState);
    setGameState(newState);
  }, [ablyChannel, roomCode]);

  const startGame = useCallback((numPlayers: number, channel?: Ably.RealtimeChannel, code?: string) => {
    // Configurar canal primeiro se fornecido
    if (channel && code) {
      setAblyChannelState(channel);
      setRoomCode(code);
      
      // Aguardar um tick para garantir que o canal está configurado
      setTimeout(() => {
        const maxLevels = getMaxLevels(numPlayers);
        const initialLives = getInitialLives(numPlayers);
        const deck = generateDeck();
        const hands = dealCards(numPlayers, 1, deck);

        const initialState: GameState = {
          numPlayers,
          currentLevel: 1,
          lives: initialLives,
          stars: 0,
          playedCards: [],
          playerHands: hands,
          gameOver: false,
          gameWon: false,
          levelComplete: false,
        };

        // Sincronizar via Ably (channel já é o canal do jogo)
        channel.publish('game:state', initialState);
        setGameState(initialState);
      }, 100);
    } else {
      // Modo offline/single player
      const maxLevels = getMaxLevels(numPlayers);
      const initialLives = getInitialLives(numPlayers);
      const deck = generateDeck();
      const hands = dealCards(numPlayers, 1, deck);

      const initialState: GameState = {
        numPlayers,
        currentLevel: 1,
        lives: initialLives,
        stars: 0,
        playedCards: [],
        playerHands: hands,
        gameOver: false,
        gameWon: false,
        levelComplete: false,
      };

      setGameState(initialState);
    }
  }, []);

  const playCard = useCallback((playerIndex: number, cardIndex: number) => {
  // Use 'setGameState' com a função de callback (prev) para ter o estado mais atualizado
  setGameState((prev) => {
    if (!prev || prev.gameOver || prev.levelComplete) return prev;

    const hand = [...prev.playerHands[playerIndex]];
    const card = hand[cardIndex];
    const isCorrect = prev.playedCards.length === 0 || card > prev.playedCards[prev.playedCards.length - 1];

    let newState;
    if (isCorrect) {
      const newHands = [...prev.playerHands];
      newHands[playerIndex] = hand.filter((_, i) => i !== cardIndex);
      const isDone = newHands.reduce((s, h) => s + h.length, 0) === 0;

      newState = {
        ...prev,
        playedCards: [...prev.playedCards, card],
        playerHands: newHands,
        levelComplete: isDone,
        gameWon: isDone && prev.currentLevel >= getMaxLevels(prev.numPlayers)
      };
    } else {
      const newLives = prev.lives - 1;
      newState = {
        ...prev,
        lives: newLives,
        gameOver: newLives === 0
        // ... lógica de descarte de erro
      };
    }

    // DISPARA PARA O ABLY AQUI (fora do return)
    if (ablyChannel) {
      ablyChannel.publish('game:state', newState);
    }

    return newState;
  });
}, [ablyChannel]);

  const useStar = useCallback(() => {
    setGameState((prev) => {
      if (!prev || prev.stars === 0 || prev.gameOver || prev.gameWon) return prev;

      // Todos os jogadores descartam a menor carta
      const newHands = prev.playerHands.map(hand => {
        if (hand.length === 0) return hand;
        const sortedHand = [...hand].sort((a, b) => a - b);
        return sortedHand.slice(1);
      });

      // Verificar se o nível está completo após usar a estrela
      const totalCardsInHands = newHands.reduce((sum, h) => sum + h.length, 0);
      const levelComplete = totalCardsInHands === 0;

      const newState = {
        ...prev,
        playerHands: newHands,
        stars: prev.stars - 1,
        levelComplete,
      };
      syncGameState(newState);
      return newState;
    });
  }, [syncGameState]);

  const nextLevel = useCallback(() => {
    setGameState((prev) => {
      if (!prev || !prev.levelComplete) return prev;

      const maxLevels = getMaxLevels(prev.numPlayers);
      if (prev.currentLevel >= maxLevels) {
        return prev;
      }

      const newLevel = prev.currentLevel + 1;
      const deck = generateDeck();
      const hands = dealCards(prev.numPlayers, newLevel, deck);

      const newState = {
        ...prev,
        currentLevel: newLevel,
        playedCards: [],
        playerHands: hands,
        levelComplete: false,
      };
      syncGameState(newState);
      return newState;
    });
  }, [syncGameState]);

  const resetGame = useCallback(() => {
    setGameState(null);
  }, []);

  return (
    <GameContext.Provider
      value={{
        gameState,
        startGame,
        playCard,
        useStar,
        nextLevel,
        resetGame,
        setAblyChannel,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import Ably from 'ably';
import { useRouter } from 'next/navigation';

interface Player {
  id: string;
  name: string;
  index: number;
}

interface RoomState {
  roomCode: string;
  players: Player[];
  hostId: string | null;
  gameStarted: boolean;
}

interface RoomContextType {
  roomState: RoomState | null;
  currentPlayer: Player | null;
  isHost: boolean;
  createRoom: () => Promise<void>;
  joinRoom: (code: string) => Promise<boolean>;
  leaveRoom: () => void;
  startGame: () => void;
  ablyChannel: Ably.RealtimeChannel | null;
  ablyClient: Ably.Realtime | null;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within RoomProvider');
  }
  return context;
};

// Gera código de sala de 6 dígitos
const generateRoomCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Inicializa Ably (usando chave pública temporária - em produção, use variável de ambiente)
const getAblyClient = (): Ably.Realtime => {
  // Para desenvolvimento, usando chave de demonstração
  // IMPORTANTE: Em produção, crie uma conta gratuita na Ably e use NEXT_PUBLIC_ABLY_API_KEY
  const apiKey = process.env.NEXT_PUBLIC_ABLY_API_KEY || 'demo:demo';
  return new Ably.Realtime({ key: apiKey, clientId: `client-${Math.random().toString(36).substr(2, 9)}` });
};

export const RoomProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [ablyClient, setAblyClient] = useState<Ably.Realtime | null>(null);
  const [ablyChannel, setAblyChannel] = useState<Ably.RealtimeChannel | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Inicializa Ably quando o componente monta
    const client = getAblyClient();
    setAblyClient(client);

    return () => {
      if (client) {
        client.close();
      }
    };
  }, []);

  const createRoom = useCallback(async () => {
    if (!ablyClient) return;

    const roomCode = generateRoomCode();
    const hostId = `player-${Math.random().toString(36).substr(2, 9)}`;
    const hostPlayer: Player = {
      id: hostId,
      name: 'Jogador 1',
      index: 0,
    };

    const channel = ablyClient.channels.get(`room:${roomCode}`);

    // Entrar na presença como host
    await channel.presence.enter(hostPlayer);

    // Subscrever para mensagens da sala
    await channel.subscribe('room:update', (message) => {
      setRoomState(message.data);
    });

    await channel.subscribe('game:start', () => {
      router.push('/game');
    });

    // Subscrever para atualizações de presença
    await channel.presence.subscribe('enter', async () => {
      // Quando alguém entra, atualizar a lista de jogadores
      const presence = await channel.presence.get();
      const allPlayers = presence.map((m) => m.data as Player).filter(Boolean);
      
      const updatedState: RoomState = {
        roomCode,
        players: allPlayers,
        hostId,
        gameStarted: false,
      };
      
      await channel.publish('room:update', updatedState);
    });

    // Inicializar sala
    const newRoomState: RoomState = {
      roomCode,
      players: [hostPlayer],
      hostId,
      gameStarted: false,
    };

    await channel.publish('room:update', newRoomState);

    setRoomState(newRoomState);
    setCurrentPlayer(hostPlayer);
    setAblyChannel(channel);
  }, [ablyClient, router]);

  const joinRoom = useCallback(async (code: string): Promise<boolean> => {
    if (!ablyClient) return false;

    try {
      const channel = ablyClient.channels.get(`room:${code}`);
      
      // Subscrever para atualizações antes de entrar na presença
      await channel.subscribe('room:update', (message) => {
        setRoomState(message.data);
      });

      await channel.subscribe('game:start', () => {
        router.push('/game');
      });

      // Tentar recuperar estado atual da sala
      const presence = await channel.presence.get();
      const existingPlayers = presence.map((m) => m.data as Player).filter(Boolean);
      
      if (existingPlayers.length >= 8) {
        return false; // Sala cheia
      }

      const playerId = `player-${Math.random().toString(36).substr(2, 9)}`;
      const newPlayer: Player = {
        id: playerId,
        name: `Jogador ${existingPlayers.length + 1}`,
        index: existingPlayers.length,
      };

      // Entrar na presença
      await channel.presence.enter(newPlayer);

      // Aguardar um pouco para garantir que todos os jogadores receberam a atualização
      setTimeout(() => {
        // Atualizar lista de jogadores
        const updatedPlayers = [...existingPlayers, newPlayer];
        const roomStateUpdate: RoomState = {
          roomCode: code,
          players: updatedPlayers,
          hostId: updatedPlayers[0]?.id || null,
          gameStarted: false,
        };

        channel.publish('room:update', roomStateUpdate);
      }, 500);

      setRoomState({
        roomCode: code,
        players: [...existingPlayers, newPlayer],
        hostId: existingPlayers[0]?.id || newPlayer.id,
        gameStarted: false,
      });
      setCurrentPlayer(newPlayer);
      setAblyChannel(channel);

      return true;
    } catch (error) {
      console.error('Erro ao entrar na sala:', error);
      return false;
    }
  }, [ablyClient, router]);

  const leaveRoom = useCallback(() => {
    if (ablyChannel && currentPlayer) {
      ablyChannel.presence.leave(currentPlayer);
      ablyChannel.unsubscribe();
    }
    setRoomState(null);
    setCurrentPlayer(null);
    setAblyChannel(null);
  }, [ablyChannel, currentPlayer]);

  const isHost = roomState?.hostId === currentPlayer?.id;

  const startGame = useCallback(() => {
    if (!ablyChannel || !roomState || !isHost) return;
    
    const updatedState: RoomState = {
      ...roomState,
      gameStarted: true,
    };
    
    ablyChannel.publish('game:start', {});
    ablyChannel.publish('room:update', updatedState);
  }, [ablyChannel, roomState, isHost]);

  return (
    <RoomContext.Provider
      value={{
        roomState,
        currentPlayer,
        isHost,
        createRoom,
        joinRoom,
        leaveRoom,
        startGame,
        ablyChannel,
        ablyClient,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};


'use client';

import { useRoom } from '@/context/RoomContext';
import { useGame } from '@/context/GameContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LobbyPage() {
  const { roomState, currentPlayer, isHost, startGame, leaveRoom, ablyChannel, ablyClient } = useRoom();
  const { startGame: initializeGame } = useGame();
  const router = useRouter();

  useEffect(() => {
    if (!roomState) {
      router.push('/');
      return;
    }
  }, [roomState, router]);

  useEffect(() => {
  if (!ablyClient || !roomState?.roomCode || !currentPlayer) return;

  const gameChannel = ablyClient.channels.get(`game:${roomState.roomCode}`);
  
  // 1. Crie uma função nomeada em vez de anônima
  const handleGameState = (message: any) => {
    if (message.data) {
      initializeGame(roomState.players.length, gameChannel, roomState.roomCode);
      setTimeout(() => router.push('/game'), 100);
    }
  };

  gameChannel.subscribe('game:state', handleGameState);

  return () => {
    // 2. Passe a função aqui para remover APENAS ela
    gameChannel.unsubscribe('game:state', handleGameState); 
  };
}, [ablyClient, roomState, router, currentPlayer, initializeGame]);

  const handleStartGame = async () => {
    if (!roomState || roomState.players.length < 2 || !ablyClient) return;

    // O host inicializa o jogo e sincroniza via Ably
    startGame(); // Avisa outros jogadores que o jogo começou
    
    // Criar canal do jogo
    const gameChannel = ablyClient.channels.get(`game:${roomState.roomCode}`);
    initializeGame(roomState.players.length, gameChannel, roomState.roomCode);
    
    // Pequeno delay para garantir que o estado foi sincronizado
    setTimeout(() => {
      router.push('/game');
    }, 200);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    router.push('/');
  };

  if (!roomState || !currentPlayer) {
    return (
      <main className="container">
        <div className="home">
          <p>Carregando...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="home">
        <h1>The Mind</h1>
        <p className="subtitle">Sala de Espera</p>
        
        <div className="room-info">
          <div className="room-code-display">
            <h2>Código da Sala</h2>
            <div className="room-code">{roomState.roomCode}</div>
            <p className="room-code-hint">
              Compartilhe este código com seus amigos
            </p>
          </div>

          <div className="players-list">
            <h2>Jogadores ({roomState.players.length}/8)</h2>
            <div className="players-grid">
              {roomState.players.map((player, index) => (
                <div 
                  key={player.id}
                  className={`player-item ${player.id === currentPlayer.id ? 'current-player' : ''}`}
                >
                  <div className="player-number">{index + 1}</div>
                  <div className="player-name">{player.name}</div>
                  {player.id === currentPlayer.id && (
                    <div className="you-badge">Você</div>
                  )}
                  {player.id === roomState.hostId && (
                    <div className="host-badge">Hospedeiro</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isHost && (
            <div className="host-actions">
              <button
                className="start-button"
                onClick={handleStartGame}
                disabled={roomState.players.length < 2}
              >
                {roomState.players.length < 2 
                  ? `Aguardando jogadores (mínimo 2)...`
                  : 'Iniciar Jogo'
                }
              </button>
            </div>
          )}

          {!isHost && (
            <div className="waiting-message">
              <p>Aguardando o hospedeiro iniciar o jogo...</p>
            </div>
          )}

          <button className="leave-button" onClick={handleLeaveRoom}>
            Sair da Sala
          </button>
        </div>
      </div>
    </main>
  );
}


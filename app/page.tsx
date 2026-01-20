'use client';

import { useRoom } from '@/context/RoomContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { createRoom, joinRoom, roomState, currentPlayer, isHost, startGame } = useRoom();
  const router = useRouter();
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    setLoading(true);
    setError(null);
    try {
      await createRoom();
      router.push('/lobby');
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar sala. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim()) {
      setError('Por favor, digite o código da sala');
      return;
    }

    setLoading(true);
    setError(null);
    const success = await joinRoom(roomCodeInput.trim());
    
    if (success) {
      router.push('/lobby');
    } else {
      setError('Sala não encontrada ou cheia. Verifique o código.');
    }
    setLoading(false);
  };

  if (roomState && roomState.roomCode) {
    router.push('/lobby');
    return null;
  }

  return (
    <main className="container">
      <div className="home">
        <h1>The Mind</h1>
        <p className="subtitle">Jogo Cooperativo Online</p>
        
        <div className="room-actions">
          <button 
            className="action-button-primary" 
            onClick={handleCreateRoom}
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Criar Jogo'}
          </button>

          <button 
            className="action-button-secondary" 
            onClick={() => setShowJoinInput(!showJoinInput)}
            disabled={loading}
          >
            Entrar na Sala
          </button>

          {showJoinInput && (
            <div className="join-room-form">
              <input
                type="text"
                placeholder="Digite o código da sala (6 dígitos)"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="room-code-input"
                maxLength={6}
              />
              <button 
                className="join-button"
                onClick={handleJoinRoom}
                disabled={loading || !roomCodeInput.trim()}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
              <button
                className="cancel-button"
                onClick={() => {
                  setShowJoinInput(false);
                  setRoomCodeInput('');
                  setError(null);
                }}
              >
                Cancelar
              </button>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        <div className="rules">
          <h3>Como Jogar:</h3>
          <ul>
            <li>Até 8 jogadores podem participar</li>
            <li>Crie uma sala e compartilhe o código com seus amigos</li>
            <li>Jogue suas cartas em ordem crescente (do menor para o maior)</li>
            <li>Você não pode se comunicar com outros jogadores</li>
            <li>Complete todos os níveis para vencer</li>
            <li>Perdendo todas as vidas, o jogo acaba</li>
            <li>Use estrelas ninja para descartar a menor carta de todos</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

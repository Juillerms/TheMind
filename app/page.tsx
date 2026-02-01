'use client';

import { useRoom } from '@/context/RoomContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'menu' | 'create-nickname' | 'join-nickname';

export default function Home() {
  const { createRoom, joinRoom, roomState } = useRoom();
  const router = useRouter();
  const [step, setStep] = useState<Step>('menu');
  const [nickname, setNickname] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    const name = (nickname || 'Jogador').trim() || 'Jogador';
    setLoading(true);
    setError(null);
    try {
      await createRoom(name);
      router.push('/lobby');
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar sala. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    const name = (nickname || 'Jogador').trim() || 'Jogador';
    if (!roomCodeInput.trim()) {
      setError('Por favor, digite o código da sala');
      return;
    }

    setLoading(true);
    setError(null);
    const success = await joinRoom(roomCodeInput.trim(), name);

    if (success) {
      router.push('/lobby');
    } else {
      setError('Sala não encontrada ou cheia. Verifique o código.');
    }
    setLoading(false);
  };

  const goBackToMenu = () => {
    setStep('menu');
    setNickname('');
    setRoomCodeInput('');
    setError(null);
  };

  if (roomState && roomState.roomCode) {
    router.push('/lobby');
    return null;
  }

  // Tela: escolher nickname para criar sala
  if (step === 'create-nickname') {
    return (
      <main className="container">
        <div className="home">
          <h1>The Mind</h1>
          <p className="subtitle">Criar Sala</p>
          <div className="nickname-form">
            <label htmlFor="nickname-create">Seu apelido</label>
            <input
              id="nickname-create"
              type="text"
              placeholder="Ex: Maria, João..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              className="room-code-input"
              maxLength={20}
              autoFocus
            />
            <div className="form-actions">
              <button
                className="action-button-primary"
                onClick={handleCreateRoom}
                disabled={loading}
              >
                {loading ? 'Criando...' : 'Criar Sala'}
              </button>
              <button
                className="cancel-button"
                onClick={goBackToMenu}
                disabled={loading}
              >
                Voltar
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      </main>
    );
  }

  // Tela: nickname + código para entrar na sala
  if (step === 'join-nickname') {
    return (
      <main className="container">
        <div className="home">
          <h1>The Mind</h1>
          <p className="subtitle">Entrar na Sala</p>
          <div className="nickname-form">
            <label htmlFor="nickname-join">Seu apelido</label>
            <input
              id="nickname-join"
              type="text"
              placeholder="Ex: Maria, João..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              className="room-code-input"
              maxLength={20}
            />
            <label htmlFor="room-code-join">Código da sala (6 dígitos)</label>
            <input
              id="room-code-join"
              type="text"
              placeholder="Digite o código"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="room-code-input"
              maxLength={6}
            />
            <div className="form-actions">
              <button
                className="join-button"
                onClick={handleJoinRoom}
                disabled={loading || !roomCodeInput.trim()}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
              <button
                className="cancel-button"
                onClick={goBackToMenu}
                disabled={loading}
              >
                Voltar
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      </main>
    );
  }

  // Menu principal
  return (
    <main className="container">
      <div className="home">
        <h1>The Mind</h1>
        <p className="subtitle">Jogo Cooperativo Online</p>

        <div className="room-actions">
          <button
            className="action-button-primary"
            onClick={() => setStep('create-nickname')}
            disabled={loading}
          >
            Criar Sala
          </button>

          <button
            className="action-button-secondary"
            onClick={() => setStep('join-nickname')}
            disabled={loading}
          >
            Entrar na Sala
          </button>
        </div>

        <div className="rules">
          <h3>Como Jogar:</h3>
          <ul>
            <li>Até 10 jogadores podem participar (2–8: 100 cartas; 9–10: 150 cartas)</li>
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

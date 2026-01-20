'use client';

import { useEffect } from 'react';
import Card from './Card';
import PlayerHand from './PlayerHand';
import { useGame } from '@/context/GameContext';
import { useRoom } from '@/context/RoomContext';
import { useRouter } from 'next/navigation';

export default function GameBoard() {
  const { gameState, playCard, useStar, nextLevel, resetGame, setAblyChannel } = useGame();
  const { currentPlayer, roomState, isHost, ablyClient } = useRoom();
  const router = useRouter();

  // Conectar GameContext ao RoomContext quando necessário
  useEffect(() => {
    if (ablyClient && roomState?.roomCode) {
      const gameChannel = ablyClient.channels.get(`game:${roomState.roomCode}`);
      setAblyChannel(gameChannel, roomState.roomCode);
    }
  }, [ablyClient, roomState, setAblyChannel]);

  // Aguardar o estado do jogo ser carregado (pode vir via Ably)
  if (!gameState) {
    return (
      <main className="container">
        <div className="game-container">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Carregando jogo...</p>
          </div>
        </div>
      </main>
    );
  }

  const handlePlayCard = (playerIndex: number, cardIndex: number) => {
    if (currentPlayer && currentPlayer.index === playerIndex) {
      playCard(playerIndex, cardIndex);
    }
  };

  const handleBackToHome = () => {
    resetGame();
    router.push('/');
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <div>
          <h1 style={{ fontSize: '32px', color: '#667eea', margin: 0 }}>
            The Mind
          </h1>
          <p style={{ color: '#666', marginTop: '5px' }}>
            Nível {gameState.currentLevel} de{' '}
            {gameState.numPlayers === 2 ? 12 :
             gameState.numPlayers === 3 ? 10 :
             gameState.numPlayers === 4 ? 8 :
             gameState.numPlayers === 5 ? 7 :
             gameState.numPlayers === 6 ? 6 :
             gameState.numPlayers === 7 ? 5 :
             gameState.numPlayers === 8 ? 4 : 12}
          </p>
        </div>
        <div className="game-stats">
          <div className="stat">
            <span className="stat-label">Vidas</span>
            <span className="stat-value lives-stat">{gameState.lives}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Estrelas ⭐</span>
            <span className="stat-value stars-stat">{gameState.stars}</span>
          </div>
        </div>
      </div>

      {gameState.gameOver && (
        <div className="game-status game-over">
          <h2>Game Over!</h2>
          <p>Vocês perderam todas as vidas.</p>
          <button className="back-button" onClick={handleBackToHome}>
            Voltar ao Início
          </button>
        </div>
      )}

      {gameState.gameWon && (
        <div className="game-status game-won">
          <h2>Vitória! 🎉</h2>
          <p>Parabéns! Vocês completaram todos os níveis!</p>
          <button className="back-button" onClick={handleBackToHome}>
            Voltar ao Início
          </button>
        </div>
      )}

      {!gameState.gameOver && !gameState.gameWon && (
        <>
          <div className="played-cards-area">
            {gameState.playedCards.length === 0 ? (
              <div className="played-cards-empty">
                Nenhuma carta jogada ainda. Comece jogando a menor carta!
              </div>
            ) : (
              gameState.playedCards.map((card, index) => (
                <Card key={index} value={card} played />
              ))
            )}
          </div>

          {gameState.levelComplete && (
            <div className="game-status" style={{ background: '#d4edda', border: '2px solid #27ae60' }}>
              <h2 style={{ color: '#27ae60' }}>Nível Completo! ✅</h2>
              <p>
                {gameState.currentLevel >= (gameState.numPlayers === 2 ? 12 :
                  gameState.numPlayers === 3 ? 10 :
                  gameState.numPlayers === 4 ? 8 :
                  gameState.numPlayers === 5 ? 7 :
                  gameState.numPlayers === 6 ? 6 :
                  gameState.numPlayers === 7 ? 5 :
                  gameState.numPlayers === 8 ? 4 : 12)
                  ? 'Parabéns! Vocês venceram o jogo!'
                  : 'Vamos para o próximo nível!'}
              </p>
              {gameState.currentLevel < (gameState.numPlayers === 2 ? 12 :
                gameState.numPlayers === 3 ? 10 :
                gameState.numPlayers === 4 ? 8 :
                gameState.numPlayers === 5 ? 7 :
                gameState.numPlayers === 6 ? 6 :
                gameState.numPlayers === 7 ? 5 :
                gameState.numPlayers === 8 ? 4 : 12) && isHost && (
                <button className="next-level-button action-button" onClick={nextLevel}>
                  Próximo Nível
                </button>
              )}
            </div>
          )}

          <div className="game-actions">
            {gameState.stars > 0 && !gameState.levelComplete && (
              <button
                className="use-star-button action-button"
                onClick={useStar}
              >
                Usar Estrela Ninja ⭐ (Descartar menor carta de todos)
              </button>
            )}
          </div>

          {/* Mostrar apenas as cartas do jogador atual */}
          {currentPlayer && currentPlayer.index < gameState.playerHands.length && (
            <PlayerHand
              cards={gameState.playerHands[currentPlayer.index]}
              playerIndex={currentPlayer.index}
              onPlayCard={(cardIndex) => handlePlayCard(currentPlayer.index, cardIndex)}
            />
          )}
        </>
      )}
    </div>
  );
}


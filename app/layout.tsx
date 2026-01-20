import './globals.css';
import { GameProvider } from '@/context/GameContext';
import { RoomProvider } from '@/context/RoomContext';

export const metadata = {
  title: 'The Mind - Jogo Online',
  description: 'Jogue The Mind online, o jogo de cartas cooperativo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <RoomProvider>
          <GameProvider>
            {children}
          </GameProvider>
        </RoomProvider>
      </body>
    </html>
  );
}

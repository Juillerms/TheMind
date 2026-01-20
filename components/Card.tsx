'use client';

interface CardProps {
  value: number;
  onClick?: () => void;
  played?: boolean;
}

export default function Card({ value, onClick, played = false }: CardProps) {
  return (
    <div
      className={`card ${played ? 'played' : ''}`}
      onClick={played ? undefined : onClick}
    >
      {value}
    </div>
  );
}


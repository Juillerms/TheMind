# The Mind - Jogo Online

Versão online do jogo de cartas cooperativo The Mind, desenvolvido com Next.js e sincronização em tempo real via Ably.

## 🎮 Características

- **Multiplayer Online**: Até 8 jogadores podem jogar juntos
- **Sistema de Salas**: Crie uma sala com código e compartilhe com amigos
- **Sincronização em Tempo Real**: Todas as ações são sincronizadas instantaneamente
- **Regras Fiéis ao Original**: Implementação completa das regras do jogo físico
- **Deploy no Netlify**: Configurado e pronto para deploy

## 🚀 Como Iniciar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Ably (Obrigatório para multiplayer)

1. Crie uma conta gratuita em [Ably.com](https://ably.com)
2. Obtenha sua chave API
3. Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_ABLY_API_KEY=sua_chave_api_aqui
```

**Importante**: Sem a chave do Ably, o jogo funcionará apenas localmente (single player).

### 3. Rodar em Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📦 Deploy no Netlify

1. Configure a variável de ambiente `NEXT_PUBLIC_ABLY_API_KEY` no Netlify
2. Conecte seu repositório ao Netlify
3. O Netlify detectará automaticamente o plugin Next.js configurado

## 🎯 Como Jogar

1. **Criar Jogo**: Clique em "Criar Jogo" para criar uma sala
2. **Compartilhar Código**: Compartilhe o código de 6 dígitos com seus amigos
3. **Entrar na Sala**: Outros jogadores usam "Entrar na Sala" e digitam o código
4. **Iniciar**: Quando tiver pelo menos 2 jogadores, o hospedeiro pode iniciar

## 📋 Regras do Jogo

### Níveis e Vidas

- **2 jogadores**: 12 níveis, 2 vidas
- **3 jogadores**: 10 níveis, 3 vidas
- **4 jogadores**: 8 níveis, 4 vidas
- **5 jogadores**: 7 níveis, 5 vidas
- **6 jogadores**: 6 níveis, 6 vidas
- **7 jogadores**: 5 níveis, 7 vidas
- **8 jogadores**: 4 níveis, 8 vidas

### Objetivo

Jogar todas as cartas em ordem crescente sem se comunicar. Cada jogador vê apenas suas próprias cartas.

### Estrelas Ninja ⭐

Ganhe uma estrela ninja a cada 3 níveis completos. Use para descartar a menor carta de todos os jogadores.

### Derrota

Se alguém jogar uma carta fora de ordem, o grupo perde uma vida. Se todas as vidas acabarem, o jogo termina.

## 🛠️ Tecnologias

- Next.js 14 (App Router)
- React 18
- TypeScript
- Ably (WebSocket/pub-sub para multiplayer)
- CSS puro (sem frameworks)

## 📝 Estrutura do Projeto

```
/app
  /page.tsx          # Tela inicial (Criar/Entrar na Sala)
  /lobby/page.tsx    # Sala de espera
  /game/page.tsx     # Página do jogo
/components
  Card.tsx           # Componente de carta
  PlayerHand.tsx     # Mão de cartas do jogador
  GameBoard.tsx      # Tabuleiro principal
/context
  RoomContext.tsx    # Gerenciamento de salas (Ably)
  GameContext.tsx    # Estado do jogo
```

## ⚠️ Notas Importantes

- Para funcionar online, é necessário configurar a chave API do Ably
- O plano gratuito do Ably permite até 200 conexões simultâneas
- Cada jogador precisa ter o código da sala para entrar
- O hospedeiro é o único que pode iniciar o jogo

## 📄 Licença

Este projeto é uma implementação educacional do jogo The Mind.

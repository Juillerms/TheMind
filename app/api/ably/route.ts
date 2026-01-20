import Ably from 'ably';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Endpoint de autenticação do Ably (Token Auth)
// Configure ABLY_API_KEY nas variáveis de ambiente do Netlify.
export async function GET(req: Request) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ABLY_API_KEY não configurada no ambiente.' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId') || undefined;

  try {
    const rest = new Ably.Rest({ key: apiKey });
    const tokenRequest = await rest.auth.createTokenRequest({ clientId });
    return NextResponse.json(tokenRequest);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Falha ao gerar token do Ably.' },
      { status: 500 }
    );
  }
}



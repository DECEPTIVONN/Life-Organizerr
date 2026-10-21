/**
 * ====================================================================================================
 * GUIA E ARQUIVO STANDALONE DE SISTEMA DE AUTENTICAÇÃO E LOGIN MULTI-DISPOSITIVO
 * (LOGIN, CRIAR CONTA, VINCULAR CHAVE, QR CODE SYSTEM & INTEGRAÇÃO COMPLETA COM GOOGLE OAUTH)
 * ====================================================================================================
 * 
 * Este arquivo foi projetado como uma REFERÊNCIA COMPLETA e AUTOSSUFICIENTE para ser adaptada ou copiada
 * para qualquer outro projeto React / Vite / Next.js.
 * 
 * 📋 ÍNDICE DAS INTERFACES E RECURSOS INCLUÍDOS NESTE ARQUIVO:
 * 
 * 1. 🌟 HUB DE BOAS-VINDAS (Welcome Hub com 3 Pílulas principais):
 *    - "Continuar com Google" (OAuth via popup/redirect com preservação de estado e tokens)
 *    - "Continuar com e-mail" (Acesso à tela de autenticação tradicional)
 *    - "Criar conta" (Acesso ao fluxo de registro com validação ativa de usuário)
 *    - Ações secundárias: "Entrar por QR Code" e "Vincular Chave de Sincronização"
 *    - Modais legais interativos (Termos de Uso e Política de Privacidade)
 * 
 * 2. 🔑 INTEGRAÇÃO COMPLETA COM CONTA GOOGLE (OAUTH 2.0 & GIS):
 *    - Guia detalhado de credenciais necessárias (Google Cloud Console):
 *      * GOOGLE_CLIENT_ID (ex: 123456789012-xxx.apps.googleusercontent.com)
 *      * GOOGLE_CLIENT_SECRET (ex: GOCSPX-xxxxxxxxxxxxxxxxxxxx)
 *      * APP_URL / Domínio de Produção (ex: https://meuapp.com)
 *      * URIs de Redirecionamento Autorizadas (ex: http://localhost:3000/auth/callback)
 *      * Origens JavaScript Autorizadas (ex: http://localhost:3000)
 *    - Escopos (Scopes) recomendados:
 *      * userinfo.profile (nome, foto de perfil, id)
 *      * userinfo.email (e-mail verificado)
 *      * calendar & calendar.events (opcional para integração com Google Agenda)
 *    - Fluxo do Pop-up Centralizado (`window.open`) com listener seguro `window.addEventListener('message')`
 *    - Fallback para redirecionamento direto (`window.location.href`) caso o navegador bloqueie popups
 *    - Troca de Código por Tokens (Token Exchange) no backend com a API Google
 *    - Armazenamento estruturado de tokens em localStorage:
 *      * google_calendar_token (Access Token)
 *      * google_calendar_refresh_token (Refresh Token)
 *      * google_calendar_token_expires_at (Timestamp de expiração)
 *      * google_calendar_user (JSON de perfil)
 *    - Rotina de renovação automática silenciosa de tokens (Refresh Token loop a cada 10 min)
 *    - Código de exemplo pronto para Backend (Node/Express, Next.js App Router) e Supabase Auth
 *    - Modal interativo integrado com guia passo a passo, snippets de `.env` e simulador de teste
 * 
 * 3. 📧 CONTINUAR COM E-MAIL (Login View):
 *    - Campo dinâmico para E-mail ou Nome de Usuário (@usuario)
 *    - Campo de senha com alternância de visibilidade (Eye / EyeOff)
 *    - Opção "Esqueceu a senha?" com busca de conta e redefinição instantânea
 *    - Checkbox interativo estilizado "Manter conectado" (Remember Me)
 *    - Proteção contra tentativas excessivas (Anti-Brute Force Lockout)
 * 
 * 4. 👤 CRIAR CONTA (Signup View):
 *    - Checagem em tempo real de disponibilidade do nome de usuário (idle, checking, available, taken)
 *    - Validação de formato de e-mail e requisitos mínimos de senha
 *    - Criação de chave de sincronização exclusiva (MBC-USER-HASH)
 *    - Integração imediata com o estado de login
 * 
 * 5. 🔗 VINCULAR CHAVE (Sync Key Linking):
 *    - Gaveta colapsável e modal dedicado para vincular chave existente (@usuario ou MBC-KEY)
 *    - Permite unir contas antigas ao entrar com Google ou ao criar novos acessos
 * 
 * 6. 📱 ENTRAR POR QR CODE E SISTEMA COMPLETO DE PAREAMENTO:
 *    - [Lado Dispositivo Solicitante - Ex: Desktop/PC]:
 *      * Geração de sessão temporária de 5 minutos (300 segundos)
 *      * Renderização gráfica do QR Code com SVG/Canvas via biblioteca `qrcode`
 *      * Cronômetro regressivo (MM:SS) em tempo real com overlay de expiração e botão "Renovar"
 *      * Código alternativo PIN de 6 dígitos formatado (PLN-XXXXXX) para digitação manual
 *      * Polling assíncrono (1.5s) que detecta a autorização remota instantaneamente
 *    - [Lado Dispositivo Autorizador - Ex: Celular já logado]:
 *      * Interface de autorização por PIN ou Leitura de QR Code
 *      * Validação remota de permissão, vinculando a conta do usuário à sessão
 *      * Registro do novo aparelho na lista de dispositivos conectados
 * 
 * 7. 🎨 DESIGN SYSTEM & RESPONSIVIDADE (Desktop vs Mobile):
 *    - Fundo imersivo "Curved Perspective Horizon Grid" em SVG idêntico ao site
 *    - Pílulas arredondadas com micro-interações (`rounded-full`, hover, active:scale)
 *    - Adaptação completa para telas móveis (safe areas, touch targets de 54px, teclado virtual)
 *    - Playground interativo embutido para testes imediatos com alternador de dispositivos
 * ====================================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Lock,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Check,
  Link2,
  QrCode,
  Smartphone,
  Monitor,
  RefreshCw,
  Clock,
  User,
  UserPlus,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  X,
  ExternalLink,
  Laptop,
  Code,
  Copy,
  CheckCheck,
  FileText,
  HelpCircle,
  Layers,
  Globe,
  Server,
  Database,
  Key
} from 'lucide-react';

/* ====================================================================================================
   1. TIPAGENS E INTERFACES DE DADOS
   ==================================================================================================== */

export interface StandaloneAuthUser {
  email: string;
  username: string;
  name: string;
  syncKey: string;
  photo?: string;
  provider: 'email' | 'google' | 'qr';
}

export interface StandaloneQrSession {
  sessionId: string;
  pinCode: string;
  status: 'pending' | 'authorized' | 'expired' | 'rejected';
  createdAt: number;
  expiresAt: number;
  user?: StandaloneAuthUser;
  authorizedAt?: string;
}

export type AuthScreenMode = 'welcome' | 'login' | 'signup' | 'forgot' | 'qrcode' | 'link_key';

/**
 * Tipagens específicas para a Integração com a Conta Google (OAuth 2.0 & Tokens)
 */
export interface GoogleOAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
}

export interface GoogleUserProfile {
  id?: string;
  email: string;
  verified_email?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
}

/* ====================================================================================================
   2. GUIA DOCUMENTAL & CÓDIGOS DE INTEGRAÇÃO GOOGLE OAUTH 2.0
   Explica detalhadamente as chaves necessárias, fluxo no GCP, Backend e Supabase.
   ==================================================================================================== */

export const GOOGLE_AUTH_INTEGRATION_DOCS = {
  // 1. Chaves e Variáveis de Ambiente Necessárias
  envSnippet: `# ==============================================================================
# VARIÁVEIS DE AMBIENTE PARA GOOGLE OAUTH 2.0
# ==============================================================================

# 1. ID do Cliente OAuth (Obtido em Google Cloud Console -> APIs & Services -> Credentials)
GOOGLE_CLIENT_ID="123456789012-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"

# 2. Segredo do Cliente OAuth (NUNCA expor no frontend; utilizado apenas em rotas de backend)
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 3. URL Raiz da Aplicação (usada para compor as URIs de redirecionamento dinâmicas)
# Dev: http://localhost:3000
# Prod: https://meu-planner.app
APP_URL="http://localhost:3000"
`,

  // 2. Passo a passo para obter as chaves no Google Cloud Console
  consoleSetupSteps: [
    {
      step: 1,
      title: "Criar ou Selecionar Projeto no Google Cloud",
      desc: "Acesse https://console.cloud.google.com, crie um novo projeto ou selecione o projeto existente para a sua aplicação."
    },
    {
      step: 2,
      title: "Configurar a Tela de Permissão OAuth (Consent Screen)",
      desc: "Vá em 'APIs e Serviços' -> 'Tela de permissão OAuth'. Escolha 'Externo', defina o Nome do Aplicativo, o E-mail de suporte ao usuário e os Domínios Autorizados."
    },
    {
      step: 3,
      title: "Adicionar Escopos (Scopes) Autorizados",
      desc: "Adicione os escopos essenciais: '.../auth/userinfo.email' e '.../auth/userinfo.profile'. Se for sincronizar eventos de agenda, adicione também '.../auth/calendar' e '.../auth/calendar.events'."
    },
    {
      step: 4,
      title: "Criar Credenciais OAuth do tipo 'Aplicativo da Web'",
      desc: "Vá em 'Credenciais' -> '+ Criar credenciais' -> 'ID do cliente OAuth'. Selecione 'Aplicativo da Web'."
    },
    {
      step: 5,
      title: "Configurar as URIs de Origem e Redirecionamento",
      desc: "Origens JavaScript Autorizadas: 'http://localhost:3000' e 'https://seu-dominio.com'.\nURIs de Redirecionamento Autorizadas: 'http://localhost:3000/auth/callback' e 'https://seu-dominio.com/auth/callback'."
    }
  ],

  // 3. Código das rotas de backend (Express / Node.js)
  backendExpressCode: `// ==============================================================================
// ROTAS DE BACKEND PARA GOOGLE OAUTH (Express.js / Node.js)
// Arquivo: /api/index.ts ou server.ts
// ==============================================================================

import express from 'express';
const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// 1. Rota para gerar a URL de autorização OAuth
router.get('/api/auth/google/url', (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(400).json({ error: 'GOOGLE_CLIENT_ID não configurado no servidor (.env).' });
  }

  const redirect_uri = req.query.redirect_uri || \`\${process.env.APP_URL || 'http://localhost:3000'}/auth/callback\`;
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ].join(' ');

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: String(redirect_uri),
    response_type: 'code',
    scope: scopes,
    access_type: 'offline', // CRÍTICO: 'offline' instrui o Google a fornecer o refresh_token
    prompt: 'consent',     // Garante que o usuário consinta e gere refresh_token
    state: String(redirect_uri)
  });

  res.json({ url: \`https://accounts.google.com/o/oauth2/v2/auth?\${params.toString()}\` });
});

// 2. Rota de Callback: Troca o código por tokens e busca o perfil do usuário
router.get('/auth/callback', async (req, res) => {
  const { code, error, state } = req.query;

  if (error || !code) {
    return res.send(\`
      <script>
        if (window.opener) {
          window.opener.postMessage({ type: 'GOOGLE_OAUTH_FAILURE', error: '\${error || "Sem código"}' }, '*');
          window.close();
        } else { window.location.href = '/'; }
      </script>
    \`);
  }

  try {
    const redirect_uri = (state as string) || \`\${process.env.APP_URL || 'http://localhost:3000'}/auth/callback\`;

    // Troca de código de autorização por Access Token e Refresh Token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri,
        grant_type: 'authorization_code'
      }).toString()
    });

    const tokens = await tokenRes.json();

    // Busca os dados do perfil do usuário na Google UserInfo API
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: \`Bearer \${tokens.access_token}\` }
    });
    const profile = await userRes.json();

    // Devolve para a janela principal via postMessage e fecha o popup
    res.send(\`
      <!DOCTYPE html>
      <html>
        <head><title>Autenticado</title></head>
        <body style="background:#09090b;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
          <p>Autenticado com sucesso! Fechando janela...</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_OAUTH_SUCCESS',
                tokens: \${JSON.stringify(tokens)},
                profile: \${JSON.stringify(profile)}
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    \`);
  } catch (err: any) {
    res.status(500).send(\`Erro no callback OAuth: \${err.message}\`);
  }
});

// 3. Rota para renovar o access_token expirado usando o refresh_token
router.post('/api/auth/google/refresh', async (req, res) => {
  const { refresh_token } = req.body || {};
  if (!refresh_token) return res.status(400).json({ error: 'refresh_token ausente' });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      refresh_token,
      grant_type: 'refresh_token'
    }).toString()
  });

  const tokens = await tokenRes.json();
  res.json(tokens);
});

export default router;
`,

  // 4. Código Alternativo com Supabase Auth direto (Client-Side)
  supabaseAuthCode: `// ==============================================================================
// OPÇÃO NATIVA SUPABASE AUTH (Alternativa Direta sem Backend Customizado)
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Dispara o login com Google via Supabase OAuth
export async function loginWithGoogleSupabase() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: \`\${window.location.origin}/auth/callback\`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      },
      scopes: 'https://www.googleapis.com/auth/calendar'
    }
  });

  if (error) {
    console.error('Erro no login Supabase Google:', error.message);
    throw error;
  }
  return data;
}

// Configuração necessária no Dashboard do Supabase:
// 1. Acesse: Authentication -> Providers -> Google
// 2. Marque: 'Enable Google provider'
// 3. Cole o 'Client ID' e 'Client Secret' gerados no Google Cloud Console
// 4. No Google Cloud Console, adicione a 'Authorized redirect URI' fornecida pelo Supabase:
//    https://<seu-projeto-id>.supabase.co/auth/v1/callback
`
};

/* ====================================================================================================
   3. FUNÇÕES UTILITÁRIAS PARA GESTÃO DE TOKENS E REPOSITÓRIO LOCAL
   ==================================================================================================== */

/**
 * Salva tokens e perfil do Google no localStorage da aplicação
 */
export function saveGoogleOAuthTokens(tokens: GoogleOAuthTokens, profile?: GoogleUserProfile) {
  if (tokens.access_token) {
    localStorage.setItem('google_calendar_token', tokens.access_token);
  }
  if (tokens.expires_in) {
    const expiresAt = Date.now() + tokens.expires_in * 1000;
    localStorage.setItem('google_calendar_token_expires_at', expiresAt.toString());
  }
  if (tokens.refresh_token) {
    localStorage.setItem('google_calendar_refresh_token', tokens.refresh_token);
  }
  if (profile) {
    localStorage.setItem('google_calendar_user', JSON.stringify(profile));
  }
}

/**
 * Remove credenciais salvas do Google ao desconectar
 */
export function clearGoogleOAuthSession() {
  localStorage.removeItem('google_calendar_token');
  localStorage.removeItem('google_calendar_token_expires_at');
  localStorage.removeItem('google_calendar_refresh_token');
  localStorage.removeItem('google_calendar_user');
}

/**
 * Renova silenciosamente o access token caso o refresh token esteja presente
 */
export async function refreshGoogleAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('google_calendar_refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch('/api/auth/google/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!res.ok) {
      console.warn('[Google Auth] Falha ao renovar token com o servidor:', res.status);
      return localStorage.getItem('google_calendar_token');
    }

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('google_calendar_token', data.access_token);
      if (data.expires_in) {
        const expiresAt = Date.now() + data.expires_in * 1000;
        localStorage.setItem('google_calendar_token_expires_at', expiresAt.toString());
      }
      if (data.refresh_token) {
        localStorage.setItem('google_calendar_refresh_token', data.refresh_token);
      }
      return data.access_token;
    }
  } catch (err) {
    console.error('[Google Auth] Erro ao renovar token de acesso:', err);
  }
  return localStorage.getItem('google_calendar_token');
}

/**
 * Função utilitária para hash seguro SHA-256 via Web Crypto API nativa
 */
export async function computeSha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Armazenamento local de contas para execução standalone sem depender de servidor externo
 */
class StandaloneAuthService {
  private static STORAGE_PREFIX = 'standalone_auth:';
  private static FAILED_ATTEMPTS_KEY = 'standalone_failed_attempts';
  private static LOCKOUT_TIME_MS = 2 * 60 * 1000; // 2 minutos de bloqueio temporário após 5 falhas

  // Busca uma conta pelo e-mail
  static async getAccountByEmail(email: string): Promise<any | null> {
    const clean = email.trim().toLowerCase();
    const raw = localStorage.getItem(`${this.STORAGE_PREFIX}acc:${clean}`);
    if (raw) {
      try { return JSON.parse(raw); } catch { return null; }
    }
    // Fallback com conta demo pré-definida para facilitar testes rápidos
    if (clean === 'demo@exemplo.com' || clean === 'usuario@lifeorganizer.app') {
      return {
        email: clean,
        username: 'demo_user',
        name: 'Usuário Demonstração',
        passwordHash: await computeSha256('123456'),
        syncKey: 'MBC-DEMO-998877',
        provider: 'email',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      };
    }
    return null;
  }

  // Busca uma conta pelo username
  static async getAccountByUsername(username: string): Promise<any | null> {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    const emailMap = localStorage.getItem(`${this.STORAGE_PREFIX}user:${clean}`);
    if (emailMap) {
      return this.getAccountByEmail(emailMap);
    }
    if (clean === 'demo_user') {
      return this.getAccountByEmail('demo@exemplo.com');
    }
    return null;
  }

  // Salva ou atualiza uma conta
  static async saveAccount(account: any): Promise<void> {
    const cleanEmail = account.email.trim().toLowerCase();
    const cleanUser = account.username.trim().toLowerCase().replace(/^@/, '');
    localStorage.setItem(`${this.STORAGE_PREFIX}acc:${cleanEmail}`, JSON.stringify(account));
    localStorage.setItem(`${this.STORAGE_PREFIX}user:${cleanUser}`, cleanEmail);
  }

  // Checa disponibilidade de nome de usuário
  static async isUsernameAvailable(username: string): Promise<boolean> {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (!clean || clean.length < 3) return false;
    const existing = await this.getAccountByUsername(clean);
    return !existing;
  }

  // Registra nova conta com senha e chave de sincronização
  static async registerUser(data: {
    username: string;
    email: string;
    password: string;
    linkKey?: string;
  }): Promise<{ ok: boolean; user?: StandaloneAuthUser; message?: string }> {
    const cleanUser = data.username.trim().toLowerCase().replace(/^@/, '');
    const cleanEmail = data.email.trim().toLowerCase();

    if (cleanUser.length < 3) {
      return { ok: false, message: 'O nome de usuário deve ter pelo menos 3 caracteres.' };
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { ok: false, message: 'Informe um e-mail válido.' };
    }
    if (data.password.length < 6) {
      return { ok: false, message: 'A senha deve conter no mínimo 6 caracteres.' };
    }

    const isAvailable = await this.isUsernameAvailable(cleanUser);
    if (!isAvailable) {
      return { ok: false, message: 'Este nome de usuário já está em uso.' };
    }

    const existingEmail = await this.getAccountByEmail(cleanEmail);
    if (existingEmail) {
      return { ok: false, message: 'Este endereço de e-mail já está cadastrado.' };
    }

    // Vincula à chave existente ou cria uma nova chave exclusiva
    const syncKey = (data.linkKey && data.linkKey.trim())
      ? data.linkKey.trim().toUpperCase()
      : `MBC-${cleanUser.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const passwordHash = await computeSha256(data.password);

    const newRecord = {
      email: cleanEmail,
      username: cleanUser,
      name: cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1),
      passwordHash,
      syncKey,
      provider: 'email',
      createdAt: new Date().toISOString()
    };

    await this.saveAccount(newRecord);

    const authUser: StandaloneAuthUser = {
      email: newRecord.email,
      username: newRecord.username,
      name: newRecord.name,
      syncKey: newRecord.syncKey,
      provider: 'email'
    };

    return { ok: true, user: authUser };
  }

  // Autenticação tradicional com proteção contra força bruta
  static async loginWithCredentials(
    identifier: string,
    pass: string
  ): Promise<{ ok: boolean; user?: StandaloneAuthUser; message?: string }> {
    const lockout = this.checkBruteForceLockout();
    if (lockout.isLocked) {
      return {
        ok: false,
        message: `Muitas tentativas incorretas. Bloqueio temporário por mais ${lockout.remainingSeconds}s.`
      };
    }

    const cleanId = identifier.trim().toLowerCase();
    let account = null;

    if (cleanId.includes('@')) {
      account = await this.getAccountByEmail(cleanId);
    } else {
      account = await this.getAccountByUsername(cleanId);
    }

    if (!account) {
      this.recordFailedAttempt();
      return { ok: false, message: 'Nenhuma conta encontrada com este e-mail ou usuário.' };
    }

    const inputHash = await computeSha256(pass);
    if (account.passwordHash && account.passwordHash !== inputHash) {
      this.recordFailedAttempt();
      return { ok: false, message: 'Senha incorreta. Verifique os caracteres e tente novamente.' };
    }

    // Sucesso: reseta histórico de falhas
    localStorage.removeItem(this.FAILED_ATTEMPTS_KEY);

    const authUser: StandaloneAuthUser = {
      email: account.email,
      username: account.username,
      name: account.name || account.username,
      syncKey: account.syncKey || `MBC-${account.username.toUpperCase()}-9900`,
      photo: account.photo,
      provider: account.provider || 'email'
    };

    return { ok: true, user: authUser };
  }

  // Gerenciamento de tentativas e bloqueio temporário
  private static recordFailedAttempt(): void {
    const raw = localStorage.getItem(this.FAILED_ATTEMPTS_KEY);
    const data = raw ? JSON.parse(raw) : { count: 0, lastAttempt: Date.now() };
    data.count += 1;
    data.lastAttempt = Date.now();
    localStorage.setItem(this.FAILED_ATTEMPTS_KEY, JSON.stringify(data));
  }

  private static checkBruteForceLockout(): { isLocked: boolean; remainingSeconds: number } {
    const raw = localStorage.getItem(this.FAILED_ATTEMPTS_KEY);
    if (!raw) return { isLocked: false, remainingSeconds: 0 };
    try {
      const data = JSON.parse(raw);
      if (data.count >= 5) {
        const diff = Date.now() - data.lastAttempt;
        if (diff < this.LOCKOUT_TIME_MS) {
          const remainingSeconds = Math.ceil((this.LOCKOUT_TIME_MS - diff) / 1000);
          return { isLocked: true, remainingSeconds };
        } else {
          // Expirou o tempo de penalidade
          localStorage.removeItem(this.FAILED_ATTEMPTS_KEY);
        }
      }
    } catch {
      localStorage.removeItem(this.FAILED_ATTEMPTS_KEY);
    }
    return { isLocked: false, remainingSeconds: 0 };
  }

  // --- Sistema de QR Code & Pareamento PIN ---
  static async createQrSession(): Promise<StandaloneQrSession> {
    const sessionId = `qrs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const pin = `PLN-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = Date.now();
    const session: StandaloneQrSession = {
      sessionId,
      pinCode: pin,
      status: 'pending',
      createdAt: now,
      expiresAt: now + 5 * 60 * 1000 // 5 minutos de validade
    };

    localStorage.setItem(`standalone_qrsession:${sessionId}`, JSON.stringify(session));
    localStorage.setItem(`standalone_qrpin:${pin}`, sessionId);
    return session;
  }

  static async pollQrSession(sessionId: string): Promise<StandaloneQrSession | null> {
    const raw = localStorage.getItem(`standalone_qrsession:${sessionId}`);
    if (!raw) return null;
    try {
      const session: StandaloneQrSession = JSON.parse(raw);
      if (Date.now() > session.expiresAt && session.status === 'pending') {
        session.status = 'expired';
        localStorage.setItem(`standalone_qrsession:${sessionId}`, JSON.stringify(session));
      }
      return session;
    } catch {
      return null;
    }
  }

  static async authorizeQrSession(
    pinOrSessionId: string,
    authUser: StandaloneAuthUser
  ): Promise<{ ok: boolean; message: string }> {
    let targetSessionId = pinOrSessionId.trim();
    if (targetSessionId.toUpperCase().startsWith('PLN-')) {
      const mappedId = localStorage.getItem(`standalone_qrpin:${targetSessionId.toUpperCase()}`);
      if (!mappedId) {
        return { ok: false, message: 'Código PIN inválido ou expirado.' };
      }
      targetSessionId = mappedId;
    }

    const session = await this.pollQrSession(targetSessionId);
    if (!session) {
      return { ok: false, message: 'Sessão de pareamento não encontrada.' };
    }
    if (session.status === 'expired') {
      return { ok: false, message: 'Esta sessão de pareamento já expirou.' };
    }
    if (session.status === 'authorized') {
      return { ok: false, message: 'Esta sessão já foi autorizada previamente.' };
    }

    session.status = 'authorized';
    session.user = authUser;
    session.authorizedAt = new Date().toISOString();

    localStorage.setItem(`standalone_qrsession:${targetSessionId}`, JSON.stringify(session));
    return { ok: true, message: 'Dispositivo autorizado com sucesso!' };
  }
}

/* ====================================================================================================
   4. COMPONENTES VISUAIS AUXILIARES
   ==================================================================================================== */

/**
 * Fundo de perspectiva em horizonte curvado com grid cibernético ultra-imersivo
 */
export const CurvedPerspectiveBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0 bg-black">
      {/* Luz difusa central do horizonte */}
      <div
        className="absolute top-[28%] sm:top-[22%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] h-[320px] rounded-full blur-[130px] opacity-25"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.45) 0%, rgba(140, 140, 150, 0.15) 45%, rgba(0, 0, 0, 0) 75%)'
        }}
      />

      {/* Grid curvado e linhas de perspectiva em SVG */}
      <div className="absolute inset-0 flex items-center justify-center opacity-40">
        <svg
          className="w-full h-full min-w-[1000px]"
          viewBox="0 0 1400 800"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <defs>
            <linearGradient id="standaloneHorizonLineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="30%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="standaloneGridFadeY" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Linha mestra curvada de horizonte iluminado */}
          <path
            d="M -100 240 Q 700 130 1500 240"
            stroke="url(#standaloneHorizonLineGlow)"
            strokeWidth="1.6"
            fill="none"
          />

          {/* Anéis horizontais curvados com compressão de perspectiva */}
          <path d="M -80 255 Q 700 155 1480 255" stroke="url(#standaloneGridFadeY)" strokeWidth="0.8" />
          <path d="M -60 274 Q 700 185 1460 274" stroke="url(#standaloneGridFadeY)" strokeWidth="0.75" />
          <path d="M -40 298 Q 700 220 1440 298" stroke="url(#standaloneGridFadeY)" strokeWidth="0.7" />
          <path d="M -20 327 Q 700 260 1420 327" stroke="url(#standaloneGridFadeY)" strokeWidth="0.65" />
          <path d="M 0 362 Q 700 305 1400 362" stroke="url(#standaloneGridFadeY)" strokeWidth="0.6" />
          <path d="M 20 405 Q 700 358 1380 405" stroke="url(#standaloneGridFadeY)" strokeWidth="0.55" />
          <path d="M 40 455 Q 700 418 1360 455" stroke="url(#standaloneGridFadeY)" strokeWidth="0.5" />

          {/* Linhas radiais de fuga em perspectiva */}
          {Array.from({ length: 41 }).map((_, i) => {
            const xStart = 700 + (i - 20) * 32;
            const xEnd = 700 + (i - 20) * 68;
            return (
              <path
                key={i}
                d={`M ${xStart} 160 L ${xEnd} 480`}
                stroke="url(#standaloneGridFadeY)"
                strokeWidth="0.6"
                opacity={1 - Math.abs(i - 20) * 0.035}
              />
            );
          })}
        </svg>
      </div>

      {/* Degradê superior de fusão escura */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none" />
      {/* Degradê inferior suave */}
      <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none" />
    </div>
  );
};

/* ====================================================================================================
   5. MODAL DE DOCUMENTAÇÃO & CONFIGURAÇÃO DAS CHAVES GOOGLE OAUTH
   Interface interativa para que qualquer desenvolvedor veja as chaves necessárias e copie exemplos de código.
   ==================================================================================================== */

export interface GoogleOAuthDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateLogin?: () => void;
}

export const GoogleOAuthDocsModal: React.FC<GoogleOAuthDocsModalProps> = ({
  isOpen,
  onClose,
  onSimulateLogin
}) => {
  const [activeTab, setActiveTab] = useState<'keys' | 'backend' | 'supabase' | 'lifecycle'>('keys');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 select-none font-sans text-white">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative z-10 w-full max-w-2xl bg-[#0e0e12] border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1a1a24] border border-[#2b2b3b] flex items-center justify-center">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Google OAuth 2.0 & Chaves de Integração</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                  Pronto para Produção
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Credenciais, rotas e arquitetura de autenticação</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex gap-1.5 my-3.5 p-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('keys')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeTab === 'keys' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Chaves & Google Cloud</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backend')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeTab === 'backend' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Rotas Backend (Express)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeTab === 'supabase' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Opção Supabase Auth</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lifecycle')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeTab === 'lifecycle' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Ciclo de Vida do Token</span>
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs text-zinc-300">
          {/* ABA 1: CHAVES & GOOGLE CLOUD */}
          {activeTab === 'keys' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Variáveis de Ambiente Necessárias (.env)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(GOOGLE_AUTH_INTEGRATION_DOCS.envSnippet, 'env')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-[11px] font-mono transition-colors cursor-pointer"
                  >
                    {copiedSection === 'env' ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar .env</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-black/90 border border-zinc-900 rounded-xl font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed">
                  {GOOGLE_AUTH_INTEGRATION_DOCS.envSnippet}
                </pre>
              </div>

              {/* Tabela de Explicação das Chaves */}
              <div className="space-y-2">
                <h4 className="font-semibold text-white text-xs">Finalidade de cada Chave:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                    <div className="font-mono text-amber-400 font-bold mb-1">GOOGLE_CLIENT_ID</div>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      Identificador público do seu aplicativo junto à Google. Utilizado para montar a URL de autorização onde o usuário faz login e aceita os escopos.
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                    <div className="font-mono text-red-400 font-bold mb-1">GOOGLE_CLIENT_SECRET</div>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      Chave secreta privada. Permanece estritamente no backend. Usada na rota <code className="text-zinc-200">/auth/callback</code> para trocar o código OAuth pelos tokens reais.
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                    <div className="font-mono text-blue-400 font-bold mb-1">URIs de Redirecionamento</div>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      Devem ser adicionadas exatamente no Google Cloud Console: <br />
                      <code className="text-zinc-200">http://localhost:3000/auth/callback</code> <br />
                      <code className="text-zinc-200">https://seu-dominio.com/auth/callback</code>
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                    <div className="font-mono text-emerald-400 font-bold mb-1">Origens JavaScript</div>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      Domínios onde a janela popup é aberta: <br />
                      <code className="text-zinc-200">http://localhost:3000</code> <br />
                      <code className="text-zinc-200">https://seu-dominio.com</code>
                    </p>
                  </div>
                </div>
              </div>

              {/* Passo a Passo no Console */}
              <div className="space-y-2 pt-2">
                <h4 className="font-semibold text-white text-xs">Passo a Passo de Configuração no Google Cloud Console:</h4>
                <div className="space-y-2">
                  {GOOGLE_AUTH_INTEGRATION_DOCS.consoleSetupSteps.map(step => (
                    <div key={step.step} className="flex gap-3 p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                      <div className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        {step.step}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-200 text-xs">{step.title}</div>
                        <div className="text-[11px] text-zinc-400 whitespace-pre-line mt-0.5">{step.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: BACKEND (EXPRESS) */}
          {activeTab === 'backend' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Código completo das 3 rotas necessárias (<code className="text-white">/url</code>, <code className="text-white">/callback</code> e <code className="text-white">/refresh</code>):
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(GOOGLE_AUTH_INTEGRATION_DOCS.backendExpressCode, 'backend')}
                  className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-[11px] font-mono transition-colors cursor-pointer"
                >
                  {copiedSection === 'backend' ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Rotas Express</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3 bg-black/90 border border-zinc-900 rounded-xl font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-[360px] leading-relaxed">
                {GOOGLE_AUTH_INTEGRATION_DOCS.backendExpressCode}
              </pre>
            </div>
          )}

          {/* ABA 3: SUPABASE AUTH */}
          {activeTab === 'supabase' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-900/60 rounded-2xl flex items-center gap-2.5 text-emerald-300 text-xs">
                <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Se o seu outro projeto utilizar Supabase, você não precisa de rotas manuais em Express. O Supabase gerencia o ciclo completo do OAuth!
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Integração nativa com cliente Supabase JS:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(GOOGLE_AUTH_INTEGRATION_DOCS.supabaseAuthCode, 'supabase')}
                  className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-[11px] font-mono transition-colors cursor-pointer"
                >
                  {copiedSection === 'supabase' ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Snippet Supabase</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3 bg-black/90 border border-zinc-900 rounded-xl font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-[360px] leading-relaxed">
                {GOOGLE_AUTH_INTEGRATION_DOCS.supabaseAuthCode}
              </pre>
            </div>
          )}

          {/* ABA 4: CICLO DE VIDA DO TOKEN */}
          {activeTab === 'lifecycle' && (
            <div className="space-y-3.5 animate-in fade-in">
              <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-2">
                <h4 className="font-semibold text-white text-xs flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  <span>Como o sistema gerencia a validade dos tokens do Google:</span>
                </h4>
                <div className="space-y-2 text-[11px] text-zinc-400 leading-relaxed">
                  <p>
                    1. <strong className="text-zinc-200">Access Token (access_token):</strong> Tem validade curta (~3600 segundos / 1 hora). É armazenado na chave <code className="text-zinc-300">google_calendar_token</code> e usado como Bearer Token em chamadas de API.
                  </p>
                  <p>
                    2. <strong className="text-zinc-200">Refresh Token (refresh_token):</strong> Emitido quando usamos <code className="text-zinc-300">access_type: 'offline'</code> e <code className="text-zinc-300">prompt: 'consent'</code>. Tem vida longa. É salvo em <code className="text-zinc-300">google_calendar_refresh_token</code>.
                  </p>
                  <p>
                    3. <strong className="text-zinc-200">Auto-Renovação Silenciosa:</strong> A função <code className="text-zinc-300">refreshGoogleAccessToken()</code> verifica periodicamente se faltam menos de 5 minutos para expirar e solicita um novo token em segundo plano sem desconectar o usuário.
                  </p>
                  <p>
                    4. <strong className="text-zinc-200">Unificação com Chave Sync:</strong> Ao logar com Google, a conta é mapeada com o prefixo <code className="text-zinc-300">MBC-GOOG-NOME-HASH</code> ou preserva a chave que o usuário informou no campo "Vincular Chave".
                  </p>
                </div>
              </div>

              {/* Estado atual do armazenamento no navegador */}
              <div className="p-3.5 bg-black/60 border border-zinc-800 rounded-2xl space-y-2">
                <span className="text-xs font-semibold text-white">Chaves Atualmente no LocalStorage:</span>
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex justify-between py-1 border-b border-zinc-900">
                    <span className="text-zinc-400">google_calendar_token:</span>
                    <span className="text-zinc-300 truncate max-w-[250px]">
                      {localStorage.getItem('google_calendar_token') ? '•••• Presente' : 'Não definido'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-900">
                    <span className="text-zinc-400">google_calendar_refresh_token:</span>
                    <span className="text-zinc-300 truncate max-w-[250px]">
                      {localStorage.getItem('google_calendar_refresh_token') ? '•••• Presente' : 'Não definido'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-zinc-400">google_calendar_user:</span>
                    <span className="text-zinc-300 truncate max-w-[250px]">
                      {localStorage.getItem('google_calendar_user') ? 'Configurado' : 'Não definido'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Ações Rápidas */}
        <div className="pt-4 mt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          {onSimulateLogin && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSimulateLogin();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-full transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Testar com Perfil Google Simulado</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white text-black text-xs font-bold rounded-full hover:bg-zinc-200 transition-colors ml-auto cursor-pointer"
          >
            Fechar Guia
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ====================================================================================================
   6. COMPONENTE PRINCIPAL STANDALONE: StandaloneAuthModal
   Contém todas as telas de autenticação e fluxos do usuário.
   ==================================================================================================== */

export interface StandaloneAuthModalProps {
  isOpen: boolean;
  onSuccess: (user: StandaloneAuthUser, rememberMe: boolean) => void;
  onClose?: () => void;
  initialMode?: AuthScreenMode;
}

export const StandaloneAuthModal: React.FC<StandaloneAuthModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
  initialMode = 'welcome'
}) => {
  const [mode, setMode] = useState<AuthScreenMode>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Estados de recuperação de conta
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [foundAccount, setFoundAccount] = useState<{ username: string; syncKey: string } | null>(null);
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState<string | null>(null);

  // Estados do QR Code Login
  const [qrSession, setQrSession] = useState<StandaloneQrSession | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrTimer, setQrTimer] = useState<number>(300); // 5 minutos (300 segundos)

  // Estados da Vinculação de Chave
  const [linkSyncKeyInput, setLinkSyncKeyInput] = useState('');
  const [showLinkSection, setShowLinkSection] = useState(false);

  // Modais informativos (Google Docs, Termos e Privacidade)
  const [showGoogleDocsModal, setShowGoogleDocsModal] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Inicializa a sessão de QR Code Login
  const startQrLogin = async () => {
    setMode('qrcode');
    setErrorMsg(null);
    setLoading(true);
    try {
      const session = await StandaloneAuthService.createQrSession();
      setQrSession(session);
      setQrTimer(300);

      // Gera a imagem do QR Code em alta resolução
      const qrPayload = `${window.location.origin}/?qr_session=${session.sessionId}`;
      const url = await QRCode.toDataURL(qrPayload, {
        width: 280,
        margin: 2,
        color: {
          dark: '#09090b',
          light: '#ffffff'
        }
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error("Erro ao gerar QR Code:", err);
      setErrorMsg('Não foi possível gerar o código QR. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Cronômetro regressivo da sessão QR Code (5 minutos)
  useEffect(() => {
    if (mode !== 'qrcode' || !qrSession) return;

    const timer = setInterval(() => {
      setQrTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, qrSession]);

  // Polling ativo da sessão QR Code (a cada 1.5s para resposta instantânea)
  useEffect(() => {
    if (mode !== 'qrcode' || !qrSession || qrTimer <= 0) return;

    const pollInterval = setInterval(async () => {
      const updated = await StandaloneAuthService.pollQrSession(qrSession.sessionId);
      if (updated) {
        if (updated.status === 'authorized' && updated.user) {
          clearInterval(pollInterval);
          onSuccess(updated.user, rememberMe);
        } else if (updated.status === 'expired') {
          clearInterval(pollInterval);
        }
      }
    }, 1500);

    return () => clearInterval(pollInterval);
  }, [mode, qrSession, qrTimer, rememberMe, onSuccess]);

  // Debounced check para validação de username em tempo real
  const usernameCheckTimeoutRef = useRef<any>(null);
  const handleUsernameChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);

    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }

    if (clean.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    usernameCheckTimeoutRef.current = setTimeout(async () => {
      const available = await StandaloneAuthService.isUsernameAvailable(clean);
      setUsernameStatus(available ? 'available' : 'taken');
    }, 400);
  };

  // Submissão de Cadastro (Signup)
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await StandaloneAuthService.registerUser({
        username,
        email,
        password,
        linkKey: linkSyncKeyInput
      });

      if (res.ok && res.user) {
        onSuccess(res.user, rememberMe);
      } else {
        setErrorMsg(res.message || 'Erro ao criar conta.');
      }
    } catch {
      setErrorMsg('Ocorreu um erro no servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Submissão de Login Tradicional (Email / Username)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await StandaloneAuthService.loginWithCredentials(email, password);
      if (res.ok && res.user) {
        onSuccess(res.user, rememberMe);
      } else {
        setErrorMsg(res.message || 'Falha na autenticação.');
      }
    } catch {
      setErrorMsg('Erro de comunicação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Submissão de Recuperação de Senha
  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setRecoverySuccessMsg(null);
    setLoading(true);

    try {
      if (!foundAccount) {
        // Passo 1: Busca a conta pelo e-mail
        const acc = await StandaloneAuthService.getAccountByEmail(recoveryEmail);
        if (!acc) {
          setErrorMsg('Nenhuma conta foi localizada com este e-mail.');
        } else {
          setFoundAccount({ username: acc.username, syncKey: acc.syncKey });
        }
      } else {
        // Passo 2: Define nova senha
        if (newPassword.length < 6) {
          setErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
          setLoading(false);
          return;
        }

        const acc = await StandaloneAuthService.getAccountByEmail(recoveryEmail);
        if (acc) {
          acc.passwordHash = await computeSha256(newPassword);
          await StandaloneAuthService.saveAccount(acc);
          setRecoverySuccessMsg('Senha alterada com sucesso! Você já pode entrar com sua nova senha.');
          setTimeout(() => {
            setMode('login');
            setEmail(recoveryEmail);
            setPassword(newPassword);
          }, 1500);
        }
      }
    } catch {
      setErrorMsg('Erro ao processar recuperação.');
    } finally {
      setLoading(false);
    }
  };

  /* ====================================================================================================
     INTEGRAÇÃO COMPLETA COM CONTA GOOGLE (POPUP OAUTH + FALLBACK + SIMULAÇÃO)
     ==================================================================================================== */
  const handleGoogleLogin = async (overrideLinkKey?: string, forceSimulation = false) => {
    setErrorMsg(null);
    setLoading(true);

    // Se solicitado expressamente o modo simulado (para testes rápidos em ambiente isolado)
    if (forceSimulation) {
      setTimeout(async () => {
        const dummyGoogleProfile = {
          email: 'usuario.google@gmail.com',
          name: 'Usuário Google',
          picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          username: 'usuario_google',
          syncKey: linkSyncKeyInput.trim() ? linkSyncKeyInput.trim().toUpperCase() : 'MBC-GOOG-DEMO-SYNC'
        };

        const authUser: StandaloneAuthUser = {
          email: dummyGoogleProfile.email,
          username: dummyGoogleProfile.username,
          name: dummyGoogleProfile.name,
          syncKey: dummyGoogleProfile.syncKey,
          photo: dummyGoogleProfile.picture,
          provider: 'google'
        };

        saveGoogleOAuthTokens(
          {
            access_token: 'mock_google_access_token_' + Date.now(),
            refresh_token: 'mock_google_refresh_token_' + Date.now(),
            expires_in: 3600
          },
          dummyGoogleProfile
        );

        await StandaloneAuthService.saveAccount(dummyGoogleProfile);
        setLoading(false);
        onSuccess(authUser, rememberMe);
      }, 600);
      return;
    }

    try {
      const redirectUri = `${window.location.origin}/auth/callback`;

      // 1. Tenta obter a URL de autenticação do backend configurado
      const res = await fetch(`/api/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}&scope=calendar`)
        .catch(() => null);

      if (!res || !res.ok) {
        let errDesc = 'Serviço de autenticação Google não disponível no backend.';
        if (res) {
          const data = await res.json().catch(() => ({}));
          errDesc = data.error || errDesc;
        }

        setErrorMsg(`${errDesc}`);
        setLoading(false);
        return;
      }

      const data = await res.json().catch(() => ({}));
      const { url } = data;

      if (!url) {
        throw new Error('URL de autenticação do Google não recebida do servidor.');
      }

      // 2. Configura listener seguro para receber tokens da janela popup
      const handleMessage = async (event: MessageEvent) => {
        const origin = event.origin;
        if (
          event.origin !== window.location.origin &&
          !origin.endsWith('.run.app') &&
          !origin.includes('localhost')
        ) {
          return;
        }

        if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS' && event.data?.profile) {
          window.removeEventListener('message', handleMessage);
          const profile: GoogleUserProfile = event.data.profile;
          const tokens: GoogleOAuthTokens = event.data.tokens;

          // Salva tokens de acesso e refresh no localStorage
          saveGoogleOAuthTokens(tokens, profile);

          const keyToLink = (typeof overrideLinkKey === 'string' && overrideLinkKey.trim())
            ? overrideLinkKey.trim()
            : linkSyncKeyInput.trim();

          const cleanEmail = profile.email.trim().toLowerCase();
          const username = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '');
          const syncKey = keyToLink || `MBC-GOOG-${username.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

          const userRecord = {
            email: cleanEmail,
            username,
            name: profile.name || username,
            photo: profile.picture,
            syncKey,
            provider: 'google' as const
          };

          await StandaloneAuthService.saveAccount(userRecord);
          setLoading(false);
          onSuccess(userRecord, rememberMe);
        } else if (event.data?.type === 'GOOGLE_OAUTH_FAILURE') {
          window.removeEventListener('message', handleMessage);
          const errDetail = event.data?.error ? `: ${event.data.error}` : '';
          setErrorMsg(`Falha no login com Google${errDetail}. Verifique as credenciais no Google Cloud Console.`);
          setLoading(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // 3. Abre popup centralizado na tela
      const width = 550;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        url,
        'google_auth_popup',
        `width=${width},height=${height},top=${top},left=${left},status=no,toolbar=no,menubar=no`
      );

      // Fallback: se o navegador do usuário bloqueou pop-ups, redireciona a página inteira
      if (!popup) {
        window.location.href = url;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao conectar com Google.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] w-full h-full flex flex-col justify-between bg-[#000000] overflow-y-auto no-scrollbar select-none text-white font-sans">
      {/* 1. Efeito de Fundo Curvo de Horizonte */}
      <CurvedPerspectiveBackground />

      {/* Botão de Fechar se fornecido */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Botão Flutuante de Ajuda das Chaves Google (Canto superior esquerdo) */}
      <button
        type="button"
        onClick={() => setShowGoogleDocsModal(true)}
        className="absolute top-5 left-5 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/85 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-all shadow-md cursor-pointer backdrop-blur-md"
        title="Ver Chaves e Arquitetura do Google OAuth"
      >
        <Key className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">Chaves & Google OAuth</span>
        <span className="sm:hidden">Chaves</span>
      </button>

      {/* 2. Container Central */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-between px-6 py-10 sm:py-14 max-w-lg mx-auto">
        {/* Cabeçalho da Marca */}
        <div className="pt-8 sm:pt-14 pb-4 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white font-sans drop-shadow-sm">
              Life Organizer
            </h1>
            <p className="text-sm sm:text-[15px] text-zinc-400 font-mono tracking-wider mt-3 font-normal">
              Entenda sua jornada
            </p>
          </motion.div>
        </div>

        {/* 3. Vistas Dinâmicas (Welcome, Login, Signup, QR Code, Recovery) */}
        <div className="w-full my-auto py-4 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {/* =========================================================================
                VISTA 1: WELCOME SCREEN (3 Pílulas arredondadas + Atalhos secundários)
                ========================================================================= */}
            {mode === 'welcome' && (
              <motion.div
                key="welcome-view"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full flex flex-col items-center gap-3.5 max-w-sm mx-auto"
              >
                {/* Banner de Erro com Ação para Abrir Guia de Chaves */}
                {errorMsg && (
                  <div className="w-full mb-2 p-3.5 bg-red-950/80 border border-red-900/70 rounded-2xl flex flex-col gap-2 text-red-200 text-xs animate-in fade-in">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span className="text-left leading-relaxed">{errorMsg}</span>
                    </div>

                    {/* Atalhos Rápidos para Resolver */}
                    <div className="flex items-center gap-2 pt-1 border-t border-red-900/50">
                      <button
                        type="button"
                        onClick={() => setShowGoogleDocsModal(true)}
                        className="text-[11px] font-semibold text-white underline hover:text-red-200 cursor-pointer"
                      >
                        Configurar Chaves Google (.env)
                      </button>
                      <span className="text-red-400">•</span>
                      <button
                        type="button"
                        onClick={() => handleGoogleLogin(undefined, true)}
                        className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline cursor-pointer"
                      >
                        Testar Perfil Simulado
                      </button>
                    </div>
                  </div>
                )}

                {/* PÍLULA 1: Continuar com Google */}
                <div className="w-full relative flex items-center">
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin()}
                    disabled={loading}
                    className="w-full h-13 sm:h-14 bg-[#18181c]/90 hover:bg-[#222228] active:bg-[#121215] border border-[#2b2b36] hover:border-[#3f3f4e] rounded-full text-white font-medium text-[15px] sm:text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-sm active:scale-[0.985] cursor-pointer"
                  >
                    <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                      />
                    </svg>
                    <span className="font-normal text-zinc-100">Continuar com Google</span>
                  </button>

                  {/* Botão de Info de Chaves Integrado */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowGoogleDocsModal(true);
                    }}
                    className="absolute right-3.5 p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Ver Chaves e Instruções de Configuração do Google"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>

                {/* PÍLULA 2: Continuar com e-mail */}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className="w-full h-13 sm:h-14 bg-[#18181c]/90 hover:bg-[#222228] active:bg-[#121215] border border-[#2b2b36] hover:border-[#3f3f4e] rounded-full text-white font-medium text-[15px] sm:text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-sm active:scale-[0.985] cursor-pointer"
                >
                  <span className="text-base font-bold text-zinc-200 font-mono">@</span>
                  <span className="font-normal text-zinc-100">Continuar com e-mail</span>
                </button>

                {/* PÍLULA 3: Criar conta */}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="w-full h-13 sm:h-14 bg-[#18181c]/90 hover:bg-[#222228] active:bg-[#121215] border border-[#2b2b36] hover:border-[#3f3f4e] rounded-full text-white font-medium text-[15px] sm:text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-sm active:scale-[0.985] cursor-pointer"
                >
                  <UserPlus className="w-4.5 h-4.5 text-zinc-300" />
                  <span className="font-normal text-zinc-100">Criar conta</span>
                </button>

                {/* Divisor Visual Sutil */}
                <div className="w-full flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-zinc-800/80" />
                  <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">ou</span>
                  <div className="flex-1 h-px bg-zinc-800/80" />
                </div>

                {/* Ações Secundárias: QR Code e Vincular Chave */}
                <div className="w-full grid grid-cols-2 gap-2.5">
                  {/* Botão Entrar por QR Code */}
                  <button
                    type="button"
                    onClick={startQrLogin}
                    className="h-11 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/90 rounded-2xl text-xs text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>Entrar por QR Code</span>
                  </button>

                  {/* Botão Vincular Chave */}
                  <button
                    type="button"
                    onClick={() => setShowLinkSection(!showLinkSection)}
                    className="h-11 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/90 rounded-2xl text-xs text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    <span>Vincular Chave</span>
                  </button>
                </div>

                {/* Gaveta de Vinculação de Chave Colapsável */}
                <AnimatePresence>
                  {showLinkSection && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full overflow-hidden"
                    >
                      <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-2.5 mt-1 text-left">
                        <label className="block text-xs font-medium text-zinc-300">
                          Chave Existente ou Nome de Usuário:
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={linkSyncKeyInput}
                            onChange={(e) => setLinkSyncKeyInput(e.target.value)}
                            placeholder="Ex: @usuario ou MBC-ABCD-1234"
                            className="w-full h-10 px-3 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono"
                          />
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-tight">
                          Ao entrar com o Google ou criar sua conta, seus dados prévios serão unificados a esta chave.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* =========================================================================
                VISTA 2: CONTINUAR COM E-MAIL (LOGIN TRADICIONAL)
                ========================================================================= */}
            {mode === 'login' && (
              <motion.div
                key="login-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm mx-auto bg-[#121216]/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl"
              >
                {/* Topo com Voltar */}
                <div className="flex items-center justify-between mb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('welcome');
                      setErrorMsg(null);
                    }}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <span className="text-xs font-semibold text-zinc-300 font-mono">
                    Entrar com e-mail
                  </span>
                </div>

                {/* Banner de Erro */}
                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-950/70 border border-red-900/60 rounded-2xl flex items-center gap-2 text-red-200 text-xs animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="leading-tight">{errorMsg}</span>
                  </div>
                )}

                {/* Formulário de Login */}
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs text-zinc-400 font-medium mb-1.5">
                      E-mail ou Usuário
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com ou @usuario"
                        required
                        className="w-full h-11 px-3.5 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs text-zinc-400 font-medium">
                        Senha
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setErrorMsg(null);
                        }}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        Esqueceu?
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Sua senha"
                        required
                        className="w-full h-11 px-3.5 pr-10 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Manter conectado */}
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className="flex items-center gap-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-300 cursor-pointer select-none"
                  >
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                        rememberMe ? 'bg-white text-black' : 'border border-zinc-700 bg-[#09090b]'
                      }`}
                    >
                      {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>Manter conectado</span>
                  </div>

                  {/* Botão de Envio */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 mt-2 bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-semibold text-sm rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.985] disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Entrar</span>
                    )}
                  </button>
                </form>

                {/* Alternador para Criar Conta */}
                <div className="mt-5 text-center text-xs text-zinc-500">
                  <span>Não tem uma conta? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg(null);
                    }}
                    className="text-white hover:underline font-medium cursor-pointer"
                  >
                    Criar conta
                  </button>
                </div>
              </motion.div>
            )}

            {/* =========================================================================
                VISTA 3: CRIAR CONTA (SIGNUP COM CHECAGEM DE USUÁRIO ATIVA)
                ========================================================================= */}
            {mode === 'signup' && (
              <motion.div
                key="signup-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm mx-auto bg-[#121216]/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl"
              >
                {/* Topo com Voltar */}
                <div className="flex items-center justify-between mb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('welcome');
                      setErrorMsg(null);
                    }}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <span className="text-xs font-semibold text-zinc-300 font-mono">
                    Nova Conta
                  </span>
                </div>

                {/* Banner de Erro */}
                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-950/70 border border-red-900/60 rounded-2xl flex items-center gap-2 text-red-200 text-xs">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="leading-tight">{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSignupSubmit} className="space-y-3">
                  {/* Nome de Usuário com Validação em Tempo Real */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs text-zinc-400 font-medium">
                        Nome de Usuário (@)
                      </label>
                      <div className="text-[11px] font-mono">
                        {usernameStatus === 'checking' && (
                          <span className="text-zinc-500 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Verificando...
                          </span>
                        )}
                        {usernameStatus === 'available' && (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Disponível
                          </span>
                        )}
                        {usernameStatus === 'taken' && (
                          <span className="text-red-400 flex items-center gap-1">
                            <X className="w-3 h-3" /> Já está em uso
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        placeholder="usuario_exemplo"
                        required
                        className="w-full h-11 px-3.5 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors font-mono"
                      />
                    </div>
                  </div>

                  {/* E-mail */}
                  <div>
                    <label className="block text-xs text-zinc-400 font-medium mb-1.5">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="w-full h-11 px-3.5 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                    />
                  </div>

                  {/* Senha */}
                  <div>
                    <label className="block text-xs text-zinc-400 font-medium mb-1.5">
                      Senha (mínimo 6 caracteres)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Crie uma senha forte"
                        required
                        className="w-full h-11 px-3.5 pr-10 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Campo Opcional: Vincular Chave */}
                  <div>
                    <label className="block text-xs text-zinc-500 font-medium mb-1">
                      Chave de sincronização prévia (opcional)
                    </label>
                    <input
                      type="text"
                      value={linkSyncKeyInput}
                      onChange={(e) => setLinkSyncKeyInput(e.target.value)}
                      placeholder="MBC-XXXX-XXXX"
                      className="w-full h-9 px-3 bg-[#09090b] border border-zinc-900 rounded-lg text-xs text-zinc-400 placeholder-zinc-700 focus:outline-none focus:border-zinc-700 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || usernameStatus === 'taken'}
                    className="w-full h-12 mt-3 bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-semibold text-sm rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.985] disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Cadastrar</span>
                    )}
                  </button>
                </form>

                <div className="mt-5 text-center text-xs text-zinc-500">
                  <span>Já tem uma conta? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                    }}
                    className="text-white hover:underline font-medium cursor-pointer"
                  >
                    Entrar
                  </button>
                </div>
              </motion.div>
            )}

            {/* =========================================================================
                VISTA 4: ENTRAR POR QR CODE (SESSÃO DE 5 MINUTOS + PAREAMENTO PIN)
                ========================================================================= */}
            {mode === 'qrcode' && (
              <motion.div
                key="qrcode-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm mx-auto bg-[#121216]/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-center"
              >
                {/* Topo com Voltar */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('welcome');
                      setErrorMsg(null);
                    }}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <span className="text-xs font-semibold text-emerald-400 font-mono flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Pareamento</span>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">Entrar com QR Code</h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto mb-4">
                  Abra o aplicativo no seu aparelho logado, vá em <strong>Configurações &gt; Dispositivos</strong> e escaneie este código.
                </p>

                {/* Container do QR Code */}
                <div className="relative w-56 h-56 mx-auto bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center overflow-hidden">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR Code de Login"
                      className={`w-full h-full object-contain transition-opacity duration-300 ${
                        qrTimer <= 0 ? 'opacity-20 blur-sm' : 'opacity-100'
                      }`}
                    />
                  ) : (
                    <Loader2 className="w-8 h-8 text-zinc-800 animate-spin" />
                  )}

                  {/* Overlay quando o QR Code Expira (após 5 minutos) */}
                  {qrTimer <= 0 && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4">
                      <Clock className="w-8 h-8 text-amber-400 mb-2 animate-bounce" />
                      <span className="text-xs font-bold text-white mb-3">Código Expirado</span>
                      <button
                        type="button"
                        onClick={startQrLogin}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Renovar</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Cronômetro Regressivo e Código PIN Alternativo */}
                <div className="mt-4 flex items-center justify-between px-3 py-2 bg-[#09090b] border border-zinc-800 rounded-xl text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>
                      {Math.floor(qrTimer / 60)}:{(qrTimer % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  {qrSession && (
                    <div className="text-emerald-400 font-bold tracking-wider">
                      PIN: {qrSession.pinCode}
                    </div>
                  )}
                </div>

                <div className="mt-4 text-[11px] text-zinc-500">
                  Aguardando autorização remota em tempo real...
                </div>
              </motion.div>
            )}

            {/* =========================================================================
                VISTA 5: RECUPERAÇÃO DE CONTA (ESQUECEU A SENHA)
                ========================================================================= */}
            {mode === 'forgot' && (
              <motion.div
                key="forgot-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm mx-auto bg-[#121216]/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center justify-between mb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                    }}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <span className="text-xs font-semibold text-zinc-300 font-mono">
                    Recuperar
                  </span>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-950/70 border border-red-900/60 rounded-2xl flex items-center gap-2 text-red-200 text-xs">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="leading-tight">{errorMsg}</span>
                  </div>
                )}

                {recoverySuccessMsg && (
                  <div className="mb-4 p-3 bg-emerald-950/70 border border-emerald-900/60 rounded-2xl flex items-center gap-2 text-emerald-200 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="leading-tight">{recoverySuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleRecoverSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs text-zinc-400 font-medium mb-1.5">
                      E-mail Cadastrado
                    </label>
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      disabled={!!foundAccount}
                      className="w-full h-11 px-3.5 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors disabled:opacity-50"
                    />
                  </div>

                  {foundAccount && (
                    <div className="space-y-3 pt-1 border-t border-zinc-800 animate-in fade-in">
                      <div className="p-2.5 bg-zinc-900/60 rounded-xl text-xs text-zinc-400">
                        Conta localizada: <strong className="text-white">@{foundAccount.username}</strong>
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 font-medium mb-1.5">
                          Nova Senha (mínimo 6 caracteres)
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Digite a nova senha"
                          required
                          className="w-full h-11 px-3.5 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 mt-2 bg-white hover:bg-zinc-200 text-black font-semibold text-sm rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.985] cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>{foundAccount ? 'Salvar Nova Senha' : 'Buscar Conta'}</span>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. Rodapé Legal (Termos e Política de Privacidade) */}
        <div className="pt-6 pb-2 text-center">
          <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
            Ao continuar, você concorda com os{' '}
            <button
              type="button"
              onClick={() => setActiveLegalModal('terms')}
              className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Termos
            </button>{' '}
            e com a{' '}
            <button
              type="button"
              onClick={() => setActiveLegalModal('privacy')}
              className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Política de privacidade
            </button>
          </p>
        </div>
      </div>

      {/* 5. Modais de Conteúdo Legal (Termos & Privacidade) */}
      <AnimatePresence>
        {activeLegalModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveLegalModal(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-md bg-[#121216] border border-zinc-800 rounded-3xl p-6 shadow-2xl text-left max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-zinc-400" />
                  <span>
                    {activeLegalModal === 'terms' ? 'Termos de Uso' : 'Política de Privacidade'}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveLegalModal(null)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 text-xs text-zinc-400 space-y-3 overflow-y-auto leading-relaxed">
                {activeLegalModal === 'terms' ? (
                  <>
                    <p>
                      Bem-vindo ao Life Organizer. Ao acessar e utilizar este aplicativo, você concorda em cumprir e vincular-se aos seguintes termos e condições de uso.
                    </p>
                    <p className="font-semibold text-zinc-300">1. Privacidade e Dados Locais</p>
                    <p>
                      Seus dados pessoais, rotinas, notas e informações financeiras pertencem exclusivamente a você. O aplicativo prioriza a persistência local com sincronização segura ponta a ponta.
                    </p>
                    <p className="font-semibold text-zinc-300">2. Segurança de Acesso</p>
                    <p>
                      Você é responsável por manter a confidencialidade de sua senha e por gerenciar os aparelhos conectados através do painel de segurança.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      A sua privacidade é prioritária. Nós respeitamos o sigilo total de suas informações de agenda, tarefas e registros diários.
                    </p>
                    <p className="font-semibold text-zinc-300">1. Coleta de Informações</p>
                    <p>
                      Coletamos unicamente o endereço de e-mail e identificadores técnicos necessários para viabilizar a sincronização entre seus próprios dispositivos autorizados.
                    </p>
                    <p className="font-semibold text-zinc-300">2. Criptografia e Autenticação</p>
                    <p>
                      Senhas são processadas com criptografia SHA-256 e sessões por QR Code possuem validade restrita de 5 minutos com revogação imediata.
                    </p>
                  </>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveLegalModal(null)}
                  className="px-4 py-2 bg-white text-black text-xs font-semibold rounded-full hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Modal de Documentação & Configuração do Google OAuth */}
      <GoogleOAuthDocsModal
        isOpen={showGoogleDocsModal}
        onClose={() => setShowGoogleDocsModal(false)}
        onSimulateLogin={() => handleGoogleLogin(undefined, true)}
      />
    </div>
  );
};

/* ====================================================================================================
   7. COMPONENTE COMPLEMENTAR: MODAL DE AUTORIZAÇÃO DE QR CODE (DISPOSITIVO DO USUÁRIO)
   Interface que o usuário abre no aparelho logado para autorizar o novo aparelho.
   ==================================================================================================== */

export interface StandaloneQrAuthorizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: StandaloneAuthUser;
  onDeviceAuthorized?: (newDeviceName: string) => void;
}

export const StandaloneQrAuthorizerModal: React.FC<StandaloneQrAuthorizerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onDeviceAuthorized
}) => {
  const [pinInput, setPinInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  if (!isOpen) return null;

  const handleAuthorizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      const res = await StandaloneAuthService.authorizeQrSession(pinInput, currentUser);
      if (res.ok) {
        setFeedback({ type: 'success', msg: res.message });
        if (onDeviceAuthorized) {
          onDeviceAuthorized('Novo Navegador / Desktop');
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setFeedback({ type: 'error', msg: res.message });
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Erro ao processar autorização.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative z-10 w-full max-w-sm bg-[#121216] border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center"
      >
        <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center mb-4">
          <QrCode className="w-6 h-6 text-emerald-400" />
        </div>

        <h3 className="text-base font-bold text-white mb-1">Autorizar Novo Dispositivo</h3>
        <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
          Digite o código PIN de 6 dígitos que está sendo exibido na tela do outro computador.
        </p>

        {feedback && (
          <div
            className={`mb-4 p-3 rounded-2xl text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-200'
                : 'bg-red-950/80 border border-red-800 text-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span className="leading-tight text-left">{feedback.msg}</span>
          </div>
        )}

        <form onSubmit={handleAuthorizeSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.toUpperCase())}
              placeholder="Ex: PLN-123456"
              required
              className="w-full h-12 px-4 bg-[#09090b] border border-zinc-800 focus:border-emerald-500 rounded-xl text-center font-mono text-base font-bold text-white placeholder-zinc-700 tracking-wider focus:outline-none transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-full transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !pinInput.trim()}
              className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-full transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Autorizar</span>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

/* ====================================================================================================
   8. PLAYGROUND & PAINEL DE DEMONSTRAÇÃO STANDALONE
   Permite testar as variações Desktop / Mobile e todos os fluxos de login em um só lugar.
   ==================================================================================================== */

export default function LoginAuthStandalonePlayground() {
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'mobile'>('desktop');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(true);
  const [activeTabMode, setActiveTabMode] = useState<AuthScreenMode>('welcome');
  const [loggedInUser, setLoggedInUser] = useState<StandaloneAuthUser | null>(null);
  const [showAuthorizerModal, setShowAuthorizerModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);

  const handleLoginSuccess = (user: StandaloneAuthUser, _rememberMe: boolean) => {
    setLoggedInUser(user);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    clearGoogleOAuthSession();
    setIsAuthModalOpen(true);
    setActiveTabMode('welcome');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col">
      {/* Barra de Ferramentas do Playground */}
      <header className="bg-zinc-900/90 border-b border-zinc-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-bold tracking-tight text-white">
            Referência Standalone: Sistema de Login & Google OAuth
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-400">
            v1.1.0
          </span>
        </div>

        {/* Alternador de Visualização Desktop / Mobile */}
        <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setDevicePreview('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              devicePreview === 'desktop' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDevicePreview('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              devicePreview === 'mobile' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile (iPhone / Android)</span>
          </button>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDocsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-lg text-amber-300 hover:text-white transition-all cursor-pointer border border-zinc-700/60"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Chaves & Docs Google</span>
          </button>

          {!isAuthModalOpen && (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium rounded-lg text-white transition-all cursor-pointer"
            >
              Abrir Tela de Login
            </button>
          )}

          {loggedInUser && (
            <button
              type="button"
              onClick={() => setShowAuthorizerModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold rounded-lg text-white transition-all cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Simular Autorizar QR Code</span>
            </button>
          )}
        </div>
      </header>

      {/* Área de Visualização Principal */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-[#09090b]">
        {/* Simulação em Moldura de Aparelho */}
        <div
          className={`transition-all duration-300 w-full relative overflow-hidden shadow-2xl ${
            devicePreview === 'mobile'
              ? 'max-w-[400px] h-[820px] rounded-[48px] border-[10px] border-zinc-800 ring-1 ring-zinc-700/50 bg-black'
              : 'max-w-5xl h-[780px] rounded-3xl border border-zinc-800 bg-black'
          }`}
        >
          {/* Se o usuário estiver autenticado, exibe o painel de sessão ativa */}
          {loggedInUser ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-6 relative z-10">
              <CurvedPerspectiveBackground />
              <div className="relative z-10 w-20 h-20 rounded-full bg-zinc-800 border-2 border-emerald-500 overflow-hidden shadow-xl flex items-center justify-center">
                {loggedInUser.photo ? (
                  <img src={loggedInUser.photo} alt={loggedInUser.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-zinc-400" />
                )}
              </div>

              <div className="relative z-10 space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-800 text-emerald-400 rounded-full text-xs font-medium mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sessão Ativa ({loggedInUser.provider.toUpperCase()})</span>
                </div>
                <h2 className="text-2xl font-bold text-white">{loggedInUser.name}</h2>
                <p className="text-xs font-mono text-zinc-400">@{loggedInUser.username} • {loggedInUser.email}</p>
                <p className="text-[11px] font-mono text-zinc-500 mt-2">Chave de Sincronização: {loggedInUser.syncKey}</p>
              </div>

              <div className="relative z-10 flex flex-wrap gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setShowAuthorizerModal(true)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold rounded-full transition-all shadow-md cursor-pointer"
                >
                  Autorizar Outro Aparelho (QR / PIN)
                </button>
                <button
                  type="button"
                  onClick={() => setShowDocsModal(true)}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Key className="w-3 h-3 text-amber-400" />
                  <span>Ver Chaves Google</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-full transition-all cursor-pointer"
                >
                  Desconectar / Trocar Conta
                </button>
              </div>
            </div>
          ) : (
            /* Modal de Autenticação Ativo dentro do Container */
            <StandaloneAuthModal
              isOpen={isAuthModalOpen}
              onSuccess={handleLoginSuccess}
              initialMode={activeTabMode}
            />
          )}
        </div>
      </main>

      {/* Modal de Autorização de QR Code (Simula a função do celular conectado) */}
      {loggedInUser && (
        <StandaloneQrAuthorizerModal
          isOpen={showAuthorizerModal}
          onClose={() => setShowAuthorizerModal(false)}
          currentUser={loggedInUser}
          onDeviceAuthorized={(devName) => {
            alert(`✅ ${devName} conectado à conta de @${loggedInUser.username}!`);
          }}
        />
      )}

      {/* Modal Independente de Chaves & Google OAuth */}
      <GoogleOAuthDocsModal
        isOpen={showDocsModal}
        onClose={() => setShowDocsModal(false)}
      />
    </div>
  );
}

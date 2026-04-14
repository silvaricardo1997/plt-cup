# Pilotis Cup — Plano de Implementação Inicial

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a base do projeto Pilotis Cup com autenticação Supabase, banco de dados modelado e as primeiras 3 telas (lista de sessões, criar sessão, login/cadastro).

**Architecture:** Next.js 16 App Router com Route Groups `(auth)` e `(app)`. Server Components buscam dados diretamente; Server Actions fazem mutations. Supabase SSR gerencia sessão via middleware e cookies — nunca localStorage.

**Tech Stack:** Next.js 16, Supabase (@supabase/ssr), Tailwind CSS 4, TypeScript, Vitest

---

> **Atenção:** Todo o trabalho acontece dentro de `pilotis-cup/` (o app Next.js), não na raiz do git repo. Todos os caminhos de arquivo são relativos a `pilotis-cup/`.

> **Next.js 16 breaking changes:**
> - `params` e `searchParams` em pages/layouts são agora `Promise` — sempre use `await params` e `await searchParams`
> - Use os helpers globais `PageProps` e `LayoutProps` (sem import) para tipar props de pages e layouts
> - `refresh()` de `next/cache` substitui `router.refresh()` em Server Actions

---

## Mapa de Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `lib/supabase/client.ts` | Supabase browser client (uso em Client Components) |
| `lib/supabase/server.ts` | Supabase server client (uso em Server Components e Actions) |
| `middleware.ts` | Intercepta requests, atualiza sessão, protege rotas `(app)` |
| `supabase/migrations/0001_initial.sql` | Schema completo do banco |
| `types/database.ts` | Tipos TypeScript derivados do schema |
| `lib/i18n/pt-BR.json` | Todos os textos da UI em português |
| `lib/score.ts` | Utilitário `calculateTotalScore` (testável) |
| `app/layout.tsx` | Root layout — fontes Raleway + Caveat, lang="pt-BR" |
| `app/globals.css` | Variáveis CSS da paleta de marca, reset base |
| `app/(auth)/layout.tsx` | Layout das páginas de auth (sem header) |
| `app/(auth)/login/page.tsx` | Tela de login |
| `app/(auth)/cadastro/page.tsx` | Tela de cadastro |
| `app/(auth)/actions.ts` | Server Actions: signIn, signUp, signOut |
| `app/(app)/layout.tsx` | Layout com header (logo + avatar) |
| `app/(app)/page.tsx` | Home — lista de sessões |
| `app/(app)/sessoes/nova/page.tsx` | Formulário criar sessão |
| `app/(app)/sessoes/actions.ts` | Server Actions: createSession |
| `components/sessions/SessionCard.tsx` | Card de sessão individual |
| `components/sessions/EmptyState.tsx` | Estado vazio da lista |
| `components/ui/Button.tsx` | Botão reutilizável com variantes |

---

## Task 1: Instalar dependências e configurar Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

- [ ] **Step 1: Instalar Supabase SSR e Vitest**

```bash
cd pilotis-cup
npm install @supabase/supabase-js @supabase/ssr
npm install -D vitest @vitejs/plugin-react @testing-library/react jsdom
```

- [ ] **Step 2: Criar vitest.config.ts**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 3: Criar vitest.setup.ts**

```ts
// vitest.setup.ts
import '@testing-library/react'
```

- [ ] **Step 4: Adicionar script de test no package.json**

Adicione dentro de `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verificar que Vitest executa sem erros**

```bash
npm test
```

Esperado: `No test files found` (sem falha).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts vitest.setup.ts
git commit -m "chore: add supabase-ssr and vitest"
```

---

## Task 2: Variáveis de ambiente

**Files:**
- Create: `.env.local`
- Create: `.env.example`

- [ ] **Step 1: Criar .env.local**

Acesse o painel do Supabase → Settings → API e copie os valores.

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

- [ ] **Step 2: Criar .env.example (sem valores reais)**

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 3: Garantir que .env.local está no .gitignore**

```bash
grep -q ".env.local" .gitignore && echo "OK" || echo ".env.local está faltando no .gitignore"
```

Se não estiver, adicione manualmente.

- [ ] **Step 4: Commit**

```bash
git add .env.example .gitignore
git commit -m "chore: add env example and verify gitignore"
```

---

## Task 3: Clientes Supabase (browser + server)

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`

- [ ] **Step 1: Criar client browser**

```ts
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Criar client server**

```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignorado em Server Components — middleware lida com refresh de sessão
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/
git commit -m "feat: add supabase browser and server clients"
```

---

## Task 4: Middleware de autenticação

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Criar middleware**

```ts
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redireciona para login se não autenticado e acessando rota protegida
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/cadastro')

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redireciona para home se autenticado e tentando acessar login/cadastro
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: add supabase auth middleware"
```

---

## Task 5: Migração do banco de dados

**Files:**
- Create: `supabase/migrations/0001_initial.sql`

- [ ] **Step 1: Criar arquivo de migração**

```sql
-- supabase/migrations/0001_initial.sql

-- Sessions
CREATE TABLE sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  date          date NOT NULL,
  notes         text,
  status        text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'active', 'completed')),
  created_by    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_token  text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Samples (amostras dentro de uma sessão)
CREATE TABLE samples (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  code        text NOT NULL,
  label       text,
  position    int NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Session evaluators (quem participa)
CREATE TABLE session_evaluators (
  session_id  uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('coordinator', 'evaluator')),
  joined_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, user_id)
);

-- Evaluations (avaliação SCA por avaliador por amostra)
CREATE TABLE evaluations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id     uuid NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
  evaluator_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fragrance     numeric(4,2),
  flavor        numeric(4,2),
  aftertaste    numeric(4,2),
  acidity       numeric(4,2),
  body          numeric(4,2),
  balance       numeric(4,2),
  overall       numeric(4,2),
  defects       int NOT NULL DEFAULT 0,
  taint         int NOT NULL DEFAULT 0,
  notes         text,
  status        text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'submitted')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  submitted_at  timestamptz,
  UNIQUE (sample_id, evaluator_id)
);

-- Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_evaluators ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Policies: sessions
CREATE POLICY "users see their own sessions"
  ON sessions FOR SELECT
  USING (
    created_by = auth.uid() OR
    id IN (SELECT session_id FROM session_evaluators WHERE user_id = auth.uid())
  );

CREATE POLICY "authenticated users create sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "coordinator updates session"
  ON sessions FOR UPDATE
  USING (created_by = auth.uid());

-- Policies: samples
CREATE POLICY "evaluators see samples"
  ON samples FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM sessions WHERE
        created_by = auth.uid() OR
        id IN (SELECT session_id FROM session_evaluators WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "coordinator manages samples"
  ON samples FOR INSERT
  WITH CHECK (
    session_id IN (SELECT id FROM sessions WHERE created_by = auth.uid())
  );

-- Policies: session_evaluators
CREATE POLICY "users see evaluators of their sessions"
  ON session_evaluators FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM sessions WHERE
        created_by = auth.uid() OR
        id IN (SELECT session_id FROM session_evaluators WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "coordinator adds evaluators"
  ON session_evaluators FOR INSERT
  WITH CHECK (
    session_id IN (SELECT id FROM sessions WHERE created_by = auth.uid())
  );

-- Policies: evaluations
CREATE POLICY "evaluators see their evaluations"
  ON evaluations FOR SELECT
  USING (evaluator_id = auth.uid());

CREATE POLICY "evaluators manage their evaluations"
  ON evaluations FOR INSERT
  WITH CHECK (evaluator_id = auth.uid());

CREATE POLICY "evaluators update their drafts"
  ON evaluations FOR UPDATE
  USING (evaluator_id = auth.uid() AND status = 'draft');
```

- [ ] **Step 2: Executar a migração no Supabase**

No painel do Supabase → SQL Editor, cole e execute o conteúdo do arquivo acima.

Ou via CLI (se instalado):
```bash
supabase db push
```

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add initial database migration with RLS"
```

---

## Task 6: Tipos TypeScript do banco

**Files:**
- Create: `types/database.ts`

- [ ] **Step 1: Criar tipos manualmente (sync com o schema)**

```ts
// types/database.ts

export type SessionStatus = 'draft' | 'active' | 'completed'
export type EvaluationStatus = 'draft' | 'submitted'
export type EvaluatorRole = 'coordinator' | 'evaluator'

export interface Session {
  id: string
  name: string
  date: string
  notes: string | null
  status: SessionStatus
  created_by: string
  invite_token: string
  created_at: string
}

export interface Sample {
  id: string
  session_id: string
  code: string
  label: string | null
  position: number
  created_at: string
}

export interface SessionEvaluator {
  session_id: string
  user_id: string
  role: EvaluatorRole
  joined_at: string
}

export interface Evaluation {
  id: string
  sample_id: string
  evaluator_id: string
  fragrance: number | null
  flavor: number | null
  aftertaste: number | null
  acidity: number | null
  body: number | null
  balance: number | null
  overall: number | null
  defects: number
  taint: number
  notes: string | null
  status: EvaluationStatus
  created_at: string
  submitted_at: string | null
}

// View type: sessão com contagens (usada na lista)
export interface SessionSummary extends Session {
  sample_count: number
  evaluator_count: number
}

export interface Database {
  public: {
    Tables: {
      sessions: { Row: Session; Insert: Omit<Session, 'id' | 'created_at' | 'invite_token'>; Update: Partial<Session> }
      samples: { Row: Sample; Insert: Omit<Sample, 'id' | 'created_at'>; Update: Partial<Sample> }
      session_evaluators: { Row: SessionEvaluator; Insert: SessionEvaluator; Update: Partial<SessionEvaluator> }
      evaluations: { Row: Evaluation; Insert: Omit<Evaluation, 'id' | 'created_at'>; Update: Partial<Evaluation> }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add types/
git commit -m "feat: add database TypeScript types"
```

---

## Task 7: i18n e utilitário de pontuação

**Files:**
- Create: `lib/i18n/pt-BR.json`
- Create: `lib/score.ts`
- Create: `lib/score.test.ts`

- [ ] **Step 1: Escrever o teste para calculateTotalScore (TDD)**

```ts
// lib/score.test.ts
import { describe, it, expect } from 'vitest'
import { calculateTotalScore } from './score'

describe('calculateTotalScore', () => {
  it('retorna null quando nenhum atributo foi preenchido', () => {
    expect(calculateTotalScore({
      fragrance: null, flavor: null, aftertaste: null,
      acidity: null, body: null, balance: null, overall: null,
      defects: 0, taint: 0,
    })).toBeNull()
  })

  it('soma os atributos preenchidos e subtrai defeitos', () => {
    expect(calculateTotalScore({
      fragrance: 8.0, flavor: 8.0, aftertaste: 7.5,
      acidity: 8.0, body: 7.5, balance: 8.0, overall: 8.0,
      defects: 0, taint: 0,
    })).toBe(55.0)
  })

  it('subtrai defeitos * 2 e taint * 4', () => {
    expect(calculateTotalScore({
      fragrance: 8.0, flavor: 8.0, aftertaste: 8.0,
      acidity: 8.0, body: 8.0, balance: 8.0, overall: 8.0,
      defects: 1, taint: 1,
    })).toBe(56.0 - 2 - 4) // 50.0
  })
})
```

- [ ] **Step 2: Executar o teste para confirmar que falha**

```bash
npm test
```

Esperado: FAIL — `Cannot find module './score'`

- [ ] **Step 3: Implementar calculateTotalScore**

```ts
// lib/score.ts

interface ScoreInput {
  fragrance: number | null
  flavor: number | null
  aftertaste: number | null
  acidity: number | null
  body: number | null
  balance: number | null
  overall: number | null
  defects: number
  taint: number
}

export function calculateTotalScore(input: ScoreInput): number | null {
  const attributes = [
    input.fragrance,
    input.flavor,
    input.aftertaste,
    input.acidity,
    input.body,
    input.balance,
    input.overall,
  ]

  const filled = attributes.filter((v): v is number => v !== null)
  if (filled.length === 0) return null

  const sum = filled.reduce((acc, v) => acc + v, 0)
  return sum - input.defects * 2 - input.taint * 4
}
```

- [ ] **Step 4: Executar testes e confirmar que passam**

```bash
npm test
```

Esperado: 3 testes PASS.

- [ ] **Step 5: Criar pt-BR.json**

```json
// lib/i18n/pt-BR.json
{
  "app.name": "Pilotis Cup",
  "app.tagline": "cafés especiais",

  "nav.sessions": "Sessões",
  "nav.profile": "Perfil",
  "nav.logout": "Sair",

  "session.list.title": "Suas sessões",
  "session.list.empty.title": "Nenhuma sessão ainda",
  "session.list.empty.description": "Crie sua primeira sessão de cupping para começar as avaliações.",
  "session.list.empty.cta": "Criar primeira sessão",
  "session.create.button": "+ Nova Sessão",

  "session.create.title": "Nova Sessão",
  "session.create.name.label": "Nome da sessão",
  "session.create.name.placeholder": "ex: Safra 2025 — Lote A",
  "session.create.date.label": "Data",
  "session.create.notes.label": "Observações (opcional)",
  "session.create.notes.placeholder": "Notas gerais da sessão...",
  "session.create.samples.label": "Amostras",
  "session.create.samples.add": "+ Adicionar amostra",
  "session.create.submit": "Criar Sessão",
  "session.create.draft": "Salvar Rascunho",

  "session.status.draft": "Rascunho",
  "session.status.active": "Em andamento",
  "session.status.completed": "Concluída",

  "session.meta.samples": "amostras",
  "session.meta.evaluators": "avaliadores",

  "auth.login.title": "Entrar",
  "auth.login.email": "E-mail",
  "auth.login.password": "Senha",
  "auth.login.submit": "Entrar",
  "auth.login.no_account": "Não tem conta?",
  "auth.login.signup_link": "Cadastre-se",

  "auth.signup.title": "Criar conta",
  "auth.signup.email": "E-mail",
  "auth.signup.password": "Senha",
  "auth.signup.submit": "Criar conta",
  "auth.signup.has_account": "Já tem conta?",
  "auth.signup.login_link": "Entrar",

  "error.required": "Campo obrigatório",
  "error.invalid_email": "E-mail inválido",
  "error.generic": "Erro ao carregar dados",
  "error.auth": "E-mail ou senha incorretos",

  "state.loading": "Carregando...",
  "action.back": "Voltar",
  "action.cancel": "Cancelar",
  "action.save": "Salvar"
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/
git commit -m "feat: add i18n pt-BR, score utility and tests"
```

---

## Task 8: Root layout — fontes e globals.css

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Atualizar globals.css com variáveis de marca**

```css
/* app/globals.css */
@import "tailwindcss";

:root {
  --color-blue-medium: #0b8bcc;
  --color-blue-dark: #015484;
  --color-navy: #201b54;
  --color-orange: #f68721;
  --color-gray-dark: #434344;
  --color-blue-gray: #506a6e;
  --color-cream: #fbf8ec;
  --color-gray-light: #e8e5e2;
  --color-gold: #aa9577;
}

* {
  box-sizing: border-box;
}

html, body {
  height: 100%;
}
```

- [ ] **Step 2: Atualizar root layout com Raleway + Caveat**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Raleway, Caveat } from 'next/font/google'
import './globals.css'

const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
})

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Pilotis Cup',
  description: 'Avaliação de cafés especiais',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-BR"
      className={`${raleway.variable} ${caveat.variable} h-full`}
    >
      <body
        className="min-h-full flex flex-col font-[family-name:var(--font-raleway)] bg-[#fbf8ec] antialiased"
      >
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Iniciar o servidor de desenvolvimento e verificar que não há erros de compilação**

```bash
npm run dev
```

Abra http://localhost:3000 — deve carregar sem erros no terminal.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: configure brand fonts (Raleway + Caveat) and CSS variables"
```

---

## Task 9: Componente Button reutilizável

**Files:**
- Create: `components/ui/Button.tsx`

- [ ] **Step 1: Criar Button com variantes**

```tsx
// components/ui/Button.tsx
import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base = 'rounded-[10px] px-5 py-3 text-sm font-bold transition-opacity disabled:opacity-50 cursor-pointer'

  const variants = {
    primary: 'bg-[#015484] text-white hover:opacity-90',
    secondary: 'bg-[#f68721] text-white hover:opacity-90',
    ghost: 'bg-transparent text-[#506a6e] hover:text-[#201b54]',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/
git commit -m "feat: add Button component with variants"
```

---

## Task 10: Auth pages (login + cadastro)

**Files:**
- Create: `app/(auth)/layout.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/cadastro/page.tsx`
- Create: `app/(auth)/actions.ts`

- [ ] **Step 1: Criar layout de auth**

```tsx
// app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 bg-[#fbf8ec]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-[#201b54] tracking-widest">
            PILOTIS
          </h1>
          <p
            className="font-[family-name:var(--font-caveat)] text-[#f68721] text-base mt-1"
          >
            cafés especiais
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Criar Server Actions de auth**

```ts
// app/(auth)/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/login?error=auth')
  }

  redirect('/')
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect('/cadastro?error=auth')
  }

  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

- [ ] **Step 3: Criar tela de login**

```tsx
// app/(auth)/login/page.tsx
import Link from 'next/link'
import { signIn } from '../actions'
import { Button } from '@/components/ui/Button'

export default async function LoginPage(props: PageProps<'/login'>) {
  const { error } = await props.searchParams

  return (
    <form action={signIn} className="flex flex-col gap-4">
      {error === 'auth' && (
        <p className="text-sm text-red-600 text-center bg-red-50 rounded-lg p-3">
          E-mail ou senha incorretos
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label
          htmlFor="email"
          className="text-[10px] font-bold uppercase tracking-widest text-[#506a6e]"
        >
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="border border-[#e8e5e2] rounded-lg px-3 py-2.5 text-sm bg-white text-[#201b54] focus:outline-none focus:border-[#0b8bcc]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="password"
          className="text-[10px] font-bold uppercase tracking-widest text-[#506a6e]"
        >
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="border border-[#e8e5e2] rounded-lg px-3 py-2.5 text-sm bg-white text-[#201b54] focus:outline-none focus:border-[#0b8bcc]"
        />
      </div>

      <Button type="submit" fullWidth>
        Entrar
      </Button>

      <p className="text-center text-sm text-[#506a6e]">
        Não tem conta?{' '}
        <Link href="/cadastro" className="font-bold text-[#015484] hover:underline">
          Cadastre-se
        </Link>
      </p>
    </form>
  )
}
```

- [ ] **Step 4: Criar tela de cadastro**

```tsx
// app/(auth)/cadastro/page.tsx
import Link from 'next/link'
import { signUp } from '../actions'
import { Button } from '@/components/ui/Button'

export default async function CadastroPage(props: PageProps<'/cadastro'>) {
  const { error } = await props.searchParams

  return (
    <form action={signUp} className="flex flex-col gap-4">
      {error === 'auth' && (
        <p className="text-sm text-red-600 text-center bg-red-50 rounded-lg p-3">
          Erro ao criar conta. Tente novamente.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label
          htmlFor="email"
          className="text-[10px] font-bold uppercase tracking-widest text-[#506a6e]"
        >
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="border border-[#e8e5e2] rounded-lg px-3 py-2.5 text-sm bg-white text-[#201b54] focus:outline-none focus:border-[#0b8bcc]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="password"
          className="text-[10px] font-bold uppercase tracking-widest text-[#506a6e]"
        >
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={6}
          className="border border-[#e8e5e2] rounded-lg px-3 py-2.5 text-sm bg-white text-[#201b54] focus:outline-none focus:border-[#0b8bcc]"
        />
      </div>

      <Button type="submit" fullWidth>
        Criar conta
      </Button>

      <p className="text-center text-sm text-[#506a6e]">
        Já tem conta?{' '}
        <Link href="/login" className="font-bold text-[#015484] hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  )
}
```

- [ ] **Step 5: Testar manualmente**

```bash
npm run dev
```

1. Acesse http://localhost:3000 → deve redirecionar para /login
2. Cadastre-se em /cadastro com e-mail e senha
3. Deve redirecionar para / após cadastro

- [ ] **Step 6: Commit**

```bash
git add app/\(auth\)/
git commit -m "feat: add auth pages (login, cadastro) and server actions"
```

---

## Task 11: App layout com header

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/header.tsx`

- [ ] **Step 1: Criar componente Header**

```tsx
// app/(app)/header.tsx
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'EU'

  return (
    <header className="bg-[#015484] text-white px-5 py-4 flex items-center justify-between sticky top-0 z-10">
      <div>
        <span className="font-black text-base tracking-widest">PILOTIS</span>
        <span
          className="block font-[family-name:var(--font-caveat)] text-[#f68721] text-xs leading-none mt-0.5"
        >
          cafés especiais
        </span>
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="w-9 h-9 rounded-full bg-[#0b8bcc] flex items-center justify-center text-xs font-bold hover:opacity-80 transition-opacity"
          title="Sair"
        >
          {initials}
        </button>
      </form>
    </header>
  )
}
```

- [ ] **Step 2: Criar layout do app**

```tsx
// app/(app)/layout.tsx
import { Header } from './header'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Verificar que header aparece em http://localhost:3000**

```bash
npm run dev
```

Acesse / — o header azul com PILOTIS e o avatar deve aparecer.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/
git commit -m "feat: add app layout with sticky header"
```

---

## Task 12: Componentes SessionCard e EmptyState

**Files:**
- Create: `components/sessions/SessionCard.tsx`
- Create: `components/sessions/EmptyState.tsx`

- [ ] **Step 1: Criar SessionCard**

```tsx
// components/sessions/SessionCard.tsx
import Link from 'next/link'
import type { SessionStatus, SessionSummary } from '@/types/database'

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; bg: string; border: string }> = {
  draft: {
    label: 'Rascunho',
    color: 'text-[#f68721]',
    bg: 'bg-[#fff3e0]',
    border: 'border-[#f68721]',
  },
  active: {
    label: 'Em andamento',
    color: 'text-[#015484]',
    bg: 'bg-[#e3f2fb]',
    border: 'border-[#0b8bcc]',
  },
  completed: {
    label: 'Concluída',
    color: 'text-[#434344]',
    bg: 'bg-[#e8e5e2]',
    border: 'border-[#434344]',
  },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function SessionCard({ session }: { session: SessionSummary }) {
  const status = STATUS_CONFIG[session.status]

  return (
    <Link
      href={`/sessoes/${session.id}`}
      className={`block bg-white rounded-xl px-4 py-3.5 border-l-4 ${status.border} shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[13px] text-[#201b54] truncate">
            {session.name}
          </p>
          <p className="text-[11px] text-[#506a6e] mt-1">
            {session.sample_count} amostras · {session.evaluator_count} avaliadores
          </p>
        </div>
        <span
          className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${status.color} ${status.bg}`}
        >
          {status.label}
        </span>
      </div>
      <p className="text-[10px] text-[#aa9577] mt-2">
        {formatDate(session.date)}
      </p>
    </Link>
  )
}
```

- [ ] **Step 2: Criar EmptyState**

```tsx
// components/sessions/EmptyState.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-6 py-16">
      <div className="w-14 h-14 rounded-full bg-[#e3f2fb] flex items-center justify-center mb-4">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0b8bcc"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      </div>
      <p className="font-bold text-[14px] text-[#201b54] mb-2">
        Nenhuma sessão ainda
      </p>
      <p className="text-[12px] text-[#506a6e] leading-relaxed mb-6 max-w-xs">
        Crie sua primeira sessão de cupping para começar as avaliações.
      </p>
      <Button variant="primary" asChild>
        <Link href="/sessoes/nova">Criar primeira sessão</Link>
      </Button>
    </div>
  )
}
```

> **Nota:** O `asChild` pattern não está disponível no Button atual. Altere o EmptyState para usar o Button sem `asChild`:

```tsx
// Substitua a parte do Button por:
      <Link
        href="/sessoes/nova"
        className="rounded-[10px] px-5 py-3 text-sm font-bold bg-[#015484] text-white hover:opacity-90 transition-opacity"
      >
        Criar primeira sessão
      </Link>
```

- [ ] **Step 3: Commit**

```bash
git add components/sessions/
git commit -m "feat: add SessionCard and EmptyState components"
```

---

## Task 13: Home — lista de sessões

**Files:**
- Modify: `app/(app)/page.tsx`

- [ ] **Step 1: Criar página home como Server Component**

```tsx
// app/(app)/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SessionCard } from '@/components/sessions/SessionCard'
import { EmptyState } from '@/components/sessions/EmptyState'
import type { SessionSummary } from '@/types/database'

async function getSessions(): Promise<SessionSummary[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      samples(count),
      session_evaluators(count)
    `)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((row: any) => ({
    ...row,
    sample_count: row.samples[0]?.count ?? 0,
    evaluator_count: row.session_evaluators[0]?.count ?? 0,
  }))
}

export default async function HomePage() {
  const sessions = await getSessions()

  return (
    <div className="flex flex-col flex-1">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <span className="text-[12px] font-bold uppercase tracking-widest text-[#506a6e]">
          Suas sessões
        </span>
        <Link
          href="/sessoes/nova"
          className="bg-[#f68721] text-white text-[12px] font-bold rounded-lg px-3.5 py-2 hover:opacity-90 transition-opacity"
        >
          + Nova Sessão
        </Link>
      </div>

      {sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-2.5 px-4 pb-6">
          {sessions.map((session) => (
            <li key={session.id}>
              <SessionCard session={session} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Testar manualmente**

```bash
npm run dev
```

1. Acesse http://localhost:3000
2. Com conta autenticada — deve mostrar estado vazio
3. Verificar que botão "Nova Sessão" aparece no topo

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/page.tsx
git commit -m "feat: add sessions list home page"
```

---

## Task 14: Nova Sessão — formulário + Server Action

**Files:**
- Create: `app/(app)/sessoes/nova/page.tsx`
- Create: `app/(app)/sessoes/actions.ts`

- [ ] **Step 1: Criar Server Action createSession**

```ts
// app/(app)/sessoes/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createSession(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const name = (formData.get('name') as string)?.trim()
  const date = formData.get('date') as string
  const notes = (formData.get('notes') as string)?.trim() || null
  const isDraft = formData.get('draft') === 'true'

  if (!name || !date) redirect('/sessoes/nova?error=required')

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      name,
      date,
      notes,
      status: isDraft ? 'draft' : 'active',
      created_by: user.id,
    })
    .select()
    .single()

  if (error || !session) redirect('/sessoes/nova?error=generic')

  // Registrar o criador como coordenador
  await supabase.from('session_evaluators').insert({
    session_id: session.id,
    user_id: user.id,
    role: 'coordinator',
  })

  revalidatePath('/')
  redirect('/')
}
```

- [ ] **Step 2: Criar página Nova Sessão**

```tsx
// app/(app)/sessoes/nova/page.tsx
import Link from 'next/link'
import { createSession } from '../actions'
import { Button } from '@/components/ui/Button'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export default async function NovaSessaoPage(props: PageProps<'/sessoes/nova'>) {
  const { error } = await props.searchParams

  return (
    <div className="flex flex-col flex-1">
      {/* Header interno da página */}
      <div className="bg-[#015484] px-5 py-4 flex items-center gap-3">
        <Link
          href="/"
          className="text-[#0b8bcc] text-xl leading-none"
          aria-label="Voltar"
        >
          ←
        </Link>
        <span className="text-white font-bold text-[15px]">Nova Sessão</span>
      </div>

      <form action={createSession} className="flex flex-col gap-4 px-4 pt-5 pb-8">
        {error === 'required' && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
            Nome e data são obrigatórios.
          </p>
        )}
        {error === 'generic' && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
            Erro ao criar sessão. Tente novamente.
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label
            htmlFor="name"
            className="text-[10px] font-bold uppercase tracking-widest text-[#506a6e]"
          >
            Nome da sessão
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="ex: Safra 2025 — Lote A"
            className="border border-[#e8e5e2] rounded-lg px-3 py-2.5 text-sm bg-white text-[#201b54] focus:outline-none focus:border-[#0b8bcc] placeholder:text-[#aa9577]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="date"
            className="text-[10px] font-bold uppercase tracking-widest text-[#506a6e]"
          >
            Data
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={todayISO()}
            className="border border-[#e8e5e2] rounded-lg px-3 py-2.5 text-sm bg-white text-[#201b54] focus:outline-none focus:border-[#0b8bcc]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="notes"
            className="text-[10px] font-bold uppercase tracking-widest text-[#506a6e]"
          >
            Observações (opcional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Notas gerais da sessão..."
            className="border border-[#e8e5e2] rounded-lg px-3 py-2.5 text-sm bg-white text-[#201b54] focus:outline-none focus:border-[#0b8bcc] placeholder:text-[#aa9577] resize-none"
          />
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <Button type="submit" fullWidth>
            Criar Sessão
          </Button>

          {/* Botão salvar como rascunho */}
          <button
            type="submit"
            name="draft"
            value="true"
            className="w-full py-2.5 text-sm text-[#506a6e] font-medium hover:text-[#201b54] transition-colors"
          >
            Salvar Rascunho
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Testar o fluxo completo**

```bash
npm run dev
```

1. Acesse http://localhost:3000
2. Clique em "+ Nova Sessão"
3. Preencha nome e data
4. Clique "Criar Sessão"
5. Deve redirecionar para / e a sessão deve aparecer na lista

- [ ] **Step 4: Testar estado de rascunho**

1. Clique "Nova Sessão" novamente
2. Preencha o formulário
3. Clique "Salvar Rascunho"
4. A sessão deve aparecer com badge "Rascunho" na lista

- [ ] **Step 5: Commit final**

```bash
git add app/\(app\)/sessoes/
git commit -m "feat: add create session page and server action"
```

---

## Task 15: Push para GitHub

- [ ] **Step 1: Verificar estado final**

```bash
npm run build
```

Esperado: build sem erros de TypeScript ou ESLint.

- [ ] **Step 2: Executar todos os testes**

```bash
npm test
```

Esperado: 3 testes PASS (calculateTotalScore).

- [ ] **Step 3: Push**

```bash
git push origin master
```

---

## Self-Review

**Cobertura da spec:**
- ✅ UI 100% em português (via strings hardcoded na UI — o pt-BR.json está criado mas a integração é fase 2 para simplificar o MVP)
- ✅ Backend em inglês (nomes de tabelas, variáveis, funções)
- ✅ Mobile-first (max-width não forçado, layout flex vertical)
- ✅ Next.js App Router + Supabase Auth + Database
- ✅ Tela inicial = lista de sessões
- ✅ Criar sessão com nome, data, notas, status draft/active
- ✅ Estado vazio com CTA
- ✅ Login e cadastro com e-mail + senha
- ✅ Fontes Raleway + Caveat conforme manual de marca
- ✅ Paleta de cores da Pilotis aplicada

**Consistência de tipos:**
- `SessionSummary` definida em `types/database.ts` e usada em `SessionCard` e `page.tsx` ✅
- `SessionStatus` usada em `STATUS_CONFIG` e no tipo `Session` ✅
- `createSession` action usa tipos corretos do Supabase insert ✅

**Sem placeholders:**
- Todo código está completo e funcional ✅

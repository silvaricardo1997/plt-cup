# Pilotis Cup — Design Inicial

**Data:** 2026-04-13  
**Escopo:** Estrutura inicial do projeto, modelagem do banco, primeiras 3 telas

---

## Contexto

Pilotis Cup é um app de avaliação de cafés especiais para uso em sessões de cupping reais. O objetivo desta fase é criar a base do projeto com as telas de início, lista de sessões e criação de sessão.

---

## Decisões de produto

### Usuários e autenticação
- Todos os usuários precisam de conta (e-mail + senha via Supabase Auth)
- Uma sessão tem um **coordenador** (quem cria) e múltiplos **avaliadores**
- Avaliadores acessam a sessão via link compartilhado pelo coordenador
- O link contém um `invite_token` único por sessão

### Protocolo de avaliação
- Base: **SCA (Specialty Coffee Association)**
- Atributos: fragrância, sabor, finalização, acidez, corpo, equilíbrio, impressão geral
- Defeitos: taint e contaminação (subtraídos do total)
- `total_score` calculado em runtime — não armazenado no banco
- Arquitetura preparada para customização futura de campos

### Navegação
- **Session-first**: lista de sessões é a home
- Sem bottom nav no MVP — header simples com logo + avatar
- Botão "Nova Sessão" fixo no topo da lista
- Estados de sessão: `draft` / `active` / `completed`

---

## Identidade visual

Seguir o Manual de Marca Pilotis (`docs/Pilotis-Manual.pdf`).

### Cores
| Token | Hex | Uso |
|---|---|---|
| Azul escuro | `#015484` | Header, botão primário |
| Azul médio | `#0b8bcc` | Status "Em andamento", links |
| Navy | `#201b54` | Títulos |
| Laranja | `#f68721` | CTA, status "Rascunho", tagline |
| Cinza escuro | `#434344` | Status "Concluída" |
| Azul-cinza | `#506a6e` | Subtextos, labels |
| Creme | `#fbf8ec` | Background de telas |
| Cinza claro | `#e8e5e2` | Bordas, divisores |
| Dourado | `#aa9577` | Datas, textos terciários |

### Tipografia
- **Raleway** — fonte principal (títulos, labels, botões, corpo)
- **Caveat** — apenas em taglines e acentos estratégicos (`cafés especiais`)

---

## Arquitetura técnica

### Stack
- **Next.js 16** (App Router)
- **Supabase** (Auth + PostgreSQL)
- **Tailwind CSS 4**
- **TypeScript**

### Estrutura de pastas

```
pilotis-cup/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── cadastro/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx          ← header com logo + avatar
│   │   ├── page.tsx            ← lista de sessões (home)
│   │   └── sessoes/
│   │       ├── nova/page.tsx   ← criar sessão
│   │       └── [id]/page.tsx   ← detalhe da sessão (fase 2)
│   ├── layout.tsx              ← root layout (fontes, providers)
│   └── globals.css
├── components/
│   ├── sessions/
│   │   ├── SessionCard.tsx
│   │   └── SessionList.tsx
│   └── ui/
│       └── Button.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts           ← browser client
│   │   └── server.ts           ← server client (RSC/server actions)
│   └── i18n/
│       └── pt-BR.json          ← todos os textos da UI
├── types/
│   └── database.ts             ← tipos gerados do Supabase
└── supabase/
    └── migrations/
        └── 0001_initial.sql
```

### Convenções
- **UI:** 100% em português (via `pt-BR.json` — nenhuma string hardcoded)
- **Código/banco:** inglês (variáveis, funções, nomes de tabelas)
- **Server Components por padrão** — fetch no servidor
- **Server Actions** para mutations (criar sessão, salvar rascunho)
- **Middleware** do Supabase protege rotas `(app)` — redireciona para login

---

## Modelagem do banco (Supabase / PostgreSQL)

### `sessions`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
name          text NOT NULL
date          date NOT NULL
notes         text
status        text NOT NULL DEFAULT 'draft'  -- draft | active | completed
created_by    uuid NOT NULL REFERENCES auth.users(id)
invite_token  text UNIQUE NOT NULL
created_at    timestamptz NOT NULL DEFAULT now()
```

### `samples`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
session_id    uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE
code          text NOT NULL        -- ex: "Amostra A", "001"
label         text                 -- nome real (revelado após avaliação)
position      int NOT NULL         -- ordem na sessão
created_at    timestamptz NOT NULL DEFAULT now()
```

### `session_evaluators`
```sql
session_id    uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE
user_id       uuid NOT NULL REFERENCES auth.users(id)
role          text NOT NULL        -- coordinator | evaluator
joined_at     timestamptz NOT NULL DEFAULT now()
PRIMARY KEY (session_id, user_id)
```

### `evaluations`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
sample_id       uuid NOT NULL REFERENCES samples(id) ON DELETE CASCADE
evaluator_id    uuid NOT NULL REFERENCES auth.users(id)
fragrance       numeric(4,2)   -- 6.00–10.00
flavor          numeric(4,2)
aftertaste      numeric(4,2)
acidity         numeric(4,2)
body            numeric(4,2)
balance         numeric(4,2)
overall         numeric(4,2)
defects         int DEFAULT 0
taint           int DEFAULT 0
notes           text
status          text NOT NULL DEFAULT 'draft'  -- draft | submitted
created_at      timestamptz NOT NULL DEFAULT now()
submitted_at    timestamptz
UNIQUE (sample_id, evaluator_id)
```

*`total_score` é calculado em runtime: soma dos atributos − (defects × 2) − (taint × 4)*

---

## Telas do MVP (fase 1)

### Tela 1 — Lista de sessões (home)
- Header: logo PILOTIS + tagline "cafés especiais" (Caveat) + avatar do usuário
- Botão "Nova Sessão" (laranja) no topo direito
- Lista de cards por sessão: nome, contagem de amostras e avaliadores, status, data
- Estado vazio: ícone + mensagem + CTA "Criar primeira sessão"
- Tap num card → detalhe da sessão (fase 2)

### Tela 2 — Criar sessão
- Header com back button + título "Nova Sessão"
- Campos: Nome da sessão, Data (padrão: hoje), Observações (opcional)
- Área para adicionar amostras (lista expandível)
- Ações: "Criar Sessão" (primário) e "Salvar Rascunho" (secundário)

### Tela 3 — Login / Cadastro
- Implementada com design funcional simples (campos e-mail + senha + botão)
- Segue a paleta e tipografia da marca
- Necessária para o middleware de proteção de rotas funcionar
- Design detalhado (onboarding, recuperação de senha) é fase 2

---

## Fora do escopo desta fase

- Tela de detalhe da sessão
- Formulário de avaliação SCA
- Comparação de resultados
- Relatórios e exportação
- Customização de campos de avaliação
- Notificações

# Sistema Dirija Melhor

Aplicacao Next.js para administrar alunos, matriculas, escala de aulas, solicitacoes do aluno, comprovantes e financeiro.

## Requisitos

- Node.js 20+
- npm

## Configuracao

Crie um arquivo `.env.local` dentro da pasta `frontend` usando o modelo abaixo:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SECRET_KEY=sb_secret_sua_chave
ADMIN_EMAIL=admin@dirijamelhor.com
ADMIN_PASSWORD=troque-essa-senha
ADMIN_SESSION_SECRET=troque-esse-segredo-grande
```

Para teste local, se essas variaveis nao existirem, o sistema usa:

```txt
E-mail: admin@dirijamelhor.com
Senha: admin123
```

## Rodar em desenvolvimento

```bash
npm install
npm run dev
```

Abra:

- Administrador: http://localhost:3000/admin/login
- Aluno: http://localhost:3000/alunos

## Build de producao local

```bash
npm run build
npm run start
```

## Supabase

1. Crie um projeto no Supabase.
2. No SQL Editor do Supabase, execute o arquivo `supabase/schema.sql`.
3. Configure `.env.local` com `SUPABASE_URL` e `SUPABASE_SECRET_KEY`.
4. Importe os dados locais:

```bash
npm run supabase:seed
```

Depois disso, o app passa a ler e escrever no Supabase. Se as variaveis `SUPABASE_URL` e `SUPABASE_SECRET_KEY` nao existirem, o app usa `data/db.json` para desenvolvimento local.

## Vercel

Ao importar o projeto na Vercel:

- Root directory: `frontend`
- Build command: `npm run build`
- Environment Variables:
  - `SUPABASE_URL`
  - `SUPABASE_SECRET_KEY`
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
  - `ADMIN_SESSION_SECRET`

## Fluxo principal

1. O administrador entra por `/admin/login`.
2. A aba `Matriculas` cadastra a ficha completa do aluno.
3. Os dados cadastrados aparecem na aba `Alunos` apenas para consulta.
4. O aluno entra por `/alunos` com e-mail e senha inicial.
5. O aluno solicita aulas pela escala.
6. O administrador aprova ou recusa na agenda.
7. O comprovante do aluno aparece somente para aulas aceitas.

## Dados

Em desenvolvimento sem Supabase, os dados ficam em `data/db.json`.

Em producao na Vercel, use Supabase para persistencia.

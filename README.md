# TaskHub Backend

API REST para gerenciamento de tarefas com autenticação JWT, organizações (times) e armazenamento de sessões Redis.

## Tecnologias

- **Node.js** com ES Modules
- **Express 5** — framework web minimalista
- **Prisma** — ORM com typesafe queries
- **PostgreSQL 16** — banco relacional
- **Redis 7** — sessões e cache
- **JWT (jsonwebtoken)** — autenticação stateless
- **bcrypt** — hash seguro de senhas
- **Vitest + Supertest** — testes

## Pré-requisitos

- Node.js 20+
- PostgreSQL 16
- Redis 7
- (Opcional) Docker + Docker Compose

## Setup

### Com Docker Compose (recomendado)

```bash
# Crie .env com as variáveis necessárias (veja .env.example)
cp .env.example .env

# Sobe banco, redis, backend e frontend
docker compose up --build
```

Serviços:
- Backend: http://localhost:3000
- Frontend: http://localhost
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Setup Local

```bash
npm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais de banco e Redis

# Sincronize schema com banco
npx prisma db push

# Inicie o servidor
npm run dev        # desenvolvimento (hot reload)
npm start          # produção
```

Backend estará em http://localhost:3000.

## Testes

Requer PostgreSQL e Redis rodando:

```bash
# Use Docker apenas para dependências
docker compose up -d db redis

# Depois rode testes
npm test
```

Testes usam `taskhub_test` e Redis DB 1. Para customizar:

```bash
TEST_DATABASE_URL="postgresql://..." TEST_REDIS_URL="redis://..." npm test
```

## Endpoints da API

### Autenticação

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| POST | `/auth/register` | — | Cadastrar novo usuário |
| POST | `/auth/login` | — | Login (retorna JWT) |
| POST | `/auth/logout` | ✓ | Logout (invalida sessão) |

### Tarefas

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| GET | `/tasks` | ✓ | Listar tarefas (filtros: `status`, `search`, `organizationId`) |
| POST | `/tasks` | ✓ | Criar tarefa |
| GET | `/tasks/:id` | ✓ | Buscar tarefa por ID |
| PUT | `/tasks/:id` | ✓ | Atualizar tarefa |
| DELETE | `/tasks/:id` | ✓ | Deletar tarefa |

**Status:** `WAITING`, `IN_PROGRESS`, `DONE`

### Organizações

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| POST | `/organizations` | ✓ | Criar organização (criador vira OWNER) |
| POST | `/organizations/join` | ✓ | Entrar em organização (via accessKey) |
| GET | `/organizations` | ✓ | Listar organizações do usuário |
| GET | `/organizations/:id/members` | ✓ | Listar membros de uma org |
| POST | `/organizations/:id/leave` | ✓ | Sair de uma organização |
| DELETE | `/organizations/:id` | ✓ | Deletar organização (OWNER only) |

### Outros

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| GET | `/health` | — | Status da API |
| GET | `/weather?city=...` | ✓ | Clima atual |

## Autenticação

### Fluxo

1. **Register**: Endpoint `/auth/register` cria usuário (senha com bcrypt)
2. **Login**: Endpoint `/auth/login` retorna JWT + sesão em Redis
3. **Token**: Inclua em toda requisição: `Authorization: Bearer <token>`
4. **Verificação**: Middleware valida JWT e verifica sessão em Redis
5. **Logout**: Deleta sessão do Redis (revogação imediata)

### Token JWT

- **Payload**: `{ id, jti }`
- **TTL**: 7 dias
- **Secret**: `JWT_SECRET` (environment)
- **JTI**: UUID único para rastreamento de sessão

## Banco de Dados

### Modelos

```prisma
User                    # id, name, email, password
Organization           # id, name, accessKey
OrganizationMember     # userId, organizationId, role (OWNER/MEMBER)
Task                   # id, title, description, status, deadline,
                       # authorId, assigneeId, organizationId
```

### Migrações

Primeira vez: `npx prisma db push` cria tudo.

Com dados existentes: Execute `prisma/migration.sql` antes de `db push`.

## Estrutura do Projeto

```
src/
├── app.js                    # Configuração do Express
├── server.js                 # Inicialização
├── controllers/
│   ├── authController.js     # Login/register/logout
│   ├── taskController.js     # CRUD tarefas
│   └── organizationController.js  # CRUD orgs
├── services/
│   ├── authService.js        # Lógica auth (JWT, bcrypt)
│   ├── taskService.js        # Lógica tarefas (filtros, acesso)
│   └── organizationService.js # Lógica orgs (membership, acesso)
├── routes/
│   ├── authRoutes.js
│   ├── taskRoutes.js
│   └── organizationRoutes.js
├── middlewares/
│   ├── auth.js              # Verificação JWT + sessão Redis
│   └── errorHandler.js      # Tratamento global de erros
├── utils/
│   └── jwt.js               # Geração/verificação de tokens
├── lib/
│   └── redis.js             # Cliente Redis
└── tests/                   # Testes de integração
```

## Variáveis de Ambiente

```env
PORT=3000
DATABASE_URL=postgresql://taskhub:taskhub@localhost:5432/taskhub
REDIS_URL=redis://localhost:6379
JWT_SECRET=<sua-chave-secreta>
OPENWEATHER_API_KEY=<sua-api-key>  # Opcional, para widget clima
```

## Regras de Negócio

### Tarefas Pessoais
- **Criação**: `organizationId = null`
- **Acesso**: Apenas autor e atribuído
- **Atribuído**: Auto-assign ao criador

### Tarefas de Organização
- **Criação**: `organizationId` definido
- **Acesso**: Todos os membros da org
- **Atribuído**: Dropdown escolhe membro da org
- **Visibilidade**: Filtro por org

### Organizações
- **Criação**: Criador vira OWNER automático
- **Entrada**: Via `accessKey` (case-insensitive)
- **Saída**: OWNER não pode sair se único (org deletada)
- **Membership**: Única por usuário + org

## Deployment

Veja `Dockerfile` e `docker-compose.yml` para containerização.

Com Node:
```bash
npm ci
npx prisma db push
NODE_ENV=production npm start
```

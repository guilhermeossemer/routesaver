# RouteSaver

Aplicação web para criar, gerenciar e salvar rotas de carro/moto em um mapa interativo. Abra suas rotas diretamente no Google Maps para navegação.

## Tecnologias

- **Frontend:** HTML, CSS, Vanilla JavaScript, Leaflet
- **Backend:** Node.js, Express
- **Banco de Dados:** MongoDB
- **Autenticação:** JWT + bcrypt

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- [MongoDB](https://www.mongodb.com/) rodando localmente ou uma URI de conexão remota (ex: MongoDB Atlas)

## Instalação

1. Clone o repositório (ou copie os arquivos para uma pasta):

```bash
git clone <url-do-repo>
cd routesaver
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

| Variável       | Descrição                                   | Padrão                                  |
|----------------|---------------------------------------------|-----------------------------------------|
| `PORT`         | Porta do servidor                           | `3000`                                  |
| `MONGODB_URI`  | URI de conexão do MongoDB                   | `mongodb://localhost:27017/routesaver`  |
| `JWT_SECRET`   | Chave secreta para assinar tokens JWT       | (altere para algo seguro)               |
| `JWT_EXPIRES_IN` | Tempo de expiração do token               | `7d`                                    |

> **Importante:** Altere o `JWT_SECRET` para uma string aleatória e segura em produção.

## Execução

### Modo desenvolvimento (com hot-reload):

```bash
npm run dev
```

### Modo produção:

```bash
npm start
```

Acesse a aplicação em: **http://localhost:3000**

## Estrutura do Projeto

```
routesaver/
├── public/                  # Arquivos estáticos (frontend)
│   ├── css/
│   │   └── style.css        # Estilos globais
│   ├── js/
│   │   ├── api.js           # Client HTTP para a API REST
│   │   ├── auth.js          # Lógica das páginas de login/registro
│   │   └── dashboard.js     # Lógica do dashboard e mapa
│   └── pages/
│       ├── login.html       # Página de login
│       ├── register.html    # Página de cadastro
│       └── dashboard.html   # Dashboard principal
├── src/                     # Código do servidor (backend)
│   ├── config/
│   │   └── db.js            # Conexão com MongoDB
│   ├── controllers/
│   │   ├── authController.js    # Lógica de autenticação
│   │   └── routeController.js   # CRUD de rotas
│   ├── middlewares/
│   │   └── auth.js          # Middleware JWT
│   ├── models/
│   │   ├── User.js          # Model do usuário
│   │   └── Route.js         # Model da rota
│   ├── routes/
│   │   ├── authRoutes.js    # Rotas da API de autenticação
│   │   └── routeRoutes.js   # Rotas da API de rotas
│   └── server.js            # Ponto de entrada do servidor
├── .env                     # Variáveis de ambiente (não versionado)
├── .env.example             # Template de variáveis de ambiente
├── .gitignore
├── package.json
└── README.md
```

## API Endpoints

### Autenticação

| Método | Rota               | Descrição          | Auth |
|--------|--------------------|--------------------|------|
| POST   | `/api/auth/register` | Criar conta       | Não  |
| POST   | `/api/auth/login`    | Fazer login       | Não  |
| GET    | `/api/auth/me`       | Dados do usuário  | Sim  |

### Rotas

| Método | Rota               | Descrição           | Auth |
|--------|--------------------|--------------------|------|
| GET    | `/api/routes`       | Listar rotas       | Sim  |
| GET    | `/api/routes/:id`   | Detalhes da rota   | Sim  |
| POST   | `/api/routes`       | Criar rota         | Sim  |
| PUT    | `/api/routes/:id`   | Atualizar rota     | Sim  |
| DELETE | `/api/routes/:id`   | Excluir rota       | Sim  |

## Uso

1. Acesse `http://localhost:3000` e crie uma conta
2. No dashboard, clique em **+ Nova Rota**
3. Digite o nome da rota e clique no mapa para adicionar pontos
4. Clique em **Salvar** quando terminar
5. Na lista de rotas, clique no botão ▶ para abrir no Google Maps

## Licença

MIT

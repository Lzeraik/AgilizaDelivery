# AgilizaDelivery

Sistema SaaS completo para gerenciamento de pedidos em restaurantes de shopping, com 4 telas interligadas em tempo real via WebSocket, painel administrativo web, PDV integrado e emissão de NFC-e.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Telas do Sistema](#telas-do-sistema)
- [Stack Tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Como Rodar](#como-rodar)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Rotas da API](#rotas-da-api)
- [WebSocket](#websocket)
- [Fluxo de Pedido](#fluxo-de-pedido)
- [NFC-e](#nfc-e)
- [TEF (Pagamento)](#tef-pagamento)
- [PDV](#pdv)

---

## Visão Geral

O AgilizaDelivery é uma plataforma SaaS em que o restaurante contratante recebe:

- **4 telas interligadas** em tempo real
- **Painel admin web** para gestão completa
- **Emissão de NFC-e** (Nota Fiscal do Consumidor Eletrônica)
- **PDV** com controle de estoque e relatórios
- **QR code** para rastreamento de pedidos pelo cliente
- **TEF** integrado (simulação, pronto para plugar Cielo/Stone/Rede)
- **Personalização total** de cores, fontes e logo por tela

---

## Telas do Sistema

### Tela 1 — Totem (`/totem`)
Ponto de autoatendimento para o cliente:
- Navega por categorias (Bebidas, Pratos, Sobremesas, etc.)
- Visualiza produtos com imagem, descrição e preço
- Adiciona itens à sacola
- Escolhe entre comer no local ou levar
- Realiza o pagamento (crédito, débito, Pix via TEF simulado)
- Recebe QR code para acompanhar o pedido

### Tela 2 — Cozinha (`/kitchen`)
Painel para os cozinheiros:
- Recebe pedidos em tempo real (WebSocket)
- Fila FIFO — pedidos mais antigos primeiro
- Confirma início do preparo e marca como pronto
- Cores configuráveis via admin

### Tela 3 — Display (`/display`)
Painel de acompanhamento voltado para os clientes:
- Dividida em duas colunas: **Em Preparo** e **Pronto para Retirar**
- Atualização em tempo real via WebSocket
- Pedidos prontos aparecem somente após confirmação da cozinha

### Tela 4 — Atendente (`/attendant`)
Caixa para atendimento presencial:
- Login rápido por email/senha
- Mesmas funcionalidades do totem
- QR code exibido na tela para o cliente

### Rastreamento (`/track/[token]`)
Página pública acessível pelo QR code:
- Mostra o status atual do pedido em tempo real
- Sem necessidade de login

---

## Stack Tecnológica

| Camada        | Tecnologia                                    |
|---------------|-----------------------------------------------|
| Backend       | Python 3.11 · FastAPI · Uvicorn               |
| ORM           | SQLAlchemy 2 + Alembic                        |
| Banco de dados| PostgreSQL 16                                 |
| Autenticação  | JWT (python-jose) + bcrypt (passlib)          |
| WebSocket     | FastAPI WebSocket nativo                      |
| QR Code       | python-qrcode + Pillow                        |
| NFC-e         | lxml (geração de XML modelo 65)               |
| Frontend      | Next.js 14 (App Router) · TypeScript          |
| Estilo        | TailwindCSS                                   |
| Estado        | Zustand                                       |
| Gráficos      | Recharts                                      |
| Infra         | Docker Compose · Nginx                        |

---

## Arquitetura

```
Totem / Atendente
      │ POST /orders
      ▼
  [Backend API]──────── WebSocket ────── Cozinha (ws/kitchen)
      │                                      │
      │                                      │ PATCH kitchen/{id}/ready
      │                                      ▼
  [PostgreSQL]               Display + Track (ws/display, ws/order/{token})
      │
  [Uploads / QR Codes]
```

### Fluxo de Status
```
pending → preparing → ready → delivered
(criado)  (cozinha   (pronto  (retirado)
           aceita)    para
                     buscar)
```

### WebSocket Canais
| Endpoint | Quem conecta | Eventos recebidos |
|---|---|---|
| `/kitchen/ws` | Tela 2 | `new_order` |
| `/display/ws` | Tela 3 | `new_order`, `order_status_update`, `order_ready` |
| `/display/ws/order/{token}` | Página de rastreio | `order_status_update` |

---

## Como Rodar

### Pré-requisitos
- Docker 24+ e Docker Compose v2

### 1. Clonar e configurar ambiente

```bash
# Copiar .env de exemplo
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Edite `backend/.env` com os dados do seu restaurante. Para desenvolvimento, os valores padrão funcionam.

### 2. Subir todos os serviços

```bash
docker-compose up --build
```

### 3. Acessar o sistema

| URL | Tela |
|---|---|
| `http://localhost` | Admin (redireciona) |
| `http://localhost/admin` | Painel Administrativo |
| `http://localhost/totem` | Totem de autoatendimento |
| `http://localhost/kitchen` | Tela da cozinha |
| `http://localhost/display` | Painel dos clientes |
| `http://localhost/attendant` | Tela do atendente |
| `http://localhost:8000/docs` | Swagger UI (API) |

**Login padrão do admin:**
- Email: `admin@restaurante.com`
- Senha: `admin123`

> Altere as credenciais em `backend/.env` antes de ir para produção.

### Desenvolvimento local (sem Docker)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Edite DATABASE_URL no .env para apontar para seu postgres local
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev                        # http://localhost:3000
```

---

## Variáveis de Ambiente

### Backend (`backend/.env`)

| Variável | Descrição | Padrão |
|---|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL | — |
| `SECRET_KEY` | Chave JWT (mude em produção!) | — |
| `ADMIN_EMAIL` | Email do admin inicial | `admin@restaurante.com` |
| `ADMIN_PASSWORD` | Senha do admin inicial | `admin123` |
| `FRONTEND_URL` | URL do frontend (para QR code) | `http://localhost:3000` |
| `SEFAZ_AMBIENTE` | 1=Produção / 2=Homologação | `2` |
| `SEFAZ_CNPJ` | CNPJ do restaurante | — |
| `CERTIFICADO_PATH` | Caminho do certificado .pfx | — |

### Frontend (`frontend/.env.local`)

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL da API backend |
| `NEXT_PUBLIC_WS_URL` | URL WebSocket backend |

---

## Rotas da API

Documentação interativa disponível em `http://localhost:8000/docs` (Swagger UI).

| Grupo | Endpoints principais |
|---|---|
| Auth | `POST /auth/login` |
| Usuários | `GET/POST/PUT/DELETE /users` |
| Categorias | `GET/POST/PUT/DELETE /categories` |
| Produtos | `GET/POST/PUT/DELETE /products` |
| Pedidos | `POST /orders`, `GET /orders/track/{token}`, `PATCH /orders/{id}/status` |
| Cozinha | `GET /kitchen/queue`, `PATCH /kitchen/{id}/prepare`, `PATCH /kitchen/{id}/ready` |
| Display | `GET /display/orders` |
| Pagamentos | `POST /payments/initiate`, `POST /payments/{id}/confirm` |
| Temas | `GET/PUT /themes/{screen}` |
| Estoque | `GET /stock`, `PUT /stock/{product_id}` |
| Relatórios | `GET /reports/daily`, `/top-products`, `/peak-hours`, `/revenue` |
| NFC-e | `POST /nfe/emitir/{order_id}`, `GET /nfe/{order_id}` |
| Upload | `POST /uploads/{products|banners|logos}` |

---

## NFC-e

O sistema gera NFC-e (Nota Fiscal de Consumidor Eletrônica — modelo 65) conforme layout SEFAZ.

**Para ativar em produção:**

1. Obtenha um certificado digital A1 (`.pfx`) no e-CNPJ do restaurante
2. Cadastre-se no portal da SEFAZ do seu estado
3. Configure as variáveis `SEFAZ_*` no `backend/.env`
4. Altere `SEFAZ_AMBIENTE=1` para produção

**Em homologação (padrão):** a NFC-e é gerada e validada localmente sem envio ao SEFAZ, retornando chave de acesso simulada.

**Emissão via admin:** Pedidos → clique no ícone 📄 ao lado do pedido pago.

---

## TEF (Pagamento)

O módulo de pagamento foi construído com abstração para facilitar integração com terminais físicos:

```python
class TEFProvider(ABC):
    def initiate(self, amount, method) -> dict: ...
    def confirm(self, transaction_id) -> dict: ...
    def cancel(self, transaction_id) -> dict: ...
```

**Para integrar com Cielo, Stone ou Rede:**

1. Crie uma classe que implemente `TEFProvider` em `backend/app/services/payment_service.py`
2. Injete o provider no `PaymentService` em `backend/app/routers/payments.py`

O fluxo atual (simulado) aprova o pagamento automaticamente para desenvolvimento e testes.

---

## PDV

O PDV é integrado ao sistema de pagamentos e estoque:

- Toda venda aprovada (`Payment.status = approved`) é registrada automaticamente
- O estoque é decrementado por produto ao confirmar o pagamento
- Alertas de estoque mínimo aparecem no dashboard do admin
- Relatórios disponíveis em `/admin/reports`:
  - Receita por período
  - Produtos mais vendidos
  - Horários de pico

---

## Personalização

No painel admin em `/admin/themes`, o contratante pode configurar por tela:

- Cores primária, secundária, de fundo, de texto e de destaque
- Fonte (Google Fonts integradas)
- Logo do restaurante
- Banners promocionais

As configurações são aplicadas em tempo real nas telas.

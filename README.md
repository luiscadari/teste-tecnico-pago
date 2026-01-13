# API Crawler de CEPs - Desafio Técnico

Sistema de crawler assíncrono para consulta em massa de CEPs utilizando a API ViaCEP, desenvolvido como resolução de desafio técnico.

## 📋 Sobre o Projeto

Esta aplicação permite realizar consultas em massa de CEPs de forma assíncrona, processando requisições através de filas SQS (Amazon Simple Queue Service) e armazenando os resultados em MongoDB.

### Funcionalidades

- **Crawler Assíncrono**: Processa intervalos de CEPs de forma não bloqueante
- **Sistema de Filas**: Utiliza AWS SQS (ElasticMQ local) para gerenciamento de requisições
- **Armazenamento Persistente**: MongoDB para guardar histórico e resultados
- **Monitoramento**: Interface Mongo Express para visualização dos dados
- **API RESTful**: Endpoints para iniciar crawlers e consultar status/resultados

## 🚀 Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **AWS SDK** - Integração com SQS
- **ElasticMQ** - Simulador local de SQS
- **Docker & Docker Compose** - Containerização
- **Axios** - Cliente HTTP
- **ViaCEP API** - Fonte de dados de CEPs

## 📦 Estrutura do Projeto

```
teste-tecnico-pago/
├── src/
│   ├── config/
│   │   └── sqsClient.js           # Configuração do cliente SQS
│   ├── controller/
│   │   └── cep.contrroller.js     # Controladores das rotas
│   ├── database/
│   │   └── index.js               # Conexão com MongoDB
│   ├── router/
│   │   ├── cep.router.js          # Rotas da API
│   │   └── index.js               # Agregador de rotas
│   ├── schemas/
│   │   └── crawler.schema.js      # Schema do MongoDB
│   └── services/
│       ├── cep.services.js        # Lógica de negócio
│       └── queue.services.js      # Gerenciamento de filas
├── docker-compose.yaml            # Configuração dos containers
├── index.js                       # Ponto de entrada da aplicação
└── package.json                   # Dependências e scripts
```

## 🔧 Instalação e Configuração

### Pré-requisitos

- Docker
- Docker Compose
- Node.js 22+ (opcional, para desenvolvimento local)

### Executando com Docker (Recomendado)

1. Clone o repositório:

```bash
git clone <url-do-repositorio>
cd teste-tecnico-pago
```

2. Inicie os containers:

```bash
docker-compose up
```

A aplicação estará disponível em:

- **API**: http://localhost:8888
- **Mongo Express**: http://localhost:8081 (usuário: `mongoexpressuser`, senha: `mongoexpresspass`)

### Executando Localmente

1. Instale as dependências:

```bash
npm install
```

2. Configure as variáveis de ambiente (criar arquivo `.env`):

```env
PORT=3000
MONGO_USERNAME=root
MONGO_PASSWORD=example
MONGO_HOST=localhost
MONGO_PORT=27017
QUEUE_URL=http://localhost:9324/queue/cep-queue
MAX_NUMBER_OF_MESSAGES=10
REQUEST_DELAY_MS=1000
```

3. Inicie apenas MongoDB e ElasticMQ:

```bash
docker-compose up mongo elasticmq mongo-express
```

4. Execute a aplicação:

```bash
npm run dev    # Modo desenvolvimento
npm start      # Modo produção
```

## 📚 API Endpoints

### POST /crawler

Inicia um novo processo de crawling de CEPs.

**Request Body:**

```json
{
  "cep_start": "01001000",
  "cep_end": "01001100"
}
```

**Response:**

```json
{
  "crawlerId": "507f1f77bcf86cd799439011"
}
```

### GET /crawler/:id

Consulta o status de um crawler específico.

**Response:**

```json
{
  "total": 101,
  "processed": 50,
  "successful": 45,
  "failed": 5,
  "status": "pending"
}
```

### GET /crawler/:id/results

Retorna todos os resultados coletados por um crawler.

**Response:**

```json
[
  {
    "cep": "01001000",
    "logradouro": "Praça da Sé",
    "bairro": "Sé",
    "localidade": "São Paulo",
    "uf": "SP",
    "error": null
  },
  ...
]
```

## 🎯 Arquitetura e Fluxo

1. **Requisição Inicial**: Cliente envia intervalo de CEPs via POST `/crawler`
2. **Criação de Jobs**: Sistema divide o intervalo em jobs individuais
3. **Enfileiramento**: Cada CEP é adicionado à fila SQS
4. **Processamento Assíncrono**: Worker processa mensagens da fila
5. **Consulta API**: Realiza requisição para ViaCEP
6. **Armazenamento**: Salva resultados no MongoDB
7. **Consulta**: Cliente pode verificar status e resultados via GET

## ⚙️ Configurações

### Variáveis de Ambiente

| Variável                 | Descrição                    | Padrão                                |
| ------------------------ | ---------------------------- | ------------------------------------- |
| `PORT`                   | Porta da aplicação           | 8888                                  |
| `MONGO_USERNAME`         | Usuário do MongoDB           | root                                  |
| `MONGO_PASSWORD`         | Senha do MongoDB             | example                               |
| `MONGO_HOST`             | Host do MongoDB              | mongo                                 |
| `MONGO_PORT`             | Porta do MongoDB             | 27017                                 |
| `QUEUE_URL`              | URL da fila SQS              | http://elasticmq:9324/queue/cep-queue |
| `MAX_NUMBER_OF_MESSAGES` | Máx. de mensagens por lote   | 10                                    |
| `REQUEST_DELAY_MS`       | Delay entre requisições (ms) | 1000                                  |

## 🧪 Testando a Aplicação

### Exemplo de Uso

```bash
# Iniciar crawler
curl -X POST http://localhost:8888/crawler \
  -H "Content-Type: application/json" \
  -d '{"cep_start": "01001000", "cep_end": "01001010"}'

# Verificar status (substitua o ID)
curl http://localhost:8888/crawler/507f1f77bcf86cd799439011

# Obter resultados
curl http://localhost:8888/crawler/507f1f77bcf86cd799439011/results
```

## 📊 Monitoramento

Acesse o Mongo Express em http://localhost:8081 para:

- Visualizar documentos salvos
- Verificar status dos crawlers
- Analisar resultados em tempo real

## 🔒 Considerações de Segurança

⚠️ **Este projeto é para fins de demonstração técnica.** Em produção, considere:

- Implementar autenticação e autorização
- Adicionar rate limiting
- Validar e sanitizar entradas
- Utilizar HTTPS
- Proteger credenciais sensíveis
- Configurar AWS SQS real com IAM roles

## 🤝 Contribuindo

Este é um projeto de desafio técnico, mas sugestões são bem-vindas.

## 👤 Autor

**luiscadari**

---

Desenvolvido como resolução de desafio técnico para vaga de Desenvolvedor Pleno.

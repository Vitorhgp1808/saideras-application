# 🍻 Saíderas App

![Build Status](https://img.shields.io/badge/build-passing-success?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![Prisma](https://img.shields.io/badge/Prisma-6.17-2d3748?style=flat-square&logo=prisma)

## 📖 Sobre o Projeto

O **Saíderas App** é uma solução completa de gestão para bares, choperias e restaurantes. Desenvolvido para modernizar o atendimento e o controle operacional, o sistema integra funcionalidades de **Ponto de Venda (PDV)**, **Gestão de Estoque**, **Controle Financeiro** e **Gerenciamento de Pedidos por Mesas**.

A aplicação resolve problemas comuns do setor, como a falta de controle sobre o estoque de insumos (especialmente bebidas e barris de chopp), erros em comandas de papel e fechamento de caixa manual, oferecendo uma interface intuitiva e responsiva para garçons, caixas e administradores.

## ✨ Funcionalidades Principais

- **Gestão de Pedidos & Mesas**: Abertura de comandas por mesa, lançamento de itens em tempo real e status de pedidos (Aberto, Pago, Cancelado).
- **Ponto de Venda (PDV)**: Interface ágil para caixas, com suporte a múltiplas formas de pagamento (Dinheiro, Débito, Crédito, PIX).
- **Controle de Caixa**: Abertura e fechamento de turnos (sangria/suprimento), controle de fundo de troco e conferência de valores.
- **Gestão de Estoque Avançada**: Controle de lotes, validade de produtos, alertas de estoque mínimo e registro de compras de fornecedores.
- **Controle de Acesso (RBAC)**: Perfis distintos para Administradores, Operadores de Caixa e Garçons.
- **Dashboard & Relatórios**: Visualização gráfica de vendas, produtos mais vendidos e desempenho financeiro.
- **Gestão de Fornecedores**: Cadastro completo de fornecedores e histórico de compras.

## 🛠 Stack Tecnológico

Este projeto utiliza uma arquitetura moderna e escalável baseada em JavaScript/TypeScript.

### Frontend & Backend (Fullstack)
- **[Next.js 15](https://nextjs.org/)** (App Router): Framework React para produção.
- **[React 19](https://react.dev/)**: Biblioteca para construção de interfaces.
- **[Material UI (MUI)](https://mui.com/)**: Biblioteca de componentes de UI robusta e acessível.
- **[Tailwind CSS](https://tailwindcss.com/)**: Framework CSS utilitário para estilização rápida.

### Banco de Dados & ORM
- **[PostgreSQL](https://www.postgresql.org/)**: Banco de dados relacional (Hospedado no Supabase).
- **[Prisma ORM](https://www.prisma.io/)**: Camada de acesso a dados type-safe.

### Ferramentas & Bibliotecas
- **Autenticação**: `jsonwebtoken` (JWT), `bcryptjs`, `jose`.
- **Validação**: `zod` para validação de esquemas de dados.
- **Visualização de Dados**: `recharts` para gráficos analíticos.
- **Documentação API**: `swagger-ui-react` e `next-swagger-doc`.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter as seguintes ferramentas instaladas em sua máquina:

- **[Node.js](https://nodejs.org/)** (Versão 20 ou superior recomendada)
- **Gerenciador de Pacotes** (npm, yarn ou pnpm)
- **Git** para versionamento de código
- Uma instância do **PostgreSQL** (Recomendado: [Supabase](https://supabase.com/))

## 🚀 Instalação e Configuração

Siga os passos abaixo para configurar o ambiente de desenvolvimento:

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/saideras-app.git
   cd saideras-app
   ```

2. **Instale as dependências**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configure as Variáveis de Ambiente**
   Crie um arquivo `.env` na raiz do projeto com base no exemplo abaixo:

   ```env
   # Conexão com o Banco de Dados (Supabase Transaction Pooler)
   DATABASE_URL="postgresql://postgres.[id]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

   # Conexão Direta (Para Migrations)
   DIRECT_URL="postgresql://postgres:[password]@db.[id].supabase.co:5432/postgres"

   # Segredo para assinatura de tokens JWT
   JWT_SECRET="seu_segredo_super_seguro"
   ```

4. **Configure o Banco de Dados**
   Execute as migrações do Prisma para criar as tabelas no banco de dados:
   ```bash
   npx prisma migrate dev --name init
   ```

   *(Opcional) Popule o banco com dados iniciais se houver um seed configurado:*
   ```bash
   npx prisma db seed
   ```

## ▶️ Como Executar

### Ambiente de Desenvolvimento
Para iniciar o servidor de desenvolvimento com hot-reload:

```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador.

### Ambiente de Produção
Para construir e rodar a aplicação otimizada:

```bash
npm run build
npm start
```

## 📂 Estrutura de Arquivos

Uma visão geral simplificada da organização do projeto:

```
saideras-app/
├── prisma/                 # Esquemas do banco de dados e migrações
│   └── schema.prisma       # Definição das tabelas (Models)
├── public/                 # Arquivos estáticos (imagens, ícones)
├── src/
│   ├── app/                # Rotas da aplicação (Next.js App Router)
│   │   ├── (dashboard)/    # Rotas protegidas do sistema (Layout com Sidebar)
│   │   ├── api/            # API Routes (Backend)
│   │   └── login/          # Página pública de login
│   ├── components/         # Componentes React reutilizáveis
│   ├── lib/                # Utilitários e configurações de libs (Prisma, Swagger)
│   ├── types/              # Definições de tipos TypeScript
│   └── middleware.ts       # Middleware de autenticação e proteção de rotas
├── .env                    # Variáveis de ambiente
├── next.config.ts          # Configurações do Next.js
└── package.json            # Dependências e scripts
```

## 🤝 Contribuição

Contribuições são bem-vindas! Se você deseja melhorar este projeto:

1. Faça um **Fork** do projeto.
2. Crie uma **Branch** para sua feature (`git checkout -b feature/MinhaFeature`).
3. Faça o **Commit** de suas mudanças (`git commit -m 'Adiciona nova feature'`).
4. Faça o **Push** para a branch (`git push origin feature/MinhaFeature`).
5. Abra um **Pull Request**.

## 📝 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

Desenvolvido com ❤️ pela equipe **Saíderas Project**.

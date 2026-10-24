# 🗄️ GUIA OFICIAL: CRIAÇÃO E SEMENTEIRA DO BANCO NO SUPABASE

Este documento registra o procedimento oficial utilizado para criar a estrutura relacional e popular as tabelas iniciais no **Supabase** para o **Sistema de Gestão Empresarial (CassaraTech, D.A. Com Carinho, Mídia Social e Casa)**.

---

## 📌 Passo 1: Configurar a Conexão no arquivo `.env`

No seu arquivo `.env` na raiz do projeto, insira as credenciais do seu projeto no Supabase:

```env
DATABASE_URL="postgresql://postgres.elbvulbfimaffpqxpcqd:[SUA-SENHA]@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.elbvulbfimaffpqxpcqd:[SUA-SENHA]@aws-1-us-west-2.pooler.supabase.com:5432/postgres"
SESSION_SECRET="cassara-tech-da-com-carinho-security-key-2026-argon2id-prod-secret"
```
*(Substitua `[SUA-SENHA]` pela senha que você definiu ao criar o banco no Supabase)*

---

## 🚀 Passo 2: Executar os Comandos no Terminal

Abra o terminal na pasta do projeto e execute os dois comandos abaixo em ordem:

### 1. Criar todas as tabelas no Supabase:
```bash
npm run db:push
```
> **O que esse comando faz**: Conecta ao Supabase via `DIRECT_URL` e cria todas as 19 tabelas relacionais do sistema (`users`, `companies`, `cost_centers`, `chart_of_accounts`, `products`, `orders`, `contracts`, `debts`, `goals`, `commissions`, etc.), com integridade referencial e chaves estrangeiras.

### 2. Popular o banco com os dados oficiais (Seed):
```bash
npm run db:seed
```
> **O que esse comando faz**: Executa o script [`prisma/seed.mjs`](file:///c:/Users/dilna/Sistema-de-gestao-empresarial/prisma/seed.mjs) e cadastra automaticamente no Supabase:
> 1. **Usuário Administrador Geral**: `admin@cassaratech.com.br` com senha criptografada via **Argon2id**.
> 2. **5 Unidades de Negócio**: CassaraTech, D.A. Com Carinho Velas, D.A. Com Carinho Resinas, Mídia Social e Casa.
> 3. **5 Centros de Custo**: Sistemas, Velas, Resinas, Mídia Social e Casa.
> 4. **Plano de Contas Hierárquico**: 4 níveis separando Receitas, Custos Diretos/Indiretos, Despesas e Movimentações Não Operacionais.
> 5. **Catálogo Oficial D.A. Com Carinho**: Todos os **29 produtos** cadastrados com seus preços de referência protegidos.
> 6. **Metas Iniciais e Regras de Comissão**.

---

## 🔄 Comando de Atalho Único (Opcional)

Se preferir rodar tudo de uma única vez:
```bash
npm run setup:supabase
```

---

## 🔑 Credenciais Padrão Criadas no Supabase
* **E-mail de Acesso**: `admin@cassaratech.com.br`
* **Senha Inicial**: `Admin@123456` *(Validada e criptografada com Argon2id)*

# Sistema de Gestão Empresarial Integrado (SGE)

Plataforma unificada de gestão financeira, operacional, contratual e comercial para:
* **CassaraTech** (Sistemas & Tecnologia)
* **D.A. Com Carinho** (Velas Artesanais & Peças em Resina)
* **Mídia Social** (Gestão de Redes, Campanhas e Verbas de Anúncios)
* **Casa** (Acompanhamento doméstico e despesas pessoais)

---

## 🔒 Segurança e Arquitetura

* **Autenticação**: Criptografia de nível militar com **Argon2id** (OWASP Standard: 64MB de memória, 3 iterações, 4 threads paralelas).
* **Auditoria Contínua**: Tabela `audit_logs` registrando usuário, IP, entidade, operação e diff de dados antes/depois.
* **Prevenção de Duplicidades**: Idempotência em transações financeiras, conciliação e faturas de cartão.
* **Isolamento de Negócios**: 5 centros de custo independentes do plano de contas, com suporte a rateio por valor ou percentual.
* **Stack Gratuita**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Prisma ORM e PostgreSQL Serverless (Supabase ou Neon Free Tier).

---

## 🚀 Como Executar o Projeto

### 1. Configurar o Banco de Dados Gratuito

Crie um projeto PostgreSQL gratuito no [Supabase](https://supabase.com) ou no [Neon DB](https://neon.tech).

Copie a URL de conexão fornecida e cole no seu arquivo `.env`:
```env
DATABASE_URL="postgresql://[USER]:[SENHA]@[HOST]:5432/[DATABASE]?sslmode=require"
SESSION_SECRET="sua-chave-secreta-de-minimo-32-caracteres"
```

### 2. Sincronizar o Esquema e Rodar a Sementeira (Seed)

Abra o terminal no diretório do projeto e execute:
```bash
# 1. Cria todas as tabelas no banco de dados
npm run db:push

# 2. Popula os dados iniciais oficiais:
# - As 5 empresas e 5 centros de custo
# - Plano de contas hierárquico até 4 níveis
# - Os 29 modelos oficiais do catálogo da D.A. Com Carinho
# - Registro de acompanhamento do capital inicial de R$ 1.600,00
# - Usuário Administrador seguro com hash Argon2id
npm run db:seed
```

### 3. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

### 🔑 Credenciais Padrão do Administrador
* **E-mail**: `admin@cassaratech.com.br`
* **Senha**: `Admin@123456`
*(Criptografada e validada com Argon2id)*

---

## 📦 Módulos Implementados

1. **Dashboard Principal** ([`/`](file:///c:/Users/dilna/Sistema-de-gestao-empresarial/src/app/(dashboard)/page.tsx)):
   - Seletor de Centro de Custo no topo (Visão Geral Consolidada ou individual).
   - Disponibilidade bancária, contas a pagar/receber, valores vencidos e competência mensal.
   - Acompanhamento da recuperação do capital da D.A. Com Carinho (R$ 1.600,00).
   - Alertas de ruptura de estoque e separação de verbas de mídia (própria vs cliente).

2. **Painel de Desempenho & KPIs** ([`/desempenho`](file:///c:/Users/dilna/Sistema-de-gestao-empresarial/src/app/(dashboard)/desempenho/page.tsx)):
   - Indicadores Financeiros (Receitas previstas/realizadas, despesas, margem de lucro, inadimplência).
   - Indicadores Comerciais (Leads, taxa de conversão de propostas, ticket médio).
   - Indicadores de Mídia Social (Gasto em tráfego, CPL, ROAS).
   - **Fórmulas documentadas em cada métrica** e sinalização explícita de ausência de dados quando não houver importações.

3. **Metas & Planejamento** ([`/metas`](file:///c:/Users/dilna/Sistema-de-gestao-empresarial/src/app/(dashboard)/metas/page.tsx)):
   - Metas diárias, semanais, mensais, trimestrais e anuais por centro de custo.
   - Suporte a **Metas de Crescimento (Aumento)** e **Metas de Redução (Despesas/Dívidas)** com percentual de cumprimento adaptado.
   - Histórico de metas alcançadas, superadas e registro obrigatório de justificativas e planos de ação corretivos para metas não atingidas.

4. **Dívidas e Obrigações Financeiras** ([`/dividas`](file:///c:/Users/dilna/Sistema-de-gestao-empresarial/src/app/(dashboard)/dividas/page.tsx)):
   - Cadastro de empréstimos bancários, financiamentos, mútuos de sócios e dívidas com fornecedores.
   - **Separação contábil estrita**: Amortização do principal (reduz passivo) vs Juros/encargos (despesa financeira).
   - Geração automática de cronograma de parcelas e integração direta com o Contas a Pagar sem duplicidades.

5. **Controle de Comissões** ([`/comissoes`](file:///c:/Users/dilna/Sistema-de-gestao-empresarial/src/app/(dashboard)/comissoes/page.tsx)):
   - Configuração de regras (percentual ou fixo, base bruta ou líquida, gatilhos de venda ou recebimento efetivo).
   - Apuração transparente e **fluxo de aprovação formal** que gera a Conta a Pagar vinculada.

6. **Gestão de Parcerias Comerciais** ([`/parcerias`](file:///c:/Users/dilna/Sistema-de-gestao-empresarial/src/app/(dashboard)/parcerias/page.tsx)):
   - Cadastro de parceiros, afiliados, indicadores e prestadores conjuntos.
   - Rastreamento de clientes indicados, contratos gerados e taxas acordadas.

7. **Centros de Custo & Empresas** ([`/empresas`](file:///c:/Users/dilna/Sistema-de-gestao-empresarial/src/app/(dashboard)/empresas/page.tsx)):
   - Visualização isolada das 5 operações: Sistemas, Velas, Resinas, Mídia Social e Casa.

8. **Plano de Contas Hierárquico** ([`/plano-contas`](file:///c:/Users/dilna/Sistema-de-gestao-empresarial/src/app/(dashboard)/plano-contas/page.tsx)):
   - Árvore de até 4 níveis separando Receitas, Custos Diretos/Indiretos, Despesas e Movimentações Não-Operacionais.

9. **Catálogo Oficial D.A. Com Carinho** ([`/catalogo`](file:///c:/Users/dilna/Sistema-de-gestao-empresarial/src/app/(dashboard)/catalogo/page.tsx)):
   - Os 29 modelos oficiais com especificações e preços protegidos contra alterações automáticas.

10. **Contas a Pagar** ([`/contas-pagar`](file:///c:/Users/dilna/Sistema-de-gestao-empresarial/src/app/(dashboard)/contas-pagar/page.tsx)):
    - Cadastro com centro de custo, categoria contábil, vencimento, auditoria e status.

11. **Contratos com Geração Automática** ([`/contratos`](file:///c:/Users/dilna/Sistema-de-gestao-empresarial/src/app/(dashboard)/contratos/page.tsx)):
    - Minutas automáticas com dados cadastrados das partes, escopo e conformidade com LGPD para CassaraTech, D.A. e Mídia.

12. **Formulário Público de Orçamento** ([`/orcamento`](file:///c:/Users/dilna/Sistema-de-gestao-empresarial/src/app/orcamento/page.tsx)):
    - Rota pública com questionário adaptado para Sistemas, Velas, Resinas ou Mídia Social conectado ao CRM.

13. **Trilha de Auditoria & Logs** ([`/auditoria`](file:///c:/Users/dilna/Sistema-de-gestao-empresarial/src/app/(dashboard)/auditoria/page.tsx)):
    - Histórico em tempo real de quem realizou cada ação, IP, data/hora e valores.

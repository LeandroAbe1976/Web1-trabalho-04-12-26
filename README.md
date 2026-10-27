# 📊 Finanças Fluxo Livre

Sistema web de controle financeiro para **autônomos, motoristas e entregadores de aplicativo, comércios pequenos, oficinas** e uso **pessoal**. Funciona direto no navegador (inclusive no celular), sem servidor e sem instalar nada.

> Atividade Prática Avaliativa — **Desenvolvimento Web I**
> Tecnologias: HTML5, CSS3 e JavaScript (ES6+), com DOM e `localStorage`.

**Autor(es):** _(coloque seu nome aqui)_
**Link do projeto:** _(cole aqui o link do GitHub Pages)_

---

## ✨ Funcionalidades

### Base do sistema
- **Cadastro, login e recuperação de senha** por pergunta de segurança. A resposta é padronizada (sem maiúsculas, acentos ou espaços) e a senha é guardada como hash SHA-256, nunca em texto puro.
- **Fluxo de caixa (CRUD completo):** entradas e saídas, para uso pessoal ou profissional.
- **Campos de dinheiro com vírgula automática:** digite só os números (`12345` vira `123,45`).
- **Separar percentual da entrada:** ao lançar uma entrada, o usuário escolhe um % que vai direto para uma caixinha.
- **Agenda de contas a pagar**, com alertas de vencimento e **contas recorrentes com data final** (ex.: financiamento em parcelas).
- **Caixinhas:** reserva de emergência, manutenção do veículo ou qualquer objetivo, com meta e barra de progresso.
- **Forma de pagamento** (Pix, dinheiro, cartão de débito ou crédito) em entradas e saídas, com resumo do mês por forma de pagamento.
- **Separar % da entrada** em todos os módulos, com a opção de dar um nome à separação (a caixinha é criada sozinha).
- **Tema claro, escuro ou automático** (segue o sistema do aparelho).
- **Painel "Como está seu fluxo":** mostra se o mês está saudável, se o saldo cobre as contas dos próximos 30 dias e dicas de organização.
- **Módulos opcionais:** cada pessoa ativa só o que usa. Todos usam o mesmo caixa, então os módulos conversam entre si.

### 🚗 Motorista de aplicativo e entregador
- As **entradas** (Uber, 99, inDrive, Shopee, Mercado Livre, Amazon Flex...) são lançadas em *Nova Movimentação*, escolhendo o aplicativo de origem. Um card mostra quanto entrou de cada um.
- No módulo, lança-se o **km total do dia**. O app divide o km pela soma de todas as entradas do dia e mostra: ganho por km, **gasto do dia**, **líquido** e **% do dia**.
- **Custo por km manual** (valor fixo que a pessoa já calculou) **ou automático**, somando duas partes:
  - **Combustível:** valor do litro, litros, km percorridos, aditivo (nome e valor). Calcula média de consumo (km/L) e custo/km.
  - **Itens de custo:** manutenção, pneus, seguro, financiamento ou qualquer item. Cada um mostra o seu custo/km (por durabilidade em km, fixo mensal, fixo anual ou avulso), com o km do odômetro na troca e quantos km faltam para trocar.

### 🏪 Comércio e banquinha
- Cadastro de **insumos e mercadorias** (valor pago e quantidade comprada) com custo por unidade.
- Montagem de **produtos** com a quantidade usada de cada insumo (com conversão kg/g e L/ml).
- Mostra o **custo, o lucro em R$ e a margem em %** de cada produto, sempre com o preço atual dos insumos.
- **Custos fixos** do negócio e **resultado do mês** (entrou, saídas, custos fixos, líquido real e %).

### 🔧 Chapeação e pintura
- **Orçamento** com nome do cliente, contato e carro, forma de pagamento e separação de % ao receber.
- Lançamento de peças e materiais (quantidade e valor), **percentual de acréscimo escolhido pelo usuário** e mão de obra opcional.
- **Custos fixos** e **resultado do mês** também aqui.
- Total a cobrar calculado na hora; botão para **copiar o orçamento para o WhatsApp** (sem mostrar o acréscimo ao cliente) e para **marcar como recebido**, lançando no caixa.

---

## 🧱 Como o projeto atende à atividade

| Requisito | Onde está |
|---|---|
| HTML5 semântico e formulários com validação | `<header>`, `<main>`, `<section>`, `<form>`, `<footer>`; atributos `required`, `min`, `max`, `pattern`, `type="date"`, `type="tel"` |
| CSS3, Flexbox/Grid e responsividade | `style.css`, com `display: grid` e `flex`, `@media` e estados `:hover` nos botões |
| Manipulação do DOM | `querySelector`, `createElement`, `appendChild`, `innerHTML`, `classList` |
| Evento `submit` com `preventDefault()` | Todos os formulários |
| Métodos de array | `forEach`, `filter`, `map`, `reduce`, `find`, `some`, `sort` |
| **C**reate | Cadastro de movimentações, contas, caixinhas, corridas, custos, insumos, produtos e orçamentos |
| **R**ead | Renderização dinâmica de tabelas e cards a partir dos arrays |
| **U**pdate | Edição de movimentações (formulário preenchido com o registro) e de insumos; depósito/retirada nas caixinhas |
| **D**elete | Exclusão por `id` único (`Date.now()`) em todos os módulos |
| `localStorage` | `setItem` + `JSON.stringify` para salvar; `getItem` + `JSON.parse` ao carregar |

---

## 💾 Onde ficam os dados

Tudo é salvo no **`localStorage` do navegador do próprio aparelho**. Nenhum dado é enviado para servidor ou internet.

- Cada usuário cadastrado tem seus **próprios dados separados**.
- Cada aparelho e cada navegador guardam dados diferentes: a conta criada no computador não existe no celular.
- **Limpar os dados do navegador, trocar de aparelho ou usar aba anônima apaga ou esconde as informações.**

### ⚠️ Sobre a segurança do login
O login impede que outra pessoa abra o app e veja os valores, por exemplo, se o aparelho for perdido ou usado por alguém. Como o projeto roda só no navegador e **não tem servidor**, ele **não substitui** a trava de tela do celular: alguém com conhecimento técnico e acesso ao aparelho desbloqueado ainda pode ler os dados guardados.

---

## 🚀 Como usar

### Pelo navegador (computador)
1. Baixe os arquivos `index.html`, `style.css` e `script.js` na **mesma pasta**.
2. Abra o `index.html` no navegador.

### Pelo celular
1. Abra o link do projeto publicado (GitHub Pages).
2. Crie sua conta na tela de cadastro.
3. Em **"Meus módulos"**, ative os que combinam com o seu trabalho.
4. Para usar como app: no Android (Chrome), menu ⋮ → *Adicionar à tela inicial*; no iPhone (Safari), compartilhar → *Adicionar à Tela de Início*.

### Publicar no GitHub Pages
1. Envie `index.html`, `style.css`, `script.js` e `README.md` para um repositório.
2. Em **Settings → Pages**, escolha *Deploy from branch*, a branch `main` e a pasta `/ (root)`.
3. Aguarde alguns minutos e use o link gerado.

---

## 📁 Estrutura

```
├── index.html   # estrutura da página, formulários e módulos
├── style.css    # estilos, layout responsivo e estados visuais
├── script.js    # lógica, CRUD, cálculos e persistência
└── README.md
```

## 🔮 Melhorias futuras
- Backup: exportar e importar os dados em arquivo.
- Tabelas em formato de cartão no celular.
- Edição de produtos, km e orçamentos.
- Novos módulos, como alimentação e feira, aproveitando a mesma estrutura de itens de custo.
- Instalação como PWA.

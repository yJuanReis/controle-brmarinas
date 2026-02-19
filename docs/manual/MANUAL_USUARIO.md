# Manual de Uso do Sistema BR Marinas

## Sistema de Controle de Acesso para Marinas

**Versão:** 3.0  
**Última atualização:** Fevereiro/2026

---

## 📑 Índice

1. [Introdução](#introdução)
2. [Tela de Login](#tela-de-login)
3. [Página Principal (Dashboard)](#página-principal-dashboard)
4. [Página de Pessoas](#página-de-pessoas)
5. [Página de Histórico](#página-de-histórico)
6. [Painel Administrativo](#painel-administrativo)
7. [Relatórios](#relatórios)
8. [Glossário](#glossário)
9. [Perguntas Frequentes](#perguntas-frequentes)

---

## Introdução

O **Sistema BR Marinas** é uma plataforma de controle de acesso desenvolvida especificamente para marinas, permitindo o registro de entradas e saídas de pessoas, gestão de pessoas cadastradas e geração de relatórios.

### Para que serve este sistema?

O sistema foi projetado para resolver três necessidades principais:

1. **Controle de acesso:** Registrar quem entra e sai da marina, com horário, data e observação
2. **Gestão de pessoas:** Manter um cadastro atualizado de clientes, visitantes, marinheiros e colaboradores
3. **Relatórios:** Gerar documentos com o histórico de movimentações para fins de controle e auditoria

### Quem deve usar este manual?

Este manual foi desenvolvido para todos os usuários do sistema, desde operadores que fazem o registro diário de entradas e saídas até administradores que gerenciam usuários e geram relatórios.

---

## Tela de Login

### Como acessar o sistema

Para acessar o sistema BR Marinas, siga estes passos:

1. Abra o navegador web (Chrome, Edge, Firefox ou Safari)
2. Digite o endereço do sistema fornecido pela administração
3. Você será direcionado para a tela de login

### Fazendo login

A tela de login contém dois campos obrigatórios:

| Campo     | Descrição                           |
| --------- | ----------------------------------- |
| **Email** | Seu endereço de email institucional |
| **Senha** | Sua senha pessoal                   |

**Passo a passo:**

1. Clique no campo "Email"
2. Digite seu email completo (exemplo: joao.silva@marina.com)
3. Clique no campo "Senha"
4. Digite sua senha
5. Clique no botão "Entrar no Sistema"

### Situação: Credenciais inválidas

Se você digitar email ou senha incorretos, uma mensagem de erro será exibida abaixo do formulário:

> "Email ou senha incorretos. Por favor, tente novamente."

**O que fazer:**

1. Verifique se o email está digitado corretamente (sem espaços extras)
2. Verifique se a senha está correta (diferenci maiúsculas de minúsculas)
3. Se esqueceu a senha, entre em contato com o administrador do sistema
4. Tente fazer login novamente

### Dicas de segurança

- Nunca compartilhe sua senha com outras pessoas
- Se suspeitar que alguém descobriu sua senha, altere-a imediatamente (consulte um administrador)
- Faça logout do sistema quando terminar de usar, especialmente em computadores compartilhados

---

## Página Principal (Dashboard)

### Visão geral

A página principal é o local onde você realizará o dia a dia do controle de acesso. Ela é dividida em três áreas principais:

1. **Barra de ações principais** - Botões grandes para as ações mais comuns
2. **Lista de pessoas dentro da marina** - Tabela mostrando quem está atualmente na marina
3. **Controles de paginação** - Para navegar em listas longas

### Registrando uma entrada

Quando uma pessoa chega à marina, você deve registrar sua entrada. Siga estes passos:

#### Passo 1: Acessar o registro de entrada

1. Na barra de ações principais, clique no botão **"Registrar Entrada"** (botão verde)

#### Passo 2: Buscar a pessoa

Uma janela será aberta com duas opções:

**Opção A: Pessoa já cadastrada**

1. No campo de busca, digite parte do nome, documento (CPF/RG) ou placa do veículo
2. A lista abaixo mostrará os resultados correspondentes
3. Clique na pessoa desejada para selecioná-la

**Opção B: Pessoa nova (não cadastrada)**

1. Clique no botão **"Cadastrar"** no canto superior direito da janela
2. Preencha os dados da nova pessoa (veja detalhes na seção "Cadastrar Nova Pessoa")
3. Após cadastrar, a pessoa será automaticamente selecionada

#### Passo 3: Preencher a observação

**Este campo é obrigatório!**

No campo "Observação de Entrada", descreva o motivo da entrada:

- Para onde a pessoa vai (ex: "Barco saveiro", "Iate XPTO")
- O que vai fazer (ex: "Manutenção", "Abastecimento")
- Qualquer informação relevante (ex: "Entrega de material", "Reparo no motor")

**Exemplos de observações válidas:**

- "Vai para o barco Casa Grande"
- "Manutenção no motor do saveiro"
- "Entrega de combustível"
- "Inspeção de segurança"

#### Passo 4: Confirmar a entrada

1. Revise se os dados estão corretos
2. Clique no botão **"Confirmar Entrada"** (botão verde no canto inferior direito)

### Registrando uma saída

Quando uma pessoa deixa a marina, você deve registrar sua saída. Existem duas formas:

#### Saída Individual (uma pessoa)

1. Na lista de pessoas dentro da marina, localize a pessoa
2. Clique no botão **"Saída"** na coluna "Ação"
3. Uma janela será aberta para confirmar
4. Clique em **"Confirmar Saída"**

#### Saída em Lote (várias pessoas)

Quando várias pessoas saem ao mesmo tempo, você pode registrar todas de uma vez:

1. Na barra de ações principais, clique no botão **"Registrar Saída"** (botão vermelho)
2. Uma janela será aberta listando todas as pessoas dentro da marina
3. Para cada pessoa, você pode:
   - Clicar no botão "Registrar Saída" ao lado do nome (saída individual)
   - Ou adicionar observações específicas
4. Para registrar saída de **todas** as pessoas:
   - Clique no botão **"Registrar saida de todas as pessoas"** no rodapé
   - Confirme digitando "CONFIRMAR"
   - Aguarde 3 segundos (timer de segurança)
   - Clique em "Confirmar Saída em Lote"

### Entendendo a lista de pessoas dentro da marina

A tabela principal mostra todas as pessoas que estão atualmente na marina.

| Coluna        | Descrição                                                                          |
| ------------- | ---------------------------------------------------------------------------------- |
| **Pessoa**    | Nome da pessoa (clique para ver detalhes)                                          |
| **Documento** | CPF, RG ou documento de identificação                                              |
| **Placa**     | Placa do veículo (se houver)                                                       |
| **Tipo**      | Classificação: Cliente, Visita, Marinheiro, Colaborador, Proprietário ou Prestador |
| **Entrada**   | Horário de entrada e tempo decorrido                                               |
| **Ação**      | Botões para editar ou registrar saída                                              |

### Expandindo detalhes

Na lista de pessoas dentro da marina, você pode clicar em qualquer linha para expandir e ver a observação registrada na entrada.

### Atualizando os dados

Para atualizar a lista (recarregar dados do servidor):

1. Clique no botão **"Atualizar"** na barra de ações principais

**Nota:** A lista é atualizada automaticamente quando você registra uma entrada ou saída.

### Paginação

Se houver muitas pessoas na marina, a lista será dividida em páginas:

- Use os botões **"Anterior"** e **"Próximo"** para navegar
- Ou clique diretamente no número da página desejada

---

## Página de Pessoas

### Visão geral

A página de Pessoas permite visualizar e gerenciar todas as pessoas cadastradas no sistema da sua marina.

### Visualizando pessoas cadastradas

Ao acessar a página, você verá cards com as informações de cada pessoa:

- Nome completo
- Tipo de pessoa (Cliente, Visita, etc.)
- Documento (CPF/RG)
- Contato (telefone)
- Placa do veículo (se houver)

### Buscando uma pessoa

Use o campo de busca para encontrar rapidamente uma pessoa:

1. Digite no campo "Buscar pessoa" parte de:
   - Nome da pessoa
   - Documento (CPF, RG)
   - Placa do veículo
2. A lista será filtrada automaticamente em tempo real

### Filtrando por tipo

Use o filtro "Tipo de pessoa" para ver apenas determinadas categorias:

- **Todos os tipos** - Mostra todas as pessoas
- **Cliente** - Pessoas que utilizam os serviços da marina
- **Visita** - Visitantes ocasionais
- **Marinheiro** - Profissionais que trabalham em embarcações
- **Proprietário** - Donos de embarcações atracadas
- **Colaborador** - Funcionários da marina

### Cadastrando uma nova pessoa

Para adicionar uma nova pessoa ao sistema:

1. Clique no botão **"Cadastrar Pessoa"** (botão laranja no topo)
2. Preencha os campos do formulário:

| Campo         | Obrigatório? | Descrição                           |
| ------------- | ------------ | ----------------------------------- |
| **Nome**      | Sim          | Nome completo da pessoa             |
| **Documento** | Sim          | CPF ou RG (apenas números e letras) |
| **Tipo**      | Não          | Categoria da pessoa                 |
| **Contato**   | Não          | Telefone para contato               |
| **Placa**     | Não          | Placa do veículo (formato ABC-1234) |

3. Clique em **"Cadastrar"** para salvar

**Dica:** Se quiser cadastrar e já registrar a entrada da pessoa, use o botão **"Cadastrar e Registrar"**.

### Editando dados de uma pessoa

Para alterar informações de uma pessoa já cadastrada:

1. Na lista de pessoas, localize o card desejado
2. Clique no botão **"Editar"** (ícone de lápis)
3. Altere os dados necessários
4. Clique em **"Salvar"**

### Excluindo uma pessoa

Para remover uma pessoa do sistema:

1. Na lista de pessoas, localize o card desejado
2. Clique no botão **"Excluir"** (ícone de lixeira)
3. Uma janela de confirmação será aberta
4. Revise as informações (o nome será exibido)
5. Clique em **"Excluir"** para confirmar

**⚠️ Atenção:** A exclusão é permanente e não pode ser desfeita!

---

## Página de Histórico

### Visão geral

A página de Histórico contém o registro completo de todas as movimentações (entradas e saídas) que ocorreram na marina.

### Diferença entre Lista e Diário

Você pode visualizar o histórico de duas formas:

#### Visualização em Lista

Mostra os registros em formato de tabela, um abaixo do outro, ordenados por data (mais recente primeiro).

**Ideal para:** Buscar um registro específico ou fazer filtros precisos.

#### Visualização em Diário

Agrupa os registros por dia, mostrando um resumo de cada dia (quantas entradas, quantas pessoas ainda estão dentro).

**Ideal para:** Ter uma visão geral do movimento diário.

### Usando filtros

A página oferece vários filtros para encontrar registros específicos:

| Filtro          | Descrição                            |
| --------------- | ------------------------------------ |
| **Data início** | Mostra registros a partir desta data |
| **Data fim**    | Mostra registros até esta data       |
| **Tipo**        | Filtra por tipo de pessoa            |
| **Nome**        | Busca por nome da pessoa             |
| **Documento**   | Busca por CPF/RG                     |
| **Placa**       | Busca por placa do veículo           |

**Como usar:**

1. Preencha os filtros desejados
2. Os resultados são filtrados automaticamente
3. Para limpar filtros, clique em "Limpar filtros"

### Busca global

Use o campo de busca no topo para procurar em todo o histórico:

1. Digite o termo de busca
2. A busca é feita em: nome, documento, placa, tipo e observação
3. Resultados são exibidos instantaneamente

### Ver detalhes de um registro

Na visualização em Lista, clique em qualquer linha para expandir e ver a observação registrada.

Na visualização em Diário, clique em "Expandir" para ver todos os registros daquele dia.

### Registrando saída pelo histórico

Se uma pessoa está dentro da marina e você está no histórico:

1. Localize o registro da pessoa (ela terá status "Dentro")
2. Clique no botão **"Saída"**
3. Confirme a saída

### Entendendo o status

| Status     | Significado                                   |
| ---------- | --------------------------------------------- |
| **Dentro** | A pessoa entrou mas ainda não registrou saída |
| **Saiu**   | A pessoa já registrou a saída                 |

---

## Painel Administrativo

### Visão geral

O Painel Administrativo é uma área restrita para gerenciamento do sistema. Nem todos os usuários têm acesso a esta área.

### Quem pode acessar?

Apenas usuários com função de **Administrador** ou **Dono** podem acessar o painel administrativo.

### Seções do painel

O painel possui as seguintes abas:

1. **Dashboard** - Visão geral com estatísticas
2. **Empresas** - Gerenciamento de empresas (apenas Dono)
3. **Usuários** - Gerenciamento de usuários do sistema
4. **Info** - Informações técnicas do sistema

### Visualizando estatísticas

A aba Dashboard mostra cards com informações importantes:

| Card                   | O que mostra                           |
| ---------------------- | -------------------------------------- |
| **Total Empresas**     | Quantas marinas estão cadastradas      |
| **Usuários**           | Quantos usuários tem na sua marina     |
| **Total Pessoas**      | Quantas pessoas estão cadastradas      |
| **Movimentações Hoje** | Quantas entradas/saídas ocorreram hoje |

### Gerenciando usuários

#### Adicionar novo usuário

1. Na aba "Usuários", clique em **"Adicionar Usuário"**
2. Preencha os dados:
   - Nome completo
   - Email (será usado para login)
   - Senha inicial
3. Defina o tipo de usuário:
   - **Usuário** - Pode acessar normalmente, mas não admin
   - **Dono** - Acesso total ao sistema
4. Clique em **"Adicionar"**

#### Alterar senha de usuário

1. Na lista de usuários, clique no botão de senha (ícone de chave)
2. Digite a nova senha
3. Confirme a alteração

#### Remover usuário

1. Na lista de usuários, clique no botão de excluir (lixeira)
2. Confirme a remoção digitando ou confirmando

**⚠️ Atenção:** Cuidado ao remover usuários. Se remover o último administrador, ninguém poderá acessar o painel!

### Acessando relatórios

Para gerar relatórios:

1. No painel, clique no botão **"Ver Relatórios"**
2. Ou acesse diretamente pela página inicial (se disponível)

### Saindo do painel

Para sair do painel administrativo e retornar à página principal:

1. Clique no botão **"Sair do Painel Admin"** no rodapé

---

## Relatórios

### Visão geral

O sistema permite gerar relatórios das movimentações em diferentes formatos, ideais para exportação, impressão ou auditoria.

### Gerando um relatório

#### Passo 1: Definir o período

Você pode escolher o período de duas formas:

**Por data e hora:**

1. Preencha "Data início" e "Hora início"
2. Preencha "Data fim" e "Hora fim"
3. Use esta opção para períodos específicos (ex: um dia específico)

**Por mês:**

1. Clique no botão com ícone de calendário
2. Selecione o ano desejado
3. Clique no mês desejado
4. O sistema usará todo o mês selecionado

#### Passo 2: Escolher o formato

Selecione o formato do arquivo a ser baixado:

| Formato   | Extensão | Melhor para                           |
| --------- | -------- | ------------------------------------- |
| **PDF**   | .pdf     | Impressão, visualização, apresentação |
| **Excel** | .xlsx    | Edição de dados, planilhas            |
| **CSV**   | .csv     | Importação em outros sistemas         |
| **TXT**   | .txt     | Leitura simples, texto puro           |

#### Passo 3: Baixar o relatório

1. Clique no botão **"Baixar Relatório"**
2. Aguarde a geração do arquivo
3. O download iniciará automaticamente

### O que contém o relatório?

O relatório inclui as seguintes informações para cada movimentação:

| Campo            | Descrição                                             |
| ---------------- | ----------------------------------------------------- |
| **Data Entrada** | Dia que a pessoa entrou                               |
| **Hora Entrada** | Horário de entrada                                    |
| **Data Saída**   | Dia que a pessoa saiu (vazio se ainda estiver dentro) |
| **Hora Saída**   | Horário de saída                                      |
| **Nome**         | Nome da pessoa                                        |
| **Documento**    | CPF ou RG                                             |
| **Tipo**         | Categoria da pessoa                                   |
| **Placa**        | Placa do veículo (se houver)                          |
| **Observações**  | Observações registradas na entrada e saída            |

---

## Glossário

### Termos utilizados no sistema

| Termo             | Significado                                                                      |
| ----------------- | -------------------------------------------------------------------------------- |
| **Marina**        | Local onde embarcações são atracadas; também chamado de iateclub ou club náutico |
| **Movimentação**  | Registro de uma entrada ou saída de pessoa na marina                             |
| **Pessoa Dentro** | Pessoa que entrou na marina mas ainda não registrou saída                        |
| **CPF**           | Cadastro de Pessoa Física (documento de identificação)                           |
| **RG**            | Registro Geral (carteira de identidade)                                          |
| **Placa**         | Identificação do veículo (ex: ABC-1234)                                          |
| **Observação**    | Informação adicional registrada junto com a entrada/saída                        |
| **RLS**           | Row Level Security - Segurança a nível de linha (termo técnico)                  |

### Tipos de pessoa

| Tipo             | Descrição                                                              |
| ---------------- | ---------------------------------------------------------------------- |
| **Cliente**      | Pessoa que utiliza os serviços da marina (ex: atracação, manutenção)   |
| **Visita**       | Visitante ocasional que não é cliente regular                          |
| **Marinheiro**   | Profissional que trabalha em embarcações                               |
| **Proprietário** | Dono de embarcação atracada na marina                                  |
| **Colaborador**  | Funcionário da marina                                                  |
| **Prestador**    | Empresa ou pessoa que presta serviços na marina (ex: mecânico, pintor) |

---

## Perguntas Frequentes

### Login e Acesso

**P: Esqueci minha senha. O que fazer?**

R: Se você esqueceu sua senha, entre em contato com o administrador do sistema. Ele poderá redefinir sua senha para que você possa acessar o sistema novamente.

**P: Meu login não funciona. O que pode ser?**

R: Verifique os seguintes pontos:

- O email está digitado corretamente?
- A senha está digitada corretamente (verifique maiúsculas/minúsculas)?
- Você tem autorização para acessar o sistema?
- O sistema está online?

Se o problema persistir, contate o administrador.

**P: Posso alterar minha própria senha?**

R: Sim, se você for um usuário administrador. Acesse o Painel Administrativo e procure a opção de alterar senha. Usuários comuns devem solicitar a alteração a um administrador.

---

### Registrando Entradas e Saídas

**P: O que fazer se eu registrar uma entrada errada?**

R: Você pode editar a movimentação posteriormente. Vá até a página de Histórico, localize o registro, clique em "Editar" e corrija as informações necessárias.

**P: Posso registrar saída com horário diferente do atual?**

R: Sim. Ao registrar uma saída individual, você pode alterar o horário no campo apropriado antes de confirmar.

**P: É obrigatório preencher a observação na entrada?**

R: Sim. A observação é obrigatória e ajuda a identificar o propósito da visita, para onde a pessoa vai na marina, ou qualquer informação relevante para segurança e controle.

**P: Uma pessoa pode entrar na marina sem estar cadastrada?**

R: Sim. Você pode cadastrar a pessoa no momento do registro de entrada. O sistema permite que você preencha os dados e já registre a entrada em uma única operação.

---

### Pessoas e Cadastros

**P: Posso ter duas pessoas com o mesmo documento?**

R: Não. O sistema não permite cadastrar duas pessoas com o mesmo documento (CPF/RG) dentro da mesma marina.

**P: Posso alterar o documento de uma pessoa depois de cadastrar?**

R: Sim. Edite os dados da pessoa e altere o documento. O sistema verificará se já não existe outra pessoa com o mesmo documento.

**P: O que acontece se eu excluir uma pessoa que está dentro da marina?**

R: O sistema alertará sobre isso. Se a pessoa ainda estiver com registro de entrada ativo, recomenda-se registrar a saída antes de excluir o cadastro.

**P: Posso buscar pessoas pelo número do celular?**

R: Sim. O campo de busca pesquisa por nome, documento e placa. Se quiser buscar pelo celular, você pode usar a função de filtro ou editar o cadastro da pessoa para incluir essa informação.

---

### Relatórios

**P: Os relatórios incluem movimentações excluídas?**

R: Sim, por padrão os relatórios incluem todas as movimentações do período selecionado.

**P: Qual o limite de registros em um relatório?**

R: O sistema pode gerar relatórios com milhares de registros. Para períodos muito longos, o processo pode levar alguns segundos.

**P: Posso gerar relatório de um dia específico?**

R: Sim. Basta definir a data início e data fim com o mesmo dia, e as horas desejadas (geralmente 00:00 às 23:59).

**P: O arquivo PDF gerado pode ser impresso?**

R: Sim. O PDF é gerado em formato A4 paisagem, otimizado para impressão.

---

### Problemas Técnicos

**P: A tela não está atualizando. O que fazer?**

R: Tente as seguintes soluções:

1. Clique no botão "Atualizar" para recarregar os dados
2. Pressione F5 para atualizar a página
3. Limpe o cache do navegador
4. Tente acessar por outro navegador

**P: Os dados desapareceram. Perdi tudo?**

R: Não se preocupe. O sistema salva todos os dados em servidor seguro. Se os dados não aparecerem na tela, tente atualizar a página ou faça login novamente.

**P: O sistema está lento. É normal?**

R: Em geral, o sistema é rápido. Se estiver lento, pode ser devido a:

- Conexão de internet lenta
- Servidor em manutenção
- Muita carga de uso simultâneo

Tente novamente em alguns minutos ou entre em contato com o administrador se o problema persistir.

**P: Posso usar o sistema no celular?**

R: Sim! O sistema é responsivo e funciona em smartphones e tablets, embora a experiência completa seja em computadores.

---

## Dicas de Uso

### Para operadores de entrada/saída

1. **Sempre preencha a observação** - Isso ajuda a identificar quem está na marina e para onde foram
2. **Registre a saída imediatamente** - Evita acumular registros de pessoas que já saíram
3. **Use a saída em lote** - Quando várias pessoas saem juntas, economize tempo
4. **Atualize a tela** - Se houver dúvidas sobre quem está dentro, clique em "Atualizar"

### Para administradores

1. **Mantenha os usuários atualizados** - Adicione novos usuários conforme necessário
2. **Gere relatórios periódicos** - Para controle e auditoria
3. **Documente procedimentos** - Compartilhe este manual com novos usuários
4. **Revise o histórico regularmente** - Para identificar padrões e melhorias

---

## Suporte

### Precisa de ajuda?

Se você tiver dúvidas ou problemas:

1. **Consulte este manual** - Verifique se a resposta está nas Perguntas Frequentes
2. **Fale com o administrador** - Ele pode ajudar com a maioria dos problemas
3. **Entre em contato com o suporte** - Para problemas técnicos específicos

### Informações do sistema

Ao reportar problemas, é útil informar:

- O que você estava tentando fazer
- Qual página ou função estava usando
- Se recebeu alguma mensagem de erro
- Qual navegador está usando
- Se possível, uma screenshot do problema

---

**Fim do Manual**

Obrigado por usar o Sistema BR Marinas!

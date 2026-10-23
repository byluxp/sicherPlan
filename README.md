# SicherPlan

Sistema de gestão de Saúde e Segurança do Trabalho (SST) para centralizar o controle de colaboradores, EPIs, documentos, treinamentos, vencimentos e pendências da empresa.

## Objetivo

O SicherPlan tem como objetivo reduzir controles manuais e facilitar o acompanhamento das obrigações de SST. A aplicação reunirá as informações em um único lugar, permitindo identificar pendências, acompanhar prazos, manter históricos e gerar documentos padronizados.

## Funcionalidades previstas

### Colaboradores

- Cadastro de colaboradores;
- associação com setor e função;
- controle de colaboradores ativos e inativos;
- visualização dos dados cadastrais;
- histórico de mudanças de função;
- identificação de EPIs e documentos pendentes.

### EPIs

- Cadastro de equipamentos de proteção individual;
- classificação por grupo de proteção;
- controle do Certificado de Aprovação (CA);
- validade e status do CA;
- upload do documento do CA;
- controle de durabilidade do EPI;
- ordenação por vencimento;
- bloqueio de entrega de equipamentos vencidos.

### Setores e funções

- Cadastro de setores e funções;
- definição de EPIs obrigatórios por função;
- cadastro de treinamentos e documentos exigidos;
- atualização das exigências quando a função do colaborador for alterada.

### Entrega de EPIs

- Seleção do colaborador;
- pesquisa de EPI por nome ou CA;
- registro de data, quantidade e observações da entrega;
- histórico de equipamentos fornecidos;
- geração da ficha de EPI.

### Documentos e vencimentos

- Upload de documentos obrigatórios;
- controle dos status anexado, pendente, válido e vencido;
- cadastro e acompanhamento de ASOs;
- controle de certificados e treinamentos;
- alertas para documentos próximos do vencimento;
- manutenção do histórico de documentos vencidos.

### Dashboard

- Exames e ASOs próximos do vencimento;
- documentos e certificados vencidos ou a vencer;
- EPIs com CA próximo do vencimento;
- EPIs obrigatórios pendentes por colaborador;
- filtros por setor;
- visão geral de colaboradores ativos e inativos.

### Geração de documentos

O sistema deverá gerar documentos padronizados utilizando os dados já cadastrados, incluindo:

- Certificado NR 06;
- Certificado NR 12;
- Certificado NR 18;
- Certificado NR 35;
- Ficha de EPI;
- Ordem de Serviço.

### Agente de IA

O agente de IA será desenvolvido em uma etapa posterior e poderá:

- responder dúvidas relacionadas à SST;
- fornecer explicações baseadas nas Normas Regulamentadoras;
- consultar informações do sistema em modo de leitura;
- gerar relatórios de pendências;
- sugerir ações para regularização.

Alterações ou criação de registros por meio da IA deverão exigir confirmação explícita do usuário.

## Escopo do MVP

A primeira versão do sistema deverá priorizar:

1. Cadastro de setores e funções;
2. Cadastro de colaboradores;
3. Cadastro de EPIs e CAs;
4. Matriz de EPIs obrigatórios por função;
5. Registro de entregas de EPIs;
6. Cadastro e controle de ASOs;
7. Upload e acompanhamento de documentos;
8. Dashboard de vencimentos e pendências;
9. Autenticação básica de usuários.

A geração avançada de documentos e o agente de IA serão implementados após a estabilização das funcionalidades principais.

## Tecnologias previstas

### Frontend

- React;
- TypeScript;
- Vite;
- React Router;
- React Hook Form;
- Zod;
- Material UI ou biblioteca equivalente;
- ESLint e Prettier.

### Backend

- Python;
- FastAPI;
- SQLAlchemy;
- Alembic;
- Pydantic;
- JWT para autenticação;
- Pytest para testes automatizados.

### Banco de dados e arquivos

- PostgreSQL;
- MinIO ou outro armazenamento compatível com S3 para PDFs e documentos;
- Docker Compose para o ambiente de desenvolvimento.

## Estrutura do projeto

```text
sicherPlan/
├── frontend/       # Interface e navegação do sistema
├── backend/        # API, regras de negócio e acesso ao banco
├── docs/           # Planejamento, requisitos e documentação
└── README.md       # Documentação inicial do projeto
```

## Modelo inicial de dados

As principais entidades previstas são:

- Usuário;
- Setor;
- Função;
- Colaborador;
- EPI e CA;
- EPI obrigatório por função;
- Entrega de EPI;
- ASO;
- Documento;
- Certificado e treinamento;
- Ordem de Serviço;
- Ficha de EPI;
- Histórico de função.

## Regras de negócio principais

- Todo colaborador deverá possuir um setor e uma função;
- setores e funções em uso não poderão ser excluídos;
- EPIs vencidos não poderão ser entregues;
- as pendências deverão ser recalculadas após alteração de função;
- vencimentos deverão aparecer no dashboard;
- documentos deverão ser vinculados ao colaborador correto;
- arquivos enviados deverão ter validação de formato e tamanho;
- o acesso aos dados deverá exigir autenticação.

## Fases de desenvolvimento

1. Preparação do ambiente e estrutura do projeto;
2. Modelagem do banco de dados e migrations;
3. Autenticação e cadastros básicos;
4. Cadastro de EPIs e controle de CAs;
5. Matriz de EPIs obrigatórios e entregas;
6. Documentos, ASOs e certificados;
7. Dashboard e alertas de vencimento;
8. Geração de documentos;
9. Agente de IA;
10. Testes, revisão e preparação para produção.

## Critérios de conclusão do MVP

O MVP será considerado funcional quando for possível:

- cadastrar setores, funções, colaboradores e EPIs;
- definir EPIs obrigatórios por função;
- registrar entregas e identificar pendências;
- cadastrar ASOs e documentos;
- visualizar vencimentos e filtrar informações por setor;
- executar os principais fluxos pela interface;
- executar testes básicos do backend;
- iniciar o projeto seguindo as instruções da documentação.

## Como inicializar o ambiente local

### Requisitos

- Docker com Docker Compose;
- Python 3 e `venv`;
- Node.js 22.12 ou superior e npm.

Execute os comandos de Docker na raiz do repositório. Mantenha o banco, o backend e o frontend em terminais separados para que cada processo continue em execução.

### 1. Configure o `.env`

O backend procura o arquivo `.env` na pasta atual ou nas pastas acima. Crie-o na raiz do projeto, ao lado de `docker-compose.yml`. Se ainda não existir, copie o exemplo:

```bash
cp .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

### 2. Inicie o PostgreSQL

Na raiz do projeto:

```bash
docker compose up -d postgres
```

Confirme que o container está saudável:

```bash
docker compose ps
docker compose exec postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

O Compose lê o `.env` da raiz para configurar o banco. As variáveis `POSTGRES_*` são aplicadas quando o volume é inicializado pela primeira vez; mudar a senha no `.env` depois disso não altera a senha gravada no volume existente.

### 3. Prepare e inicie o backend

Em um segundo terminal, a partir da raiz do projeto:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

No PowerShell, use os comandos equivalentes:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
$env:POSTGRES_PORT = "5433"
python -m uvicorn main:app --reload
```

Ative sempre o virtualenv antes de instalar dependências ou iniciar Uvicorn. Inicie o comando com a pasta atual em `backend`, para que `main:app` seja encontrado. A aplicação cria tabelas que faltam e executa `seed_initial_data()` no startup.

Confirme a API em `http://127.0.0.1:8000/` (deve retornar `{"status":"Backend do SicherPlan rodando"}`) e acesse a documentação em `http://127.0.0.1:8000/docs`.

### 4. Inicie o frontend

Em um terceiro terminal, a partir da raiz:

```bash
cd frontend
npm install
npm run dev
```

Abra a URL exibida pelo Vite, normalmente `http://localhost:5173`. O frontend está configurado para chamar a API em `http://127.0.0.1:8000`; portanto, mantenha o backend em execução. Não é necessário criar um `.env` para o frontend neste momento.

Para validar o build de produção ou visualizá-lo localmente:

```bash
npm run build
npm run preview
```

### Encerrar e resolver problemas comuns

- Para parar cada processo, use `Ctrl+C` no terminal correspondente. `docker compose down` para e remove o container e a rede, mas preserva o volume do banco.
- `password authentication failed`: confira se `POSTGRES_PASSWORD` e a senha da `DATABASE_URL` correspondem à senha usada quando o volume foi criado. Alterar o `.env` não atualiza um volume existente.
- Erro indicando conexão em `localhost:5432`: confira `POSTGRES_PORT`, a porta da `DATABASE_URL` e variáveis antigas exportadas no terminal. Para este Compose, o acesso do backend deve ser pela porta `5433`.
- `Address already in use` na porta `8000`: verifique `http://127.0.0.1:8000/` antes de iniciar outro Uvicorn. Se a API já estiver respondendo, continue usando essa instância; caso contrário, encerre o processo anterior com `Ctrl+C` no terminal em que ele foi iniciado. O frontend está configurado para usar a porta `8000`.
- Só reinicialize o banco se puder apagar todos os dados locais. Para remover o banco e recriá-lo do zero, execute na raiz:

```bash
docker compose down
docker volume rm sicherplan_postgres_data
docker compose up -d postgres
```

O comando `docker volume rm` é destrutivo: apaga permanentemente os dados desse banco local. Não use `docker compose down -v` como tentativa de corrigir autenticação sem confirmar que deseja apagar o volume.

## Status do projeto

O SicherPlan está em fase inicial de planejamento e desenvolvimento. Este README servirá como documento de referência para acompanhar a implementação e a evolução do sistema.

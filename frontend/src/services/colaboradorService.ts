import {api} from './api'
import type { TreinamentoObrigatorio } from './funcaosetorService'

export interface Colaborador {
    id: number;
    nome: string;
    cpf: string;
    data_nascimento: string | null;
    data_admissao: string | null;
    data_demissao: string | null;
    setor_id: number;
    funcao_id: number;
    ativo: boolean;
    // null = não avaliado; false (inapto) bloqueia o certificado de NR-35
    apto_trabalho_altura: boolean | null;
    criado_em: string | null;
    atualizado_em: string | null;
}

export interface ColaboradorCreate {
    nome: string;
    cpf: string;
    data_nascimento: string | null;
    data_admissao: string | null;
    data_demissao: string | null;
    setor_id: number;
    funcao_id: number;
    ativo: boolean;
    apto_trabalho_altura: boolean;
}

// Dados lidos do documento de identificação pelo backend, para conferência antes de salvar
export interface ColaboradorImportacaoDocumento {
    tipo_documento: string;
    nome: string | null;
    cpf: string | null;
    data_nascimento: string | null;
    campos_nao_encontrados: string[];
    metodo_leitura: 'ia' | 'ocr';
    avisos: string[];
    colaborador_existente: Colaborador | null;
}

// Resumo de SST mostrado na consulta do colaborador
export interface FichaAso {
    id: number;
    tipo: string;
    data_emissao: string;
    // null no demissional
    data_vencimento: string | null;
}

export interface FichaTreinamento {
    id: number;
    certificado_id: number;
    nr_codigo: string | null;
    nome_certificado: string;
    tipo: 'inicial' | 'reciclagem';
    data_emissao: string;
    data_vencimento: string | null;
}

export interface FichaEntregaEpi {
    id: number;
    assinado: boolean | null;
}

export interface FichaDocumento {
    id: number;
    tipo_documento: string;
    validado: boolean | null;
}

export interface FichaOrdemServico {
    id: number;
    assinado: boolean | null;
}

export interface FichaColaborador {
    colaborador: Colaborador;
    setor: string;
    funcao: string;
    // treinamentos exigidos pela função do colaborador
    treinamentosObrigatorios: TreinamentoObrigatorio[];
    asos: FichaAso[];
    treinamentos: FichaTreinamento[];
    entregas: FichaEntregaEpi[];
    documentos: FichaDocumento[];
    ordensServico: FichaOrdemServico[];
}

export const colaboradorService = {
    consultarFicha: async (id: number): Promise<FichaColaborador> => {
        const params = { colaborador_id: id };
        const [colaborador, setores, funcoes, asos, treinamentos, entregas, documentos, ordensServico] = await Promise.all([
            api.get<Colaborador>(`/colaboradores/${id}`),
            api.get<{ id: number; nome: string }[]>('/setores/', { params: { apenas_ativos: false } }),
            api.get<{ id: number; nome: string; treinamentos_obrigatorios: TreinamentoObrigatorio[] }[]>('/funcoes/', { params: { apenas_ativos: false } }),
            api.get<FichaAso[]>('/asos/', { params }),
            api.get<FichaTreinamento[]>('/treinamentos/', { params }),
            api.get<FichaEntregaEpi[]>('/entregas-epi/', { params }),
            api.get<FichaDocumento[]>('/fichas-registro/', { params }),
            api.get<FichaOrdemServico[]>('/ordens-servico/', { params }),
        ]);
        const funcao = funcoes.data.find((item) => item.id === colaborador.data.funcao_id);
        return {
            colaborador: colaborador.data,
            setor: setores.data.find((setor) => setor.id === colaborador.data.setor_id)?.nome ?? 'Setor não encontrado',
            funcao: funcao?.nome ?? 'Função não encontrada',
            treinamentosObrigatorios: funcao?.treinamentos_obrigatorios ?? [],
            asos: asos.data,
            treinamentos: treinamentos.data,
            entregas: entregas.data,
            documentos: documentos.data,
            ordensServico: ordensServico.data,
        };
    },

    importarDocumento: async (arquivo: File): Promise<ColaboradorImportacaoDocumento> => {
        const dados = new FormData();
        dados.append('arquivo', arquivo);
        const response = await api.post('/colaboradores/importar-documento', dados, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    listarTodos: async(): Promise<Colaborador[]> => {
        const response = await api.get('/colaboradores/');
        return response.data;
    },

    buscarPorId: async(id: number): Promise<Colaborador> => {
        const response = await api.get(`/colaboradores/${id}/`);
        return response.data;
    },

    criar: async (dados: ColaboradorCreate): Promise<Colaborador> => {
        const response = await api.post('/colaboradores/', dados);
        return response.data;
    },

    atualizar: async (id: number, dados: ColaboradorCreate): Promise<Colaborador> => {
        const response = await api.put(`/colaboradores/${id}/`, dados);
        return response.data;
    },

    deletar: async (id: number): Promise<void> => {
        await api.delete(`/colaboradores/${id}/`);
    },
};
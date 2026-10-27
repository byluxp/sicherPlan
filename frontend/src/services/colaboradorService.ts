import {api} from './api'

export interface Colaborador {
    id: number;
    nome: string;
    cpf: string;
    data_nascimento: string | null;
    data_admissao: string;
    data_demissao: string | null;
    setor_id: number;
    funcao_id: number;
    ativo: boolean;
    criado_em: string | null;
    atualizado_em: string | null;
}

export interface ColaboradorCreate {
    nome: string;
    cpf: string;
    data_nascimento: string | null;
    data_admissao: string;
    data_demissao: string | null;
    setor_id: number;
    funcao_id: number;
    ativo: boolean;
}

// Dados lidos do documento de identificação pelo backend, para conferência antes de salvar
export interface ColaboradorImportacaoDocumento {
    tipo_documento: string;
    nome: string | null;
    cpf: string | null;
    data_nascimento: string | null;
    campos_nao_encontrados: string[];
    colaborador_existente: Colaborador | null;
}

export const colaboradorService = {
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
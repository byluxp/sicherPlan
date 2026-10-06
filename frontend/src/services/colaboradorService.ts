import {api} from './api'

export interface Colaborador {
    id: number;
    nome: string;
    cpf: string;
    data_nascimento: Date | null;
    data_admissao: Date | null;
    data_demissao: Date | null;
    setor_id: number;
    funcao_id: number;
    ativo: boolean;
    criado_em: Date | null;
    atualizado_em: Date | null;
}

export interface ColaboradorCreate {
    nome: string;
    cpf: string;
    data_nascimento: Date | null;
    data_admissao: Date | null;
    data_demissao: Date | null;
    setor_id: number;
    funcao_id: number;
    ativo: boolean;
}

export const colaboradorService = {
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
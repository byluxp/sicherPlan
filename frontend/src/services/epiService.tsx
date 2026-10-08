import {api} from './api'

export interface Epi {
    id: number;
    nome: string;
    descricao: string | null;
    categoria_id: number;
    criado_em: string | null;
    atualizado_em: string | null;
}

export interface EpiCreate {
    nome: string;
    descricao: string | null;
    categoria_id: number;
}

export const epiService = {
    listarTodos: async(): Promise<Epi[]> => {
        const response = await api.get('/epis/');
        return response.data;
    },

    buscarPorId: async(id: number): Promise<Epi> => {
        const response = await api.get(`/epis/${id}/`);
        return response.data;
    },

    criar: async (dados: EpiCreate): Promise<Epi> => {
        const response = await api.post('/epis/', dados);
        return response.data;
    },

    atualizar: async (id: number, dados: EpiCreate): Promise<Epi> => {
        const response = await api.put(`/epis/${id}/`, dados);
        return response.data;
    },

    deletar: async (id: number): Promise<void> => {
        await api.delete(`/epis/${id}/`);
    },
};  
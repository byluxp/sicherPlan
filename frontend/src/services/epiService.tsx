import { api } from './api';

export interface Epi {
    nome: string;
    grupo_protecao: string;
    ca_numero: string;
    data_validade_ca: string;
    durabilidade_dias: number;
    ativo: boolean;
    url_pdf_ca: string;
}


export interface EpiCreate {
    nome: string;
    grupo_protecao: string;
    ca_numero: string;
    data_validade_ca: string;
    durabilidade_dias: number;
    ativo: boolean;
    url_pdf_ca: string;

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

export const grupoProtecaoOptions = [
    { value: 'Proteção da cabeça', label: 'Proteção da cabeça' },
    { value: 'Proteção auditiva', label: 'Proteção auditiva' },
    { value: 'Proteção ocular e facial', label: 'Proteção ocular e facial' },
    { value: 'Proteção respiratória', label: 'Proteção respiratória' },
    { value: 'Proteção das mãos e braços', label: 'Proteção das mãos e braços' },
    { value: 'Proteção do tronco', label: 'Proteção do tronco' },
    { value: 'Proteção dos pés e pernas', label: 'Proteção dos pés e pernas' },
    { value: 'Proteção contra quedas', label: 'Proteção contra quedas' },
];
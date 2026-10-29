import { api } from './api'

export const TIPOS_ASO = ['Admissional', 'Periódico', 'Retorno ao trabalho', 'Mudança de risco ocupacional', 'Demissional'] as const

export interface AsoExame {
    nome: string;
    data: string | null;
}

export interface Aso {
    id: number;
    colaborador_id: number;
    tipo: string;
    data_exame: string | null;
    // data de liberação do ASO
    data_emissao: string;
    // null no demissional
    data_vencimento: string | null;
    exames: AsoExame[];
    resultado: 'Apto' | 'Inapto' | null;
    // null = o ASO não fala de trabalho em altura
    apto_trabalho_altura: boolean | null;
    url_documento: string | null;
    observacao: string | null;
}

export type AsoCreate = Omit<Aso, 'id'>

export interface AsoImportacaoDocumento {
    tipo: string | null;
    nome: string | null;
    cpf: string | null;
    data_exame: string | null;
    data_emissao: string | null;
    data_vencimento: string | null;
    exames: AsoExame[];
    resultado: 'Apto' | 'Inapto' | null;
    apto_trabalho_altura: boolean | null;
    campos_nao_encontrados: string[];
    metodo_leitura: 'ia' | 'ocr';
    avisos: string[];
}

export const asoService = {
    listarPorColaborador: async (colaboradorId: number): Promise<Aso[]> => {
        const response = await api.get('/asos/', { params: { colaborador_id: colaboradorId } });
        return response.data;
    },

    criar: async (dados: AsoCreate): Promise<Aso> => {
        const response = await api.post('/asos/', dados);
        return response.data;
    },

    atualizar: async (id: number, dados: AsoCreate): Promise<Aso> => {
        const response = await api.put(`/asos/${id}`, dados);
        return response.data;
    },

    excluir: async (id: number): Promise<void> => {
        await api.delete(`/asos/${id}`);
    },

    // lê o PDF do ASO e devolve os campos para conferência; não salva
    importarDocumento: async (colaboradorId: number, arquivo: File): Promise<AsoImportacaoDocumento> => {
        const dados = new FormData();
        dados.append('colaborador_id', String(colaboradorId));
        dados.append('arquivo', arquivo);
        const response = await api.post('/asos/importar-documento', dados, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
}

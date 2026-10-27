import axios from 'axios'
import { api } from './api'

export interface Setor {
	id: number

	nome: string

	descricao: string | null

	ativo: boolean

	criado_em: string
}

export interface SetorCreate {
	nome: string

	descricao: string | null

	ativo: boolean
}

export interface TreinamentoObrigatorio {
	id: number

	nome: string

	nr_codigo: string | null

	validade_meses: number | null
}

export interface Funcao {
	id: number

	nome: string

	setor_id: number

	descricao: string | null

	ativo: boolean

	criado_em: string

	treinamentos_obrigatorios: TreinamentoObrigatorio[]
}

export interface FuncaoCreate {
	nome: string

	setor_id: number

	descricao: string | null

	ativo: boolean

	// códigos de NR (ex.: "NR-35") ou nomes de outros treinamentos
	treinamentos_obrigatorios: string[]
}

// NRs oferecidas como opção no cadastro de função
export const nrsTreinamentoObrigatorio = ['NR-06', 'NR-10', 'NR-11', 'NR-12', 'NR-18', 'NR-33', 'NR-35']

export function mensagemErroApi(error: unknown, fallback: string): string {
	if (axios.isAxiosError<{ detail?: unknown }>(error)) {
		const detail = error.response?.data?.detail
		if (typeof detail === 'string') return detail
	}

	return fallback
}

export const funcaosetorService = {
	listarSetores: async (): Promise<Setor[]> => {
		const response = await api.get('/setores/')
		return response.data
	},

	criarSetor: async (dados: SetorCreate): Promise<Setor> => {
		const response = await api.post('/setores/', dados)
		return response.data
	},

	atualizarSetor: async (id: number, dados: SetorCreate): Promise<Setor> => {
		const response = await api.put(`/setores/${id}`, dados)
		return response.data
	},

	listarFuncoes: async (): Promise<Funcao[]> => {
		const response = await api.get('/funcoes/')
		return response.data
	},

	criarFuncao: async (dados: FuncaoCreate): Promise<Funcao> => {
		const response = await api.post('/funcoes/', dados)
		return response.data
	},

	atualizarFuncao: async (id: number, dados: FuncaoCreate): Promise<Funcao> => {
		const response = await api.put(`/funcoes/${id}`, dados)
		return response.data
	},
}
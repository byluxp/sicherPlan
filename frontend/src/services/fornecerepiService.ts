import { api } from './api'

export interface SupplyEmployee {
	id: number
	nome: string
	cpf: string
	funcao_id: number
	funcao: string
	setor: string
}

export interface SupplyEquipment {
	id: number
	nome: string
	grupo_protecao: string
	ca_numero: string
	data_validade_ca: string
	durabilidade_dias: number | null
}

export interface SupplyDelivery {
	id: number
	colaborador_id: number
	epi_id: number
	quantidade: number
	data_entrega: string
	assinado: boolean
	observacao: string | null
	criado_em: string
}

interface EmployeeRecord {
	id: number
	nome: string
	cpf: string
	funcao_id: number
	setor_id: number
}

interface NamedRecord {
	id: number
	nome: string
}

interface FunctionEquipmentRecord {
	funcao_id: number
	epi_id: number
}

export interface SupplyData {
	colaboradores: SupplyEmployee[]
	epis: SupplyEquipment[]
}

export interface SupplyDeliveryInput {
	colaborador_id: number
	epi_id: number
	quantidade: number
	data_entrega: string
}

export const fornecerepiService = {
	listarDados: async (): Promise<SupplyData> => {
		const [employeesResponse, equipmentResponse, functionsResponse, sectorsResponse] = await Promise.all([
			api.get<EmployeeRecord[]>('/colaboradores/'),
			api.get<SupplyEquipment[]>('/epis/'),
			api.get<NamedRecord[]>('/funcoes/'),
			api.get<NamedRecord[]>('/setores/'),
		])
		const functionNames = new Map(functionsResponse.data.map((item) => [item.id, item.nome]))
		const sectorNames = new Map(sectorsResponse.data.map((item) => [item.id, item.nome]))

		return {
			colaboradores: employeesResponse.data.map((employee) => ({
				id: employee.id,
				nome: employee.nome,
				cpf: employee.cpf,
				funcao_id: employee.funcao_id,
				funcao: functionNames.get(employee.funcao_id) ?? 'Função não encontrada',
				setor: sectorNames.get(employee.setor_id) ?? 'Setor não encontrado',
			})),
			epis: equipmentResponse.data,
		}
	},

	listarEntregas: async (colaboradorId: number): Promise<SupplyDelivery[]> => {
		const response = await api.get<SupplyDelivery[]>('/entregas-epi/', {
			params: { colaborador_id: colaboradorId },
		})
		return response.data
	},

	listarEpisObrigatorios: async (funcaoId: number): Promise<number[]> => {
		const response = await api.get<FunctionEquipmentRecord[]>('/funcao-epis/', {
			params: { funcao_id: funcaoId },
		})
		return response.data.map((item) => item.epi_id)
	},

	registrarEntrega: async (dados: SupplyDeliveryInput): Promise<SupplyDelivery> => {
		const response = await api.post<SupplyDelivery>('/entregas-epi/', dados)
		return response.data
	},
}
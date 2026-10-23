import { api } from './api'

export interface CertificateEmployee {
	id: number
	nome: string
	cpf: string
	funcao_id: number
	setor_id: number
	ativo: boolean
	funcao: string
	setor: string
}

export interface CertificateType {
	id: number
	nome: string
	nr_codigo: string | null
	carga_horaria: number | null
	validade_meses: number | null
	descricao: string | null
}

export interface EmployeeCertificate {
	id: number
	colaborador_id: number
	certificado_id: number
	data_conclusao: string
	data_vencimento: string | null
	url_certificado: string | null
	certificado: CertificateType | null
	treinamento_id: number | null
	tipo: TrainingKind | null
}

export type TrainingKind = 'inicial' | 'reciclagem'

interface TrainingHistoryRecord {
	id: number
	colaborador_certificado_id: number | null
	tipo: TrainingKind
}

export interface CertificatePageData {
	colaboradores: CertificateEmployee[]
	certificados: CertificateType[]
	registros: EmployeeCertificate[]
}

export type NrCodigo = 'NR-06' | 'NR-12' | 'NR-18' | 'NR-35'

export interface CertificateGenerationInput {
	colaborador_id: number
	nr_codigo: NrCodigo
	data_conclusao: string
}

interface CollaboratorRecord {
	id: number
	nome: string
	cpf: string
	funcao_id: number
	setor_id: number
	ativo: boolean
}

interface NamedRecord {
	id: number
	nome: string
}

interface EmployeeCertificateRecord {
	id: number
	colaborador_id: number
	certificado_id: number
	data_conclusao: string
	data_vencimento: string | null
	url_certificado: string | null
}

export const gerarcertificadoService = {
	listarDados: async (): Promise<CertificatePageData> => {
		const [employeesResponse, certificatesResponse, employeeCertificatesResponse, functionsResponse, sectorsResponse, trainingsResponse] = await Promise.all([
			api.get<CollaboratorRecord[]>('/colaboradores/'),
			api.get<CertificateType[]>('/certificados/'),
			api.get<EmployeeCertificateRecord[]>('/colaborador-certificados/'),
			api.get<NamedRecord[]>('/funcoes/'),
			api.get<NamedRecord[]>('/setores/'),
			api.get<TrainingHistoryRecord[]>('/treinamentos/'),
		])

		const functionNames = new Map(functionsResponse.data.map((item) => [item.id, item.nome]))
		const sectorNames = new Map(sectorsResponse.data.map((item) => [item.id, item.nome]))
		const certificatesById = new Map(certificatesResponse.data.map((item) => [item.id, item]))
		const trainingsByRecord = new Map(trainingsResponse.data
			.filter((item) => item.colaborador_certificado_id !== null)
			.map((item) => [item.colaborador_certificado_id, item]))

		return {
			colaboradores: employeesResponse.data
				.filter((employee) => employee.ativo)
				.map((employee) => ({
					...employee,
					funcao: functionNames.get(employee.funcao_id) ?? 'Função não encontrada',
					setor: sectorNames.get(employee.setor_id) ?? 'Setor não encontrado',
				})),
			certificados: certificatesResponse.data,
			registros: employeeCertificatesResponse.data.map((record) => ({
				...record,
				certificado: certificatesById.get(record.certificado_id) ?? null,
				treinamento_id: trainingsByRecord.get(record.id)?.id ?? null,
				tipo: trainingsByRecord.get(record.id)?.tipo ?? null,
			})),
		}
	},

	gerarCertificado: async (dados: CertificateGenerationInput): Promise<EmployeeCertificateRecord & { treinamento_id: number }> => {
		const response = await api.post<EmployeeCertificateRecord & { treinamento_id: number }>('/colaborador-certificados/gerar', dados)
		return response.data
	},

	baixarCertificado: async (registroId: number, nomeArquivo: string): Promise<void> => {
		const response = await api.get<Blob>(`/colaborador-certificados/${registroId}/documento`, { responseType: 'blob' })
		const url = URL.createObjectURL(response.data)
		const link = document.createElement('a')
		link.href = url
		link.download = nomeArquivo
		link.click()
		URL.revokeObjectURL(url)
	},
}
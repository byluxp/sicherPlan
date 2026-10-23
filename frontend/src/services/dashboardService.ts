import { api } from './api'

type RecordStatus = 'valid' | 'expiring' | 'expired'

export interface DashboardMetric {
	label: string
	value: number
	status: 'success' | 'warning' | 'danger'
}

export interface DashboardPendingItem {
	id: string
	employeeId: number | null
	employee: string
	role: string
	item: string
	dueDate: string
	status: string
	variant: 'warning' | 'danger'
	kind: 'aso' | 'training' | 'epi'
}

export interface DashboardData {
	activeCollaborators: number
	activeSectors: number
	trainingMetrics: DashboardMetric[]
	asoMetrics: DashboardMetric[]
	epiMetrics: DashboardMetric[]
	pendingItems: DashboardPendingItem[]
	pendingCollaborators: number
	pendingEquipment: number
	updatedAt: string
}

interface CollaboratorRecord {
	id: number
	nome: string
	funcao_id: number
	ativo: boolean
}

interface SectorRecord {
	id: number
	ativo: boolean
}

interface FunctionRecord {
	id: number
	nome: string
}

interface EpiRecord {
	id: number
	nome: string
	grupo_protecao: string
	ca_numero: string
	data_validade_ca: string
	ativo: boolean
}

interface AsoRecord {
	id: number
	colaborador_id: number
	tipo: string
	data_vencimento: string
}

interface EmployeeCertificateRecord {
	id: number
	colaborador_id: number
	certificado_id: number
	data_conclusao: string
	data_vencimento: string | null
}

interface CertificateRecord {
	id: number
	nome: string
	nr_codigo: string | null
}

const daysInMilliseconds = 24 * 60 * 60 * 1000
const updateIntervalMilliseconds = 30_000

function calendarDay(value: string): number | null {
	const match = value.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
	if (!match) return null
	return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

function statusForDate(value: string): RecordStatus | null {
	const dueDate = calendarDay(value)
	if (dueDate === null) return null
	const today = new Date()
	const todayCalendarDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
	const daysUntilDue = Math.floor((dueDate - todayCalendarDay) / daysInMilliseconds)
	if (daysUntilDue < 0) return 'expired'
	if (daysUntilDue <= 30) return 'expiring'
	return 'valid'
}

function emptyCounts() {
	return { valid: 0, expiring: 0, expired: 0 }
}

function metricsFor(
	counts: ReturnType<typeof emptyCounts>,
	labels: { valid: string; expiring: string; expired: string },
): DashboardMetric[] {
	return [
		{ label: labels.valid, value: counts.valid, status: 'success' },
		{ label: labels.expiring, value: counts.expiring, status: 'warning' },
		{ label: labels.expired, value: counts.expired, status: 'danger' },
	]
}

export async function carregarDashboard(): Promise<DashboardData> {
	const [collaboratorsResponse, sectorsResponse, functionsResponse, episResponse, asosResponse, employeeCertificatesResponse, certificatesResponse] = await Promise.all([
		api.get<CollaboratorRecord[]>('/colaboradores/'),
		api.get<SectorRecord[]>('/setores/'),
		api.get<FunctionRecord[]>('/funcoes/'),
		api.get<EpiRecord[]>('/epis/'),
		api.get<AsoRecord[]>('/asos/'),
		api.get<EmployeeCertificateRecord[]>('/colaborador-certificados/'),
		api.get<CertificateRecord[]>('/certificados/'),
	])

	const collaborators = collaboratorsResponse.data.filter((item) => item.ativo)
	const collaboratorById = new Map(collaborators.map((item) => [item.id, item]))
	const functionNameById = new Map(functionsResponse.data.map((item) => [item.id, item.nome]))
	const certificateById = new Map(certificatesResponse.data.map((item) => [item.id, item]))
	const activeEpis = episResponse.data.filter((item) => item.ativo)
	const trainingCounts = emptyCounts()
	const asoCounts = emptyCounts()
	const epiCounts = emptyCounts()
	const pendingItems: DashboardPendingItem[] = []

	function addPendingItem(item: DashboardPendingItem) {
		pendingItems.push(item)
	}

	for (const aso of asosResponse.data) {
		const collaborator = collaboratorById.get(aso.colaborador_id)
		if (!collaborator) continue
		const status = statusForDate(aso.data_vencimento)
		if (!status) continue
		asoCounts[status] += 1
		if (status !== 'valid') {
			addPendingItem({
				id: `aso-${aso.id}`,
				employeeId: collaborator.id,
				employee: collaborator.nome,
				role: functionNameById.get(collaborator.funcao_id) ?? 'Função não encontrada',
				item: `ASO • ${aso.tipo}`,
				dueDate: aso.data_vencimento,
				status: status === 'expired' ? 'ASO vencido' : 'ASO a vencer',
				variant: status === 'expired' ? 'danger' : 'warning',
				kind: 'aso',
			})
		}
	}

	// após uma reciclagem, só o certificado mais recente de cada NR conta para o colaborador
	const latestCertificates = new Map<string, EmployeeCertificateRecord>()
	for (const item of employeeCertificatesResponse.data) {
		const key = `${item.colaborador_id}-${item.certificado_id}`
		const existing = latestCertificates.get(key)
		if (!existing || item.data_conclusao > existing.data_conclusao) latestCertificates.set(key, item)
	}

	for (const item of latestCertificates.values()) {
		const collaborator = collaboratorById.get(item.colaborador_id)
		if (!collaborator) continue
		if (!item.data_vencimento) {
			trainingCounts.valid += 1
			continue
		}
		const status = statusForDate(item.data_vencimento)
		if (!status) continue
		trainingCounts[status] += 1
		if (status !== 'valid') {
			const certificate = certificateById.get(item.certificado_id)
			const certificateName = certificate
				? `${certificate.nr_codigo ? `${certificate.nr_codigo} • ` : ''}${certificate.nome}`
				: 'Certificado'
			addPendingItem({
				id: `training-${item.id}`,
				employeeId: collaborator.id,
				employee: collaborator.nome,
				role: functionNameById.get(collaborator.funcao_id) ?? 'Função não encontrada',
				item: certificateName,
				dueDate: item.data_vencimento,
				status: status === 'expired' ? 'Treinamento vencido' : 'Treinamento a vencer',
				variant: status === 'expired' ? 'danger' : 'warning',
				kind: 'training',
			})
		}
	}

	for (const epi of activeEpis) {
		const status = statusForDate(epi.data_validade_ca)
		if (!status) continue
		epiCounts[status] += 1
		if (status !== 'valid') {
			addPendingItem({
				id: `epi-${epi.id}`,
				employeeId: null,
				employee: 'Estoque de EPIs',
				role: epi.grupo_protecao,
				item: `CA • ${epi.nome} (${epi.ca_numero})`,
				dueDate: epi.data_validade_ca,
				status: status === 'expired' ? 'CA vencido' : 'CA a vencer',
				variant: status === 'expired' ? 'danger' : 'warning',
				kind: 'epi',
			})
		}
	}

	pendingItems.sort((left, right) => (calendarDay(left.dueDate) ?? 0) - (calendarDay(right.dueDate) ?? 0))

	return {
		activeCollaborators: collaborators.length,
		activeSectors: sectorsResponse.data.filter((item) => item.ativo).length,
		trainingMetrics: metricsFor(trainingCounts, { valid: 'Em dia', expiring: 'A vencer', expired: 'Vencidos' }),
		asoMetrics: metricsFor(asoCounts, { valid: 'Válidos', expiring: 'A vencer', expired: 'Vencidos' }),
		epiMetrics: metricsFor(epiCounts, { valid: 'CAs válidos', expiring: 'CA a vencer', expired: 'CA vencido' }),
		pendingItems,
		pendingCollaborators: new Set(pendingItems.map((item) => item.employeeId).filter((id): id is number => id !== null)).size,
		pendingEquipment: pendingItems.filter((item) => item.kind === 'epi').length,
		updatedAt: new Date().toISOString(),
	}
}

export { updateIntervalMilliseconds }
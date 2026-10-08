import { useEffect, useState, type FormEvent } from 'react'
import {
	CalendarDays,
	Check,
	CircleAlert,
	Clock3,
	CornerDownRight,
	Ear,
	Footprints,
	Glasses,
	Hand,
	HardHat,
	Info,
	Plus,
	Save,
	Search,
	Shield,
	type LucideIcon,
} from 'lucide-react'
import AppHeader from '../../components/header/app-header'
import Avatar from '../../components/ui/avatar'
import Badge, { type BadgeVariant } from '../../components/ui/badge'
import Button from '../../components/ui/button'
import Card, {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '../../components/ui/card'
import Input from '../../components/ui/input'
import Select from '../../components/ui/select'

type Employee = {
	id: string
	name: string
	cpf: string
	role: string
	sector: string
}

type Equipment = {
	id: number
	name: string
	type: string
	ca: string
	expiresOn: string
	icon: LucideIcon
}

type Delivery = {
	employeeId: string
	equipmentId: number
	date: string
	quantity: number
}

type DeliveryDraft = Omit<Delivery, 'employeeId'>



const employees: Employee[] = [
	{ id: '000.000.001-00', name: 'Carlos Eduardo Silva', cpf: '000.000.001-00', role: 'Operador de máquinas', sector: 'Produção' },
	{ id: '000.000.002-00', name: 'Juliana Costa Ribeiro', cpf: '000.000.002-00', role: 'Técnica de manutenção', sector: 'Manutenção' },
	{ id: '000.000.003-00', name: 'Rafael Oliveira Santos', cpf: '000.000.003-00', role: 'Almoxarife', sector: 'Logística' },
	{ id: '000.000.004-00', name: 'Marcos Paulo Ferreira', cpf: '000.000.004-00', role: 'Soldador', sector: 'Produção' },
	{ id: '000.000.005-00', name: 'Ana Beatriz Lima', cpf: '000.000.005-00', role: 'Assistente administrativa', sector: 'Administrativo' },
	{ id: '000.000.006-00', name: 'Fernanda Alves Rocha', cpf: '000.000.006-00', role: 'Operadora de máquinas', sector: 'Produção' },
	{ id: '000.000.007-00', name: 'Pedro Henrique Souza', cpf: '000.000.007-00', role: 'Técnico de manutenção', sector: 'Manutenção' },
	{ id: '000.000.008-00', name: 'Lucas Mendes Pereira', cpf: '000.000.008-00', role: 'Almoxarife', sector: 'Logística' },
]

const equipment: Equipment[] = [
	{ id: 1, name: 'Capacete de segurança', type: 'Proteção da cabeça', ca: '12345', expiresOn: '2028-08-15', icon: HardHat },
	{ id: 2, name: 'Óculos de proteção', type: 'Proteção dos olhos', ca: '23456', expiresOn: '2028-06-20', icon: Glasses },
	{ id: 3, name: 'Protetor auricular', type: 'Proteção auditiva', ca: '34567', expiresOn: '2026-10-18', icon: Ear },
	{ id: 4, name: 'Luva de segurança', type: 'Proteção das mãos', ca: '45678', expiresOn: '2026-09-25', icon: Hand },
	{ id: 5, name: 'Botina de segurança', type: 'Proteção dos pés', ca: '56789', expiresOn: '2027-12-10', icon: Footprints },
	{ id: 6, name: 'Respirador PFF2', type: 'Proteção respiratória', ca: '67890', expiresOn: '2026-10-28', icon: Shield },
]

const requirementsByRole: Record<string, number[]> = {
	'Operador de máquinas': [1, 2, 3, 5],
	'Operadora de máquinas': [1, 2, 3, 5],
	'Técnica de manutenção': [1, 2, 3, 4],
	'Técnico de manutenção': [1, 2, 3, 4],
	Almoxarife: [1, 2, 3, 5],
	Soldador: [1, 2, 3, 4, 5, 6],
	'Assistente administrativa': [1, 2],
}

const initialDeliveries: Delivery[] = [
	{ employeeId: employees[0].id, equipmentId: 1, date: '2026-10-01', quantity: 1 },
	{ employeeId: employees[0].id, equipmentId: 2, date: '2026-10-01', quantity: 1 },
	{ employeeId: employees[0].id, equipmentId: 5, date: '2026-10-01', quantity: 1 },
]

function initials(name: string) {
	return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function formatDate(date: string) {
	return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${date}T00:00:00.000Z`))
}

function daysUntil(date: string) {
	return Math.ceil((new Date(`${date}T00:00:00.000Z`).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
}

function caWarning(equipmentItem: Equipment) {
	const days = daysUntil(equipmentItem.expiresOn)
	if (days < 0) return { text: `O CA deste EPI venceu em ${formatDate(equipmentItem.expiresOn)}. Substitua o equipamento.`, variant: 'danger' as const }
	if (days <= 30) return { text: `O CA deste EPI vence em ${formatDate(equipmentItem.expiresOn)}. Programe a renovação do equipamento.`, variant: 'warning' as const }
	return null
}

function getDeliveryStatus(item: Equipment, isDelivered: boolean) {
	const expired = daysUntil(item.expiresOn) < 0
	if (isDelivered && !expired) return { label: 'Conforme', variant: 'success' as BadgeVariant, icon: Check }
	if (expired) return { label: 'Não conforme', variant: 'danger' as BadgeVariant, icon: CircleAlert }
	return { label: 'Não conforme', variant: 'danger' as BadgeVariant, icon: CircleAlert }
}

export default function EpiSupplyPage() {
	const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0].id)
	const [employeeSearch, setEmployeeSearch] = useState(employees[0].name)
	const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(3)
	const [equipmentSearch, setEquipmentSearch] = useState(equipment[2].name)
	const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10))
	const [quantity, setQuantity] = useState('1')
	const [deliveries, setDeliveries] = useState(initialDeliveries)
	const [stagedDeliveries, setStagedDeliveries] = useState<DeliveryDraft[]>([])
	const [confirmation, setConfirmation] = useState('')

	useEffect(() => {
		document.title = 'Fornecimento de EPIs | sicherPlan'
	}, [])

	const selectedEmployee = employees.find(({ id }) => id === selectedEmployeeId) ?? employees[0]
	const selectedEquipment = equipment.find(({ id }) => id === selectedEquipmentId) ?? null
	const employeeMatches = employeeSearch.trim().toLocaleLowerCase('pt-BR') === selectedEmployee.name.toLocaleLowerCase('pt-BR')
		? []
		: employees.filter(({ name, cpf }) => `${name} ${cpf}`.toLocaleLowerCase('pt-BR').includes(employeeSearch.trim().toLocaleLowerCase('pt-BR')))
	const equipmentMatches = equipmentSearch.trim().toLocaleLowerCase('pt-BR') === selectedEquipment?.name.toLocaleLowerCase('pt-BR')
		? []
		: equipment.filter(({ name, type, ca }) => `${name} ${type} ${ca}`.toLocaleLowerCase('pt-BR').includes(equipmentSearch.trim().toLocaleLowerCase('pt-BR')))
	const requiredItems = (requirementsByRole[selectedEmployee.role] ?? []).map((id) => equipment.find((item) => item.id === id)).filter((item): item is Equipment => Boolean(item))
	const providedEquipmentIds = new Set(deliveries.filter((delivery) => delivery.employeeId === selectedEmployeeId).map((delivery) => delivery.equipmentId))
	const fulfilledCount = requiredItems.filter((item) => providedEquipmentIds.has(item.id) && daysUntil(item.expiresOn) >= 0).length
	const missingCount = requiredItems.length - fulfilledCount
	const completion = requiredItems.length === 0 ? 0 : Math.round((fulfilledCount / requiredItems.length) * 100)
	const warning = selectedEquipment ? caWarning(selectedEquipment) : null

	function selectEmployee(employee: Employee) {
		setSelectedEmployeeId(employee.id)
		setEmployeeSearch(employee.name)
		setStagedDeliveries([])
		setConfirmation('')
		const requiredIds = requirementsByRole[employee.role] ?? []
		const deliveredIds = deliveries.filter((delivery) => delivery.employeeId === employee.id).map((delivery) => delivery.equipmentId)
		const firstMissing = requiredIds.find((id) => !deliveredIds.includes(id))
		const nextEquipment = equipment.find((item) => item.id === firstMissing) ?? equipment[0]
		setSelectedEquipmentId(nextEquipment.id)
		setEquipmentSearch(nextEquipment.name)
	}

	function selectEquipment(item: Equipment) {
		setSelectedEquipmentId(item.id)
		setEquipmentSearch(item.name)
		setConfirmation('')
	}

	function currentDraft(): DeliveryDraft | null {
		if (!selectedEquipmentId || !deliveryDate) return null
		return { equipmentId: selectedEquipmentId, date: deliveryDate, quantity: Number(quantity) }
	}

	function handleAddMore() {
		const draft = currentDraft()
		if (!draft) return
		setStagedDeliveries((current) => [...current, draft])
		const assignedIds = new Set([
			...Array.from(providedEquipmentIds),
			...stagedDeliveries.map((item) => item.equipmentId),
			draft.equipmentId,
		])
		const nextEquipment = requiredItems.find((item) => !assignedIds.has(item.id)) ?? equipment.find((item) => !assignedIds.has(item.id))
		setSelectedEquipmentId(nextEquipment?.id ?? null)
		setEquipmentSearch(nextEquipment?.name ?? '')
		setConfirmation(`${stagedDeliveries.length + 1} ${stagedDeliveries.length === 0 ? 'item preparado' : 'itens preparados'} para registro.`)
	}

	function handleSave(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const draft = currentDraft()
		const allDrafts = [...stagedDeliveries, ...(draft ? [draft] : [])]
		if (allDrafts.length === 0) return
		const registered = allDrafts.map((item) => ({ ...item, employeeId: selectedEmployeeId }))
		setDeliveries((current) => [...current, ...registered])
		setStagedDeliveries([])
		setConfirmation(`${registered.length} ${registered.length === 1 ? 'entrega registrada' : 'entregas registradas'} para ${selectedEmployee.name}.`)
	}

	return (
		<div className="min-h-screen bg-surface-page font-sans text-text-primary">
			<AppHeader activePage="epi" />
			<main className="mx-auto flex w-full max-w-[1536px] flex-col gap-7 px-4 pb-8 pt-6 sm:px-6 lg:px-8 xl:px-12">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<Shield aria-hidden="true" className="size-[22px] text-brand" />
						<span className="text-[17px] text-brand">sicherPlan</span>
						<span className="text-[11px] text-text-secondary">GESTÃO DE SST</span>
					</div>
					<p className="text-xs text-text-secondary">Napoli Engenharia</p>
				</div>

				<section className="flex flex-wrap items-center justify-between gap-4" aria-labelledby="supply-title">
					<div className="flex flex-col gap-2">
						<h1 id="supply-title" className="text-[26px] font-bold leading-tight text-brand-deep sm:text-[32px]">
							Fornecimento de EPIs
						</h1>
						<p className="text-sm leading-[1.45] text-text-secondary">
							Registre a entrega e confira os equipamentos obrigatórios de cada colaborador.
						</p>
					</div>
					<div className="inline-flex items-center gap-2 rounded-control bg-surface-muted p-3 text-xs text-brand-deep">
						<CalendarDays aria-hidden="true" className="size-[17px]" />
						<time dateTime={new Date().toISOString().slice(0, 10)}>{new Date().toLocaleDateString('pt-BR')}</time>
					</div>
				</section>

				<section aria-label="Entrega e conformidade" className="grid items-start gap-6 xl:grid-cols-[minmax(320px,460px)_minmax(0,1fr)]">
					<Card className="gap-6 p-5 sm:p-6">
						<CardHeader>
							<CardTitle>Registrar fornecimento</CardTitle>
							<CardDescription>Selecione o colaborador e o equipamento a entregar.</CardDescription>
						</CardHeader>

						<form className="flex w-full flex-col gap-5" onSubmit={handleSave}>
							<div className="flex flex-col gap-2">
								<label htmlFor="supply-employee" className="text-[13px] font-semibold text-text-primary">Colaborador</label>
								<Input
									id="supply-employee"
									value={employeeSearch}
									onChange={(event) => setEmployeeSearch(event.target.value)}
									placeholder="Buscar colaborador por nome ou CPF"
									startAdornment={<Search className="size-[18px] text-brand" />}
								/>
								{employeeMatches.length > 0 && (
									<div className="flex max-h-40 flex-col overflow-y-auto rounded-control border border-border bg-white p-1">
										{employeeMatches.map((employee) => (
											<button key={employee.id} type="button" onClick={() => selectEmployee(employee)} className="flex items-start gap-2 rounded-control p-2 text-left hover:bg-surface-muted">
												<CornerDownRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
												<span className="min-w-0 flex-1">
													<strong className="block text-xs font-semibold text-brand-deep">{employee.name}</strong>
													<span className="block text-[11px] text-text-secondary">{employee.cpf} • {employee.role} • {employee.sector}</span>
												</span>
												<Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
											</button>
										))}
									</div>
								)}
								{employeeMatches.length === 0 && (
									<div className="flex items-start gap-2 rounded-control border border-border bg-surface-success p-3">
										<CornerDownRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
										<span className="min-w-0 flex-1">
											<strong className="block text-xs font-semibold text-brand-deep">{selectedEmployee.name}</strong>
											<span className="block text-[11px] text-text-secondary">{selectedEmployee.cpf} • {selectedEmployee.role} • {selectedEmployee.sector}</span>
										</span>
										<Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
									</div>
								)}
							</div>

							<div className="flex flex-col gap-2">
								<label htmlFor="supply-equipment" className="text-[13px] font-semibold text-text-primary">EPI</label>
								<Input
									id="supply-equipment"
									value={equipmentSearch}
									onChange={(event) => setEquipmentSearch(event.target.value)}
									placeholder="Buscar pelo nome do EPI"
									startAdornment={<Search className="size-[18px] text-brand" />}
								/>
								{equipmentMatches.length > 0 && (
									<div className="flex max-h-40 flex-col overflow-y-auto rounded-control border border-border bg-white p-1">
										{equipmentMatches.map((item) => (
											<button key={item.id} type="button" onClick={() => selectEquipment(item)} className="flex items-start gap-2 rounded-control p-2 text-left hover:bg-surface-muted">
												<CornerDownRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
												<span className="min-w-0 flex-1">
													<strong className="block text-xs font-semibold text-brand-deep">{item.name} • CA {item.ca}</strong>
													<span className="block text-[11px] text-text-secondary">{item.type} • Validade do CA: {formatDate(item.expiresOn)}</span>
												</span>
												<Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
											</button>
										))}
									</div>
								)}
								{equipmentMatches.length === 0 && selectedEquipment && (
									<div className="flex items-start gap-2 rounded-control border border-border bg-surface-success p-3">
										<CornerDownRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
										<span className="min-w-0 flex-1">
											<strong className="block text-xs font-semibold text-brand-deep">{selectedEquipment.name} • CA {selectedEquipment.ca}</strong>
											<span className="block text-[11px] text-text-secondary">{selectedEquipment.type} • Validade do CA: {formatDate(selectedEquipment.expiresOn)}</span>
										</span>
										<Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
									</div>
								)}
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="flex flex-col gap-2">
									<label htmlFor="delivery-date" className="text-[13px] font-semibold text-text-primary">Data da entrega</label>
									<Input id="delivery-date" type="date" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} required />
								</div>
								<div className="flex flex-col gap-2">
									<label htmlFor="delivery-quantity" className="text-[13px] font-semibold text-text-primary">Quantidade</label>
									<Select id="delivery-quantity" value={quantity} onChange={(event) => setQuantity(event.target.value)}>
										{[1, 2, 3, 4, 5, 10].map((amount) => <option key={amount} value={amount}>{amount} {amount === 1 ? 'unidade' : 'unidades'}</option>)}
									</Select>
								</div>
							</div>

							{warning && selectedEquipment && (
								<div className={`flex items-start gap-2.5 rounded-control p-3 text-xs leading-[1.5] ${warning.variant === 'danger' ? 'bg-status-danger text-status-danger-text' : 'bg-status-warning text-status-warning-text'}`}>
									<Clock3 aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" />
									<p>{warning.text}</p>
								</div>
							)}

							<div className="border-t border-border pt-4">
								<div className="flex flex-wrap gap-2.5">
									<Button type="submit" icon={<Save className="size-[18px]" />}>Salvar</Button>
									<Button type="button" variant="secondary" icon={<Plus className="size-[18px]" />} onClick={handleAddMore}>Adicionar mais</Button>
								</div>
							</div>
							<p role="status" className="text-xs leading-[1.45] text-text-secondary">
								{confirmation || (stagedDeliveries.length > 0 ? `${stagedDeliveries.length} item(ns) preparado(s), ainda não registrado(s).` : 'Entrega preparada, ainda não registrada.')}
							</p>
						</form>
					</Card>

					<Card className="min-w-0 gap-6 p-5 sm:p-6">
						<CardHeader>
							<CardTitle>EPIs obrigatórios do colaborador</CardTitle>
							<CardDescription>Exigências da função • {selectedEmployee.role}</CardDescription>
						</CardHeader>

						<CardContent className="flex flex-col gap-5">
							<div className="flex flex-wrap items-center gap-3 rounded-control bg-surface-muted p-3.5 sm:p-[18px]">
								<Avatar size="lg" className="bg-surface-success">{initials(selectedEmployee.name)}</Avatar>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold text-brand-deep">{selectedEmployee.name}</p>
									<p className="text-xs text-text-secondary">CPF {selectedEmployee.cpf} • {selectedEmployee.sector}</p>
								</div>
								{missingCount > 0 && <Badge variant="danger" icon={<CircleAlert />}>{missingCount} {missingCount === 1 ? 'pendência' : 'pendências'}</Badge>}
							</div>

							<div>
								<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
									<p className="text-sm font-semibold text-brand-deep">{fulfilledCount} de {requiredItems.length} equipamentos fornecidos</p>
									<p className="text-xs text-text-secondary">{completion}% conforme</p>
								</div>
								<div
									role="progressbar"
									aria-label="Conformidade dos EPIs"
									aria-valuemin={0}
									aria-valuemax={100}
									aria-valuenow={completion}
									className="h-2 overflow-hidden rounded-full bg-surface-muted"
								>
									<div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${completion}%` }} />
								</div>
							</div>

							<div className="w-full divide-y divide-border">
								{requiredItems.map((item) => {
									const isDelivered = providedEquipmentIds.has(item.id)
									const latestDelivery = deliveries.filter((delivery) => delivery.employeeId === selectedEmployeeId && delivery.equipmentId === item.id).at(-1)
									const Icon = item.icon
									const status = getDeliveryStatus(item, isDelivered)
									const StatusIcon = status.icon
									return (
										<div key={item.id} className="flex min-w-0 items-center gap-3 py-4 first:pt-0 last:pb-0 sm:gap-3.5">
											<span className="inline-flex size-10 shrink-0 items-center justify-center rounded-control bg-surface-muted text-brand sm:size-11">
												<Icon aria-hidden="true" className="size-6" />
											</span>
											<div className="min-w-0 flex-1">
												<p className="text-[13px] font-semibold text-brand-deep">{item.name}</p>
												<p className="text-xs text-text-secondary">
													{latestDelivery ? `Fornecido em ${formatDate(latestDelivery.date)} • CA ${item.ca}` : 'Pendente • Nenhum fornecimento registrado'}
												</p>
											</div>
											<Badge variant={status.variant} icon={<StatusIcon />}>{status.label}</Badge>
										</div>
									)
								})}
							</div>

							<div className="flex items-start gap-2 border-t border-border pt-4 text-xs leading-[1.5] text-text-secondary">
								<Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
								<p>{missingCount > 0 ? `O ${requiredItems.find((item) => !providedEquipmentIds.has(item.id))?.name.toLocaleLowerCase('pt-BR')} permanece pendente até o registro da entrega.` : 'Todos os equipamentos obrigatórios foram fornecidos.'}</p>
							</div>
						</CardContent>
					</Card>
				</section>
			</main>
		</div>
	)
}

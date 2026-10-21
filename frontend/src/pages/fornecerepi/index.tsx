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
import {
	fornecerepiService,
	type SupplyDelivery,
	type SupplyEmployee,
	type SupplyEquipment,
} from '../../services/fornecerepiService'

type Employee = SupplyEmployee
type Equipment = SupplyEquipment & { icon: LucideIcon }
type Delivery = SupplyDelivery
type DeliveryDraft = { equipmentId: number; date: string; quantity: number }

function getEquipmentIcon(group: string): LucideIcon {
	const normalized = group.toLocaleLowerCase('pt-BR')
	if (normalized.includes('cabeça')) return HardHat
	if (normalized.includes('auditiva')) return Ear
	if (normalized.includes('ocular') || normalized.includes('olhos')) return Glasses
	if (normalized.includes('mãos')) return Hand
	if (normalized.includes('pés')) return Footprints
	return Shield
}

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
	const days = daysUntil(equipmentItem.data_validade_ca)
	if (days < 0) return { text: `O CA deste EPI venceu em ${formatDate(equipmentItem.data_validade_ca)}. Substitua o equipamento.`, variant: 'danger' as const }
	if (days <= 30) return { text: `O CA deste EPI vence em ${formatDate(equipmentItem.data_validade_ca)}. Programe a renovação do equipamento.`, variant: 'warning' as const }
	return null
}

function isDeliveryCurrent(item: Equipment, delivery?: Delivery) {
	if (!delivery || daysUntil(item.data_validade_ca) < 0) return false
	if (item.durabilidade_dias === null) return true
	const replacementDate = new Date(`${delivery.data_entrega}T00:00:00.000Z`)
	replacementDate.setUTCDate(replacementDate.getUTCDate() + item.durabilidade_dias)
	return replacementDate.toISOString().slice(0, 10) >= new Date().toISOString().slice(0, 10)
}

function getDeliveryStatus(item: Equipment, delivery?: Delivery) {
	if (daysUntil(item.data_validade_ca) < 0) return { label: 'CA vencido', variant: 'danger' as BadgeVariant, icon: CircleAlert }
	if (isDeliveryCurrent(item, delivery)) return { label: 'Fornecido', variant: 'success' as BadgeVariant, icon: Check }
	if (delivery && item.durabilidade_dias !== null) return { label: 'Reposição necessária', variant: 'warning' as BadgeVariant, icon: Clock3 }
	return { label: 'Não conforme', variant: 'danger' as BadgeVariant, icon: CircleAlert }
}

export default function EpiSupplyPage() {
	const [employees, setEmployees] = useState<Employee[]>([])
	const [equipment, setEquipment] = useState<Equipment[]>([])
	const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
	const [employeeSearch, setEmployeeSearch] = useState('')
	const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null)
	const [equipmentSearch, setEquipmentSearch] = useState('')
	const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10))
	const [quantity, setQuantity] = useState('1')
	const [deliveries, setDeliveries] = useState<Delivery[]>([])
	const [requiredEquipmentIds, setRequiredEquipmentIds] = useState<number[]>([])
	const [stagedDeliveries, setStagedDeliveries] = useState<DeliveryDraft[]>([])
	const [confirmation, setConfirmation] = useState('')
	const [loadError, setLoadError] = useState('')
	const [isLoading, setIsLoading] = useState(true)
	const [isLoadingDetails, setIsLoadingDetails] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [reloadKey, setReloadKey] = useState(0)

	useEffect(() => {
		document.title = 'Fornecimento de EPIs | sicherPlan'
	}, [])

	useEffect(() => {
		let active = true
		setIsLoading(true)
		setLoadError('')
		fornecerepiService.listarDados()
			.then((data) => {
				if (!active) return
				setEmployees(data.colaboradores)
				setEquipment(data.epis.map((item) => ({ ...item, icon: getEquipmentIcon(item.grupo_protecao) })))
				const employee = data.colaboradores.find(({ id }) => id === selectedEmployeeId) ?? data.colaboradores[0]
				setSelectedEmployeeId(employee?.id ?? null)
				setEmployeeSearch(employee?.nome ?? '')
			})
			.catch(() => {
				if (active) setLoadError('Não foi possível carregar colaboradores e EPIs. Verifique a conexão com a API.')
			})
			.finally(() => {
				if (active) setIsLoading(false)
			})
		return () => { active = false }
	}, [reloadKey])

	const selectedEmployee = employees.find(({ id }) => id === selectedEmployeeId)
	const selectedEquipment = equipment.find(({ id }) => id === selectedEquipmentId) ?? null
	useEffect(() => {
		if (!selectedEmployee) return
		let active = true
		setIsLoadingDetails(true)
		setLoadError('')
		Promise.all([
			fornecerepiService.listarEntregas(selectedEmployee.id),
			fornecerepiService.listarEpisObrigatorios(selectedEmployee.funcao_id),
		])
			.then(([employeeDeliveries, requiredIds]) => {
				if (!active) return
				setDeliveries(employeeDeliveries)
				setRequiredEquipmentIds(requiredIds)
			})
			.catch(() => {
				if (active) setLoadError('Não foi possível carregar entregas e EPIs obrigatórios deste colaborador.')
			})
			.finally(() => {
				if (active) setIsLoadingDetails(false)
			})
		return () => { active = false }
	}, [selectedEmployee])

	const employeeMatches = employeeSearch.trim().toLocaleLowerCase('pt-BR') === selectedEmployee?.nome.toLocaleLowerCase('pt-BR')
		? []
		: employees.filter(({ nome, cpf }) => `${nome} ${cpf}`.toLocaleLowerCase('pt-BR').includes(employeeSearch.trim().toLocaleLowerCase('pt-BR')))
	const equipmentMatches = equipmentSearch.trim().toLocaleLowerCase('pt-BR') === selectedEquipment?.nome.toLocaleLowerCase('pt-BR')
		? []
		: equipment.filter(({ nome, grupo_protecao, ca_numero }) => `${nome} ${grupo_protecao} ${ca_numero}`.toLocaleLowerCase('pt-BR').includes(equipmentSearch.trim().toLocaleLowerCase('pt-BR')))
	const requiredItems = requiredEquipmentIds.map((id) => equipment.find((item) => item.id === id)).filter((item): item is Equipment => Boolean(item))
	const latestDeliveries = new Map<number, Delivery>()
	for (const delivery of deliveries) {
		const existing = latestDeliveries.get(delivery.epi_id)
		if (!existing || delivery.data_entrega >= existing.data_entrega) latestDeliveries.set(delivery.epi_id, delivery)
	}
	const fulfilledCount = requiredItems.filter((item) => isDeliveryCurrent(item, latestDeliveries.get(item.id))).length
	const missingCount = requiredItems.length - fulfilledCount
	const outstandingItem = requiredItems.find((item) => !isDeliveryCurrent(item, latestDeliveries.get(item.id)))
	const completion = requiredItems.length === 0 ? 0 : Math.round((fulfilledCount / requiredItems.length) * 100)
	const warning = selectedEquipment ? caWarning(selectedEquipment) : null

	function selectEmployee(employee: Employee) {
		setSelectedEmployeeId(employee.id)
		setEmployeeSearch(employee.nome)
		setStagedDeliveries([])
		setDeliveries([])
		setRequiredEquipmentIds([])
		setConfirmation('')
		setSelectedEquipmentId(null)
		setEquipmentSearch('')
	}

	function selectEquipment(item: Equipment) {
		setSelectedEquipmentId(item.id)
		setEquipmentSearch(item.nome)
		setConfirmation('')
	}

	function currentDraft(): DeliveryDraft | null {
		if (
			!selectedEquipmentId ||
			!selectedEquipment ||
			equipmentSearch.trim().toLocaleLowerCase('pt-BR') !== selectedEquipment.nome.toLocaleLowerCase('pt-BR') ||
			!deliveryDate ||
			Number(quantity) < 1
		) return null
		return { equipmentId: selectedEquipmentId, date: deliveryDate, quantity: Number(quantity) }
	}

	function handleAddMore() {
		const draft = currentDraft()
		if (!draft) return
		setStagedDeliveries((current) => [...current, draft])
		const assignedIds = new Set([
			...Array.from(latestDeliveries.keys()),
			...stagedDeliveries.map((item) => item.equipmentId),
			draft.equipmentId,
		])
		const nextEquipment = requiredItems.find((item) => !assignedIds.has(item.id)) ?? equipment.find((item) => !assignedIds.has(item.id))
		setSelectedEquipmentId(nextEquipment?.id ?? null)
		setEquipmentSearch(nextEquipment?.nome ?? '')
		setConfirmation(`${stagedDeliveries.length + 1} ${stagedDeliveries.length === 0 ? 'item preparado' : 'itens preparados'} para registro.`)
	}

	async function handleSave(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!selectedEmployee || employeeSearch.trim().toLocaleLowerCase('pt-BR') !== selectedEmployee.nome.toLocaleLowerCase('pt-BR')) {
			setConfirmation('Selecione um colaborador cadastrado antes de salvar.')
			return
		}
		const draft = currentDraft()
		const allDrafts = [...stagedDeliveries, ...(draft ? [draft] : [])]
		if (allDrafts.length === 0) {
			setConfirmation('Selecione um EPI antes de salvar.')
			return
		}
		setIsSaving(true)
		setConfirmation('')
		let registeredCount = 0
		try {
			for (const item of allDrafts) {
				const registered = await fornecerepiService.registrarEntrega({
					colaborador_id: selectedEmployee.id,
					epi_id: item.equipmentId,
					quantidade: item.quantity,
					data_entrega: item.date,
				})
				setDeliveries((current) => [...current, registered])
				registeredCount += 1
			}
			setStagedDeliveries([])
			setSelectedEquipmentId(null)
			setEquipmentSearch('')
			setConfirmation(`${registeredCount} ${registeredCount === 1 ? 'entrega registrada' : 'entregas registradas'} para ${selectedEmployee.nome}.`)
		} catch {
			setStagedDeliveries(allDrafts.slice(registeredCount))
			setSelectedEquipmentId(null)
			setEquipmentSearch('')
			setConfirmation(`${registeredCount} entrega(s) registrada(s). Os itens restantes continuam preparados para nova tentativa.`)
		} finally {
			setIsSaving(false)
		}
	}

	if (isLoading || loadError || !selectedEmployee) {
		const message = loadError || (isLoading ? 'Carregando dados do banco...' : 'Nenhum colaborador ativo encontrado.')
		return (
			<div className="min-h-screen bg-surface-page font-sans text-text-primary">
				<AppHeader activePage="epi" />
				<main className="mx-auto flex w-full max-w-[1536px] flex-col gap-5 px-4 pb-8 pt-6 sm:px-6 lg:px-8 xl:px-12">
					<h1 className="text-[26px] font-bold leading-tight text-brand-deep">Fornecimento de EPIs</h1>
					<p role="status" className="text-sm text-text-secondary">{message}</p>
					{loadError && <Button type="button" icon={<Clock3 className="size-[18px]" />} onClick={() => setReloadKey((key) => key + 1)}>Tentar novamente</Button>}
				</main>
			</div>
		)
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
													<strong className="block text-xs font-semibold text-brand-deep">{employee.nome}</strong>
													<span className="block text-[11px] text-text-secondary">{employee.cpf} • {employee.funcao} • {employee.setor}</span>
												</span>
												<Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
											</button>
										))}
									</div>
								)}
								{employeeMatches.length === 0 && employeeSearch.trim().toLocaleLowerCase('pt-BR') === selectedEmployee.nome.toLocaleLowerCase('pt-BR') && (
									<div className="flex items-start gap-2 rounded-control border border-border bg-surface-success p-3">
										<CornerDownRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
										<span className="min-w-0 flex-1">
											<strong className="block text-xs font-semibold text-brand-deep">{selectedEmployee.nome}</strong>
											<span className="block text-[11px] text-text-secondary">{selectedEmployee.cpf} • {selectedEmployee.funcao} • {selectedEmployee.setor}</span>
										</span>
										<Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
									</div>
								)}
								{employeeMatches.length === 0 && employeeSearch.trim().toLocaleLowerCase('pt-BR') !== selectedEmployee.nome.toLocaleLowerCase('pt-BR') && employeeSearch.trim() && (
									<p className="text-xs text-text-secondary">Nenhum colaborador encontrado.</p>
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
													<strong className="block text-xs font-semibold text-brand-deep">{item.nome} • CA {item.ca_numero}</strong>
													<span className="block text-[11px] text-text-secondary">{item.grupo_protecao} • Validade do CA: {formatDate(item.data_validade_ca)}</span>
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
											<strong className="block text-xs font-semibold text-brand-deep">{selectedEquipment.nome} • CA {selectedEquipment.ca_numero}</strong>
												<span className="block text-[11px] text-text-secondary">{selectedEquipment.grupo_protecao} • Validade do CA: {formatDate(selectedEquipment.data_validade_ca)}</span>
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
									<Button type="submit" disabled={isSaving || isLoadingDetails} icon={<Save className="size-[18px]" />}>{isSaving ? 'Salvando...' : 'Salvar'}</Button>
									<Button type="button" variant="secondary" disabled={!selectedEquipmentId || isSaving} icon={<Plus className="size-[18px]" />} onClick={handleAddMore}>Adicionar mais</Button>
								</div>
							</div>
							<p role="status" className="text-xs leading-[1.45] text-text-secondary">
								{confirmation || (isLoadingDetails ? 'Carregando entregas e requisitos...' : stagedDeliveries.length > 0 ? `${stagedDeliveries.length} item(ns) preparado(s), ainda não registrado(s).` : 'Os dados serão registrados no banco ao salvar.')}
							</p>
						</form>
					</Card>

					<Card className="min-w-0 gap-6 p-5 sm:p-6">
						<CardHeader>
							<CardTitle>EPIs obrigatórios do colaborador</CardTitle>
							<CardDescription>{isLoadingDetails ? 'Carregando requisitos...' : `Exigências da função • ${selectedEmployee.funcao}`}</CardDescription>
						</CardHeader>

						<CardContent className="flex flex-col gap-5">
							<div className="flex flex-wrap items-center gap-3 rounded-control bg-surface-muted p-3.5 sm:p-[18px]">
								<Avatar size="lg" className="bg-surface-success">{initials(selectedEmployee.nome)}</Avatar>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold text-brand-deep">{selectedEmployee.nome}</p>
									<p className="text-xs text-text-secondary">CPF {selectedEmployee.cpf} • {selectedEmployee.setor}</p>
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
									const latestDelivery = latestDeliveries.get(item.id)
									const Icon = item.icon
									const status = getDeliveryStatus(item, latestDelivery)
									const StatusIcon = status.icon
									return (
										<div key={item.id} className="flex min-w-0 items-center gap-3 py-4 first:pt-0 last:pb-0 sm:gap-3.5">
											<span className="inline-flex size-10 shrink-0 items-center justify-center rounded-control bg-surface-muted text-brand sm:size-11">
												<Icon aria-hidden="true" className="size-6" />
											</span>
											<div className="min-w-0 flex-1">
												<p className="text-[13px] font-semibold text-brand-deep">{item.nome}</p>
												<p className="text-xs text-text-secondary">
													{latestDelivery ? `Último fornecimento em ${formatDate(latestDelivery.data_entrega)} • CA ${item.ca_numero} • ${latestDelivery.quantidade} un.` : 'Pendente • Nenhum fornecimento registrado'}
												</p>
											</div>
											<Badge variant={status.variant} icon={<StatusIcon />}>{status.label}</Badge>
										</div>
									)
								})}
							</div>

							<div className="flex items-start gap-2 border-t border-border pt-4 text-xs leading-[1.5] text-text-secondary">
								<Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
								<p>{missingCount > 0 ? `O ${outstandingItem?.nome.toLocaleLowerCase('pt-BR')} permanece pendente até o registro da entrega válida.` : requiredItems.length === 0 ? 'Nenhum EPI obrigatório está vinculado a esta função.' : 'Todos os equipamentos obrigatórios foram fornecidos.'}</p>
							</div>
						</CardContent>
					</Card>
				</section>
			</main>
		</div>
	)
}

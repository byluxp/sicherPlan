
import { useEffect, useState } from 'react'
import {
	CalendarDays,
	CircleAlert,
	Clock3,
	GraduationCap,
	HeartPulse,
	RefreshCw,
	ShieldCheck,
	UsersRound,
	type LucideIcon,
} from 'lucide-react'
import AppHeader from '../../components/header/app-header'
import Badge from '../../components/ui/badge'
import Button from '../../components/ui/button'
import Card, {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '../../components/ui/card'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '../../components/ui/table'
	import {
	carregarDashboard,
	updateIntervalMilliseconds,
	type DashboardData,
	type DashboardMetric,
} from '../../services/dashboardService'

const metricStatusClasses: Record<DashboardMetric['status'], string> = {
	success: 'bg-surface-success',
	warning: 'bg-status-warning',
	danger: 'bg-status-danger',
}

function formatDate(value: string) {
	const date = new Date(`${value.slice(0, 10)}T00:00:00`)
	return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR').format(date)
}

function MetricPanel({
	title,
	metrics,
	icon: Icon,
	unit,
}: {
	title: string
	metrics: DashboardMetric[]
	icon: LucideIcon
	unit: string
}) {
	return (
		<Card aria-label={title} className="gap-6 p-4 sm:p-6">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>Registros agrupados pela validade informada no banco.</CardDescription>
			</CardHeader>
			<CardContent className="grid grid-cols-3 gap-2 sm:gap-3">
				{metrics.map(({ label, status, value }) => (
					<div
						key={label}
						className={`flex min-w-0 flex-col gap-3.5 rounded-control p-3 sm:p-[18px] ${metricStatusClasses[status]}`}
					>
						<div className="flex w-full items-center justify-between gap-1 text-[11px] font-semibold leading-[1.45] text-text-primary sm:text-[13px]">
							<span>{label}</span>
							<Icon aria-hidden="true" className="size-4 shrink-0 text-brand" />
						</div>
						<strong className="text-[32px] font-bold leading-none text-brand-deep sm:text-[40px]">
							{value}
						</strong>
						<span className="text-[11px] leading-[1.45] text-text-primary sm:text-xs">{unit}</span>
					</div>
				))}
			</CardContent>
		</Card>
	)
}

export default function DashboardPage() {
	const [dashboard, setDashboard] = useState<DashboardData | null>(null)
	const [loadError, setLoadError] = useState('')
	const [isLoading, setIsLoading] = useState(true)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [refreshKey, setRefreshKey] = useState(0)

	useEffect(() => {
		let active = true
		let hasLoaded = false

		async function loadDashboard() {
			if (hasLoaded) setIsRefreshing(true)
			else setIsLoading(true)

			try {
				const data = await carregarDashboard()
				if (!active) return
				setDashboard(data)
				setLoadError('')
			} catch {
				if (active) setLoadError('Não foi possível atualizar o dashboard. Verifique a conexão com a API.')
			} finally {
				hasLoaded = true
				if (active) {
					setIsLoading(false)
					setIsRefreshing(false)
				}
			}
		}

		void loadDashboard()
		const intervalId = window.setInterval(() => void loadDashboard(), updateIntervalMilliseconds)
		const refreshWhenVisible = () => {
			if (document.visibilityState === 'visible') void loadDashboard()
		}
		window.addEventListener('focus', refreshWhenVisible)
		document.addEventListener('visibilitychange', refreshWhenVisible)
		return () => {
			active = false
			window.clearInterval(intervalId)
			window.removeEventListener('focus', refreshWhenVisible)
			document.removeEventListener('visibilitychange', refreshWhenVisible)
		}
	}, [refreshKey])

	const pendingCollaboratorCount = dashboard?.pendingCollaborators ?? 0
	const pendingEquipmentCount = dashboard?.pendingEquipment ?? 0
	const pendingDescription = dashboard
		? `${dashboard.pendingItems.length} pendência${dashboard.pendingItems.length === 1 ? '' : 's'} em ${pendingCollaboratorCount} colaborador${pendingCollaboratorCount === 1 ? '' : 'es'} e ${pendingEquipmentCount} EPI${pendingEquipmentCount === 1 ? '' : 's'}.`
		: 'Carregando pendências do banco de dados.'

	return (
		<div id="inicio" className="min-h-screen bg-surface-page font-sans text-text-primary">
			<AppHeader activePage="dashboard" />

			<main className="mx-auto flex w-full max-w-[1536px] flex-col gap-7 px-4 pb-8 pt-6 sm:px-6 lg:px-8 xl:px-12">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<ShieldCheck aria-hidden="true" className="size-[22px] text-brand" />
						<span className="text-[17px] text-brand">sicherPlan</span>
						<span className="text-[11px] text-text-secondary">GESTÃO DE SST</span>
					</div>
					<p className="text-xs text-text-secondary">Napoli Engenharia</p>
				</div>

				<section className="flex flex-wrap items-center justify-between gap-4" aria-labelledby="dashboard-title">
					<div className="flex flex-col gap-2">
						<h1 id="dashboard-title" className="text-[26px] font-bold leading-tight text-brand-deep sm:text-[32px]">
							Visão geral da segurança
						</h1>
						<p className="text-sm leading-[1.45] text-text-secondary">
							Acompanhe a saúde ocupacional e mantenha sua equipe em dia.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<div className="inline-flex items-center gap-2 rounded-control bg-surface-muted p-3 text-xs text-brand-deep">
							<CalendarDays aria-hidden="true" className="size-[17px]" />
							<time dateTime={new Date().toISOString().slice(0, 10)}>{new Date().toLocaleDateString('pt-BR')}</time>
						</div>
						<Button
							variant="secondary"
							icon={<RefreshCw className={`size-[18px] ${isRefreshing ? 'animate-spin' : ''}`} />}
							disabled={isRefreshing || isLoading}
							onClick={() => setRefreshKey((key) => key + 1)}
							title="Atualizar dados do dashboard"
						>
							{isRefreshing ? 'Atualizando...' : 'Atualizar'}
						</Button>
					</div>
				</section>

				{loadError && <p role="alert" className="rounded-control border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>}
				{isLoading && !dashboard && <p role="status" className="text-sm text-text-secondary">Carregando dados do banco...</p>}

				{dashboard && <>
				<section
					aria-label="Resumo da unidade"
					className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-border bg-surface-muted px-4 py-3.5 sm:px-5"
				>
					<div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
						<UsersRound aria-hidden="true" className="size-5 text-brand" />
						<strong className="font-semibold text-brand-deep">{dashboard.activeCollaborators} colaboradores ativos</strong>
						<span className="text-text-secondary">em {dashboard.activeSectors} setores ativos</span>
					</div>
					<p className="text-xs text-text-secondary">
						Base consultada em {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(dashboard.updatedAt))}
					</p>
				</section>

				<section aria-label="Resumo de conformidade" className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
					<MetricPanel title="Treinamentos" metrics={dashboard.trainingMetrics} icon={GraduationCap} unit="certificados" />
					<MetricPanel title="ASOs" metrics={dashboard.asoMetrics} icon={HeartPulse} unit="exames" />
					<MetricPanel title="EPIs" metrics={dashboard.epiMetrics} icon={ShieldCheck} unit="equipamentos" />
				</section>

				<Card id="pendencias" aria-labelledby="pending-title" className="gap-6 p-4 sm:p-6">
					<CardHeader>
						<CardTitle id="pending-title">Pendências dos colaboradores</CardTitle>
						<CardDescription>{pendingDescription}</CardDescription>
					</CardHeader>
					<CardContent>
						<Table aria-label="Pendências dos colaboradores">
							<TableHeader>
								<TableRow className="border-0">
									<TableHead className="w-[270px] sm:w-[350px]">COLABORADOR / REFERÊNCIA</TableHead>
									<TableHead>PENDÊNCIA</TableHead>
									<TableHead className="w-[140px]">VENCIMENTO</TableHead>
									<TableHead className="w-[210px]">SITUAÇÃO</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{dashboard.pendingItems.map(({ dueDate, employee, id, item, role, status, variant }) => {
									const Icon = variant === 'danger' ? CircleAlert : Clock3
									return <TableRow key={id}>
										<TableCell>
											<div className="flex min-w-0 flex-col gap-0.5">
												<strong className="font-semibold text-brand-deep">{employee}</strong>
												<span className="text-xs text-text-secondary">{role}</span>
											</div>
										</TableCell>
										<TableCell>{item}</TableCell>
										<TableCell className="whitespace-nowrap">{formatDate(dueDate)}</TableCell>
										<TableCell>
											<Badge variant={variant} icon={<Icon />}>
												{status}
											</Badge>
										</TableCell>
									</TableRow>
								})}
								{dashboard.pendingItems.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-text-secondary">Nenhuma pendência de vencimento encontrada.</TableCell></TableRow>}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
				</>}
			</main>
		</div>
	)
}

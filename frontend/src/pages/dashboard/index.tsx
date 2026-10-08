import {
	CalendarDays,
	CircleAlert,
	Clock3,
	GraduationCap,
	HeartPulse,
	ShieldCheck,
	UsersRound,
	type LucideIcon,
} from 'lucide-react'
import AppHeader from '../../components/header/app-header'
import Badge, { type BadgeVariant } from '../../components/ui/badge'
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

type Metric = {
	label: string
	value: number
	icon: LucideIcon
	status: 'success' | 'warning' | 'danger'
}

type PendingItem = {
	employee: string
	role: string
	item: string
	dueDate: string
	status: string
	variant: BadgeVariant
	icon: LucideIcon
}

const trainingMetrics: Metric[] = [
	{ label: 'Em dia', value: 5, icon: GraduationCap, status: 'success' },
	{ label: 'A vencer', value: 2, icon: GraduationCap, status: 'warning' },
	{ label: 'Vencidos', value: 1, icon: GraduationCap, status: 'danger' },
]

const asoMetrics: Metric[] = [
	{ label: 'Válidos', value: 6, icon: HeartPulse, status: 'success' },
	{ label: 'A vencer', value: 1, icon: HeartPulse, status: 'warning' },
	{ label: 'Vencidos', value: 1, icon: HeartPulse, status: 'danger' },
]


const pendingItems: PendingItem[] = [
	{
		employee: 'Carlos Eduardo Silva',
		role: 'Operador de máquinas',
		item: 'NR-12 • Segurança em máquinas',
		dueDate: '18/10/2026',
		status: 'Treinamento a vencer',
		variant: 'warning',
		icon: Clock3,
	},
	{
		employee: 'Juliana Costa Ribeiro',
		role: 'Técnica de manutenção',
		item: 'ASO • Exame periódico',
		dueDate: '12/10/2026',
		status: 'ASO a vencer',
		variant: 'warning',
		icon: Clock3,
	},
	{
		employee: 'Rafael Oliveira Santos',
		role: 'Almoxarife',
		item: 'NR-11 • Movimentação de cargas',
		dueDate: '25/10/2026',
		status: 'Treinamento a vencer',
		variant: 'warning',
		icon: Clock3,
	},
	{
		employee: 'Marcos Paulo Ferreira',
		role: 'Soldador',
		item: 'NR-35 • Trabalho em altura',
		dueDate: '28/09/2026',
		status: 'Treinamento vencido',
		variant: 'danger',
		icon: CircleAlert,
	},
	{
		employee: 'Marcos Paulo Ferreira',
		role: 'Soldador',
		item: 'ASO • Exame periódico',
		dueDate: '30/09/2026',
		status: 'ASO vencido',
		variant: 'danger',
		icon: CircleAlert,
	},
]

const metricStatusClasses: Record<Metric['status'], string> = {
	success: 'bg-surface-success',
	warning: 'bg-status-warning',
	danger: 'bg-status-danger',
}

function MetricPanel({ title, metrics }: { title: string; metrics: Metric[] }) {
	return (
		<Card aria-label={title} className="gap-6 p-4 sm:p-6">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>Vencimentos nos próximos 30 dias</CardDescription>
			</CardHeader>
			<CardContent className="grid grid-cols-3 gap-2 sm:gap-3">
				{metrics.map(({ icon: Icon, label, status, value }) => (
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
						<span className="text-[11px] leading-[1.45] text-text-primary sm:text-xs">
							colaboradores
						</span>
					</div>
				))}
			</CardContent>
		</Card>
	)
}

export default function DashboardPage() {
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
					<div className="inline-flex items-center gap-2 rounded-control bg-surface-muted p-3 text-xs text-brand-deep">
						<CalendarDays aria-hidden="true" className="size-[17px]" />
						<time dateTime={new Date().toISOString().slice(0, 10)}>
							{new Date().toLocaleDateString('pt-BR')}
						</time>
					</div>
				</section>

				<section
					aria-label="Resumo da unidade"
					className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-border bg-surface-muted px-4 py-3.5 sm:px-5"
				>
					<div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
						<UsersRound aria-hidden="true" className="size-5 text-brand" />
						<strong className="font-semibold text-brand-deep">8 colaboradores ativos</strong>
						<span className="text-text-secondary">em 4 setores</span>
					</div>
					<p className="text-xs text-text-secondary">
						Treinamentos e ASOs • Base atualizada em 03/10/2026
					</p>
				</section>

				<section aria-label="Resumo de conformidade" className="grid gap-6 lg:grid-cols-2">
					<MetricPanel title="Treinamentos" metrics={trainingMetrics} />
					<MetricPanel title="ASOs" metrics={asoMetrics} />
				</section>

				<Card id="pendencias" aria-labelledby="pending-title" className="gap-6 p-4 sm:p-6">
					<CardHeader>
						<CardTitle id="pending-title">Pendências dos colaboradores</CardTitle>
						<CardDescription>
							5 pendências em 4 colaboradores • Priorize vencidos e programe as renovações.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Table aria-label="Pendências dos colaboradores">
							<TableHeader>
								<TableRow className="border-0">
									<TableHead className="w-[270px] sm:w-[350px]">COLABORADOR / FUNÇÃO</TableHead>
									<TableHead>PENDÊNCIA</TableHead>
									<TableHead className="w-[140px]">VENCIMENTO</TableHead>
									<TableHead className="w-[210px]">SITUAÇÃO</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pendingItems.map(({ dueDate, employee, icon: Icon, item, role, status, variant }) => (
									<TableRow key={`${employee}-${item}`}>
										<TableCell>
											<div className="flex min-w-0 flex-col gap-0.5">
												<strong className="font-semibold text-brand-deep">{employee}</strong>
												<span className="text-xs text-text-secondary">{role}</span>
											</div>
										</TableCell>
										<TableCell>{item}</TableCell>
										<TableCell className="whitespace-nowrap">{dueDate}</TableCell>
										<TableCell>
											<Badge variant={variant} icon={<Icon />}>
												{status}
											</Badge>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</main>
		</div>
	)
}

import {
	Bell,
	FileBadge,
	HardHat,
	HandHelping,
	LayoutDashboard,
	UsersRound,
	Wrench,
	type LucideIcon,
} from 'lucide-react'
import Avatar from '../ui/avatar'
import Button from '../ui/button'

export type ActivePage = 'dashboard' | 'collaborators' | 'functions' | 'epi' | 'certificates'

const navigationItems: {
	label: string
	href: string
	icon: LucideIcon
	page?: ActivePage
}[] = [
	{ label: 'Início', href: '/', icon: LayoutDashboard, page: 'dashboard' },
	{ label: 'Colaboradores', href: '/colaboradores', icon: UsersRound, page: 'collaborators' },
	{ label: 'Funções e setores', href: '/funcoes-setores', icon: Wrench, page: 'functions' },
	{ label: 'EPIs', href: '/epis', icon: HardHat, page: 'epi' },
]

export function AppHeader({ activePage }: { activePage: ActivePage }) {
	return (
		<header className="relative z-10 flex min-h-[88px] flex-wrap items-center justify-between gap-x-3 gap-y-3 sm:gap-x-5 border-b border-border bg-white px-4 py-3 sm:px-7 xl:flex-nowrap">
			<div className="order-1 flex min-w-0 items-center gap-2">
				<Button className="px-3 sm:px-4" onClick={() => window.location.assign('/fornecer-epi')}>
					<HandHelping aria-hidden="true" className="size-[18px]" />
					<span>Fornecer EPI</span>
				</Button>
				<Button variant="secondary" className="px-3 sm:px-4" aria-current={activePage === 'certificates' ? 'page' : undefined} onClick={() => window.location.assign('/gerar-certificado')}>
					<FileBadge aria-hidden="true" className="size-[18px]" />
					{/* no celular o rótulo curto mantém ações, notificações e avatar na mesma linha */}
					<span className="sm:hidden">Certificado</span>
					<span className="hidden sm:inline">Gerar certificado</span>
				</Button>
			</div>

			<nav
				aria-label="Navegação principal"
				className="order-3 grid w-full grid-cols-4 gap-1 sm:-mx-7 sm:flex sm:w-[calc(100%+3.5rem)] sm:items-center sm:overflow-x-auto sm:px-7 sm:pb-1 xl:absolute xl:left-1/2 xl:top-1/2 xl:order-none xl:mx-0 xl:w-auto xl:-translate-x-1/2 xl:-translate-y-1/2 xl:overflow-visible xl:p-0"
			>
				{navigationItems.map(({ href, icon: Icon, label, page }) => {
					const isActive = page === activePage

					return (
						<a
							key={label}
							href={href}
							aria-current={isActive ? 'page' : undefined}
							className={`flex min-h-[62px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-control px-1 py-2 text-center text-[11px] leading-tight transition-colors sm:h-[62px] sm:min-w-[90px] sm:shrink-0 sm:px-3 sm:py-0 xl:min-w-[110px] ${isActive ? 'bg-surface-muted font-bold text-brand' : 'font-medium text-brand hover:bg-surface-page'}`}
						>
							<Icon aria-hidden="true" className="size-[22px]" />
							<span className="sm:whitespace-nowrap">{label}</span>
						</a>
					)
				})}
			</nav>

			<div className="order-2 ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
				<button
					type="button"
					aria-label="Notificações"
					className="hidden size-9 sm:inline-flex items-center justify-center rounded-full text-brand hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
				>
					<Bell aria-hidden="true" className="size-5" />
				</button>
				<Avatar aria-label="Lucila Cardoso" size="md">LC</Avatar>
				<div className="hidden flex-col gap-0.5 text-[11px] leading-[1.45] sm:flex">
					<strong className="text-xs font-semibold text-brand-deep">Lucila Cardoso</strong>
					<span className="text-text-secondary">Administradora</span>
				</div>
			</div>
		</header>
	)
}

export default AppHeader
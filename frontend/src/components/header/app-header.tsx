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

export type ActivePage = 'dashboard' | 'collaborators' | 'functions' | 'epi'

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
		<header className="relative z-10 flex min-h-[88px] flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-border bg-white px-4 py-3 sm:px-7 xl:flex-nowrap">
			<div className="order-1 flex shrink-0 items-center gap-2">
				<Button className="px-3 sm:px-4" onClick={() => window.location.assign('/fornecer-epi')}>
					<HandHelping aria-hidden="true" className="size-[18px]" />
					<span>Fornecer EPI</span>
				</Button>
				<Button variant="secondary" className="px-3 sm:px-4">
					<FileBadge aria-hidden="true" className="size-[18px]" />
					<span>Gerar certificado</span>
				</Button>
			</div>

			<nav
				aria-label="Navegação principal"
				className="order-3 -mx-4 flex w-[calc(100%+2rem)] items-center gap-1 overflow-x-auto px-4 pb-1 xl:absolute xl:left-1/2 xl:top-1/2 xl:order-none xl:mx-0 xl:w-auto xl:-translate-x-1/2 xl:-translate-y-1/2 xl:overflow-visible xl:p-0"
			>
				{navigationItems.map(({ href, icon: Icon, label, page }) => {
					const isActive = page === activePage

					return (
						<a
							key={label}
							href={href}
							aria-current={isActive ? 'page' : undefined}
							className={`flex h-[62px] min-w-[90px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-control px-3 text-[11px] transition-colors xl:min-w-[110px] ${isActive ? 'bg-surface-muted font-bold text-brand' : 'font-medium text-brand hover:bg-surface-page'}`}
						>
							<Icon aria-hidden="true" className="size-[22px]" />
							<span className="whitespace-nowrap">{label}</span>
						</a>
					)
				})}
			</nav>

			<div className="order-2 ml-auto flex shrink-0 items-center gap-3">
				<button
					type="button"
					aria-label="Notificações"
					className="inline-flex size-9 items-center justify-center rounded-full text-brand hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
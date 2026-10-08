import { useEffect, useState, type FormEvent } from 'react'
import { Boxes, Building2, CalendarDays, Check, Factory, Pencil, Save, ShieldCheck, Wrench } from 'lucide-react'
import AppHeader from '../../components/header/app-header'
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '../../components/ui/table'

type Sector = {
	name: string
	collaborators: number
}

type JobFunction = {
	name: string
	sector: string
}

const initialSectors: Sector[] = [
	{ name: 'Produção', collaborators: 3 },
	{ name: 'Manutenção', collaborators: 2 },
	{ name: 'Logística', collaborators: 2 },
	{ name: 'Administrativo', collaborators: 1 },
]

const initialFunctions: JobFunction[] = [
	{ name: 'Operador(a) de máquinas', sector: 'Produção' },
	{ name: 'Soldador', sector: 'Produção' },
	{ name: 'Técnico(a) de manutenção', sector: 'Manutenção' },
	{ name: 'Almoxarife', sector: 'Logística' },
	{ name: 'Assistente administrativa', sector: 'Administrativo' },
]

const sectorIcons = [Factory, Wrench, Boxes, Building2]

export default function FunctionsSectorsPage() {
	const [sectors, setSectors] = useState(initialSectors)
	const [functions, setFunctions] = useState(initialFunctions)
	const [sectorName, setSectorName] = useState('')
	const [editingSector, setEditingSector] = useState<string | null>(null)
	const [functionName, setFunctionName] = useState('')
	const [selectedSector, setSelectedSector] = useState(initialSectors[0].name)

	useEffect(() => {
		document.title = 'Funções e setores | sicherPlan'
	}, [])

	function handleSectorSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const name = sectorName.trim()
		if (!name) return
		const duplicate = sectors.some((sector) =>
			sector.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR') && sector.name !== editingSector,
		)
		if (duplicate) return

		if (editingSector) {
			setSectors((current) => current.map((sector) =>
				sector.name === editingSector ? { ...sector, name } : sector,
			))
			setFunctions((current) => current.map((job) =>
				job.sector === editingSector ? { ...job, sector: name } : job,
			))
			if (selectedSector === editingSector) setSelectedSector(name)
			setEditingSector(null)
		} else {
			setSectors((current) => [...current, { name, collaborators: 0 }])
			setSelectedSector((current) => current || name)
		}
		setSectorName('')
	}

	function handleFunctionSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const name = functionName.trim()
		if (!name || !selectedSector) return
		if (functions.some((job) => job.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'))) return

		setFunctions((current) => [...current, { name, sector: selectedSector }])
		setFunctionName('')
	}

	function startEditingSector(sector: Sector) {
		setEditingSector(sector.name)
		setSectorName(sector.name)
	}

	function cancelEditingSector() {
		setEditingSector(null)
		setSectorName('')
	}

	return (
		<div className="min-h-screen bg-surface-page font-sans text-text-primary">
			<AppHeader activePage="functions" />
			<main className="mx-auto flex w-full max-w-[1536px] flex-col gap-7 px-4 pb-8 pt-6 sm:px-6 lg:px-8 xl:px-12">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<ShieldCheck aria-hidden="true" className="size-[22px] text-brand" />
						<span className="text-[17px] text-brand">sicherPlan</span>
						<span className="text-[11px] text-text-secondary">GESTÃO DE SST</span>
					</div>
					<p className="text-xs text-text-secondary">Napoli Engenharia</p>
				</div>

				<section className="flex flex-wrap items-center justify-between gap-4" aria-labelledby="functions-title">
					<div className="flex flex-col gap-2">
						<h1 id="functions-title" className="text-[26px] font-bold leading-tight text-brand-deep sm:text-[32px]">
							Funções e setores
						</h1>
						<p className="text-sm leading-[1.45] text-text-secondary">
							Organize a estrutura da unidade e defina os vínculos da sua equipe.
						</p>
					</div>
					<div className="inline-flex items-center gap-2 rounded-control bg-surface-muted p-3 text-xs text-brand-deep">
						<CalendarDays aria-hidden="true" className="size-[17px]" />
						<time dateTime={new Date().toISOString().slice(0, 10)}>{new Date().toLocaleDateString('pt-BR')}</time>
					</div>
				</section>

				<section aria-label="Cadastros da estrutura" className="grid items-start gap-6 xl:grid-cols-2">
					<Card className="gap-6 p-5 sm:p-6">
						<CardHeader>
							<CardTitle>{editingSector ? 'Editar setor' : 'Cadastrar setor'}</CardTitle>
							<CardDescription>Crie os setores que serão vinculados às funções.</CardDescription>
						</CardHeader>

						<form className="flex w-full flex-col gap-4" onSubmit={handleSectorSubmit}>
							<div className="flex flex-col gap-2">
								<label htmlFor="sector-name" className="text-[13px] font-semibold text-text-primary">
									Nome do setor
								</label>
								<Input
									id="sector-name"
									value={sectorName}
									onChange={(event) => setSectorName(event.target.value)}
									placeholder="Ex.: Qualidade"
									required
								/>
							</div>
							<div className="flex flex-wrap gap-3">
								<Button type="submit" icon={<Save className="size-[18px]" />}>
									{editingSector ? 'Atualizar setor' : 'Salvar setor'}
								</Button>
								{editingSector && (
									<Button type="button" variant="secondary" onClick={cancelEditingSector}>
										Cancelar
									</Button>
								)}
							</div>
						</form>

						<div className="w-full border-t border-border pt-5">
							<div className="mb-4 flex items-center justify-between gap-3">
								<h2 className="text-sm font-semibold text-brand-deep">Setores cadastrados</h2>
								<span className="text-xs text-text-secondary">{sectors.length} setores</span>
							</div>
							<div className="flex flex-col gap-3">
								{sectors.map((sector, index) => {
									const Icon = sectorIcons[index % sectorIcons.length]
									return (
										<div
											key={sector.name}
											className="flex min-w-0 items-center gap-3.5 rounded-control border border-border bg-surface-input p-3 sm:p-4"
										>
											<span className="inline-flex size-10 shrink-0 items-center justify-center rounded-control bg-surface-muted text-brand">
												<Icon aria-hidden="true" className="size-5" />
											</span>
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-semibold text-brand-deep">{sector.name}</p>
												<p className="text-xs text-text-secondary">
													{sector.collaborators} {sector.collaborators === 1 ? 'colaboradora' : 'colaboradores'}
												</p>
											</div>
											<button
												type="button"
												aria-label={`Editar setor ${sector.name}`}
												onClick={() => startEditingSector(sector)}
												className="inline-flex size-9 shrink-0 items-center justify-center rounded-control text-brand hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
											>
												<Pencil aria-hidden="true" className="size-4" />
											</button>
										</div>
									)
								})}
							</div>
						</div>
					</Card>

					<Card className="min-w-0 gap-6 p-5 sm:p-6">
						<CardHeader>
							<CardTitle>Cadastrar função</CardTitle>
							<CardDescription>Cada função pertence a um setor previamente cadastrado.</CardDescription>
						</CardHeader>

						<form className="flex w-full flex-col gap-4" onSubmit={handleFunctionSubmit}>
							<div className="flex flex-col gap-2">
								<label htmlFor="function-name" className="text-[13px] font-semibold text-text-primary">
									Nome da função
								</label>
								<Input
									id="function-name"
									value={functionName}
									onChange={(event) => setFunctionName(event.target.value)}
									placeholder="Ex.: Inspetor(a) de qualidade"
									required
								/>
							</div>

							<div className="flex flex-col gap-2">
								<label htmlFor="function-sector" className="text-[13px] font-semibold text-text-primary">
									Selecionar setor
								</label>
								<Select
									id="function-sector"
									value={selectedSector}
									onChange={(event) => setSelectedSector(event.target.value)}
									required
								>
									{sectors.map((sector) => (
										<option key={sector.name} value={sector.name}>{sector.name}</option>
									))}
								</Select>
								<p className="text-xs text-text-secondary">Escolha um dos setores cadastrados abaixo.</p>
							</div>

							<div className="flex flex-wrap gap-2">
								{sectors.map((sector) => {
									const isSelected = selectedSector === sector.name
									return (
										<button
											key={sector.name}
											type="button"
											aria-pressed={isSelected}
											onClick={() => setSelectedSector(sector.name)}
											className={`inline-flex min-h-9 items-center gap-1.5 rounded-control border px-3 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${isSelected ? 'border-brand bg-surface-success text-brand-deep' : 'border-border bg-surface-input text-text-primary hover:bg-surface-muted'}`}
										>
											{isSelected && <Check aria-hidden="true" className="size-3.5" />}
											{sector.name}
										</button>
									)
								})}
							</div>

							<div>
								<Button type="submit" icon={<Save className="size-[18px]" />}>
									Salvar função
								</Button>
							</div>
						</form>

						<div className="w-full border-t border-border pt-5">
							<div className="mb-4 flex items-center justify-between gap-3">
								<h2 className="text-sm font-semibold text-brand-deep">Funções cadastradas</h2>
								<span className="text-xs text-text-secondary">{functions.length} funções</span>
							</div>
							<CardContent>
								<Table aria-label="Funções cadastradas">
									<TableHeader>
										<TableRow className="border-0">
											<TableHead>Função</TableHead>
											<TableHead className="w-[155px]">Setor vinculado</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{functions.map((job) => (
											<TableRow key={job.name} className="h-[53px]">
												<TableCell>{job.name}</TableCell>
												<TableCell className="text-xs text-text-secondary">{job.sector}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</div>
					</Card>
				</section>
			</main>
		</div>
	)
}

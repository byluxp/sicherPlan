import { useEffect, useState, type FormEvent } from 'react'
import { CalendarDays, LockKeyhole, Save, Search, ShieldCheck } from 'lucide-react'
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

type Collaborator = {
	name: string
	cpf: string
	role: string
	sector: string
}

type CollaboratorForm = Pick<Collaborator, 'name' | 'cpf' | 'role'>

const rolesBySector: Record<string, string> = {
	'Operador de máquinas': 'Produção',
	'Técnica de manutenção': 'Manutenção',
	Almoxarife: 'Logística',
	Soldador: 'Produção',
	'Assistente administrativa': 'Administrativo',
	'Operadora de máquinas': 'Produção',
	'Técnico de manutenção': 'Manutenção',
}

const initialCollaborators: Collaborator[] = [
	{ name: 'Carlos Eduardo Silva', cpf: '000.000.001-00', role: 'Operador de máquinas', sector: 'Produção' },
	{ name: 'Juliana Costa Ribeiro', cpf: '000.000.002-00', role: 'Técnica de manutenção', sector: 'Manutenção' },
	{ name: 'Rafael Oliveira Santos', cpf: '000.000.003-00', role: 'Almoxarife', sector: 'Logística' },
	{ name: 'Marcos Paulo Ferreira', cpf: '000.000.004-00', role: 'Soldador', sector: 'Produção' },
	{ name: 'Ana Beatriz Lima', cpf: '000.000.005-00', role: 'Assistente administrativa', sector: 'Administrativo' },
	{ name: 'Fernanda Alves Rocha', cpf: '000.000.006-00', role: 'Operadora de máquinas', sector: 'Produção' },
	{ name: 'Pedro Henrique Souza', cpf: '000.000.007-00', role: 'Técnico de manutenção', sector: 'Manutenção' },
	{ name: 'Lucas Mendes Pereira', cpf: '000.000.008-00', role: 'Almoxarife', sector: 'Logística' },
]

const emptyForm: CollaboratorForm = { name: '', cpf: '', role: '' }

function formatCpf(value: string) {
	const digits = value.replace(/\D/g, '').slice(0, 11)

	return digits
		.replace(/(\d{3})(\d)/, '$1.$2')
		.replace(/(\d{3})(\d)/, '$1.$2')
		.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export default function CollaboratorsPage() {
	const [collaborators, setCollaborators] = useState(initialCollaborators)
	const [searchTerm, setSearchTerm] = useState('')
	const [form, setForm] = useState(emptyForm)
	useEffect(() => {
		document.title = 'Colaboradores | sicherPlan'
	}, [])

	const normalizedSearch = searchTerm.trim().toLocaleLowerCase('pt-BR')
	const visibleCollaborators = collaborators.filter(({ cpf, name }) =>
		`${name} ${cpf}`.toLocaleLowerCase('pt-BR').includes(normalizedSearch),
	)
	const selectedSector = rolesBySector[form.role] ?? ''

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const normalizedCpf = formatCpf(form.cpf)
		if (collaborators.some((collaborator) => collaborator.cpf === normalizedCpf)) return

		setCollaborators((current) => [
			...current,
			{ ...form, cpf: normalizedCpf, sector: selectedSector },
		])
		setForm(emptyForm)
	}

	return (
		<div className="min-h-screen bg-surface-page font-sans text-text-primary">
			<AppHeader activePage="collaborators" />
			<main className="mx-auto flex w-full max-w-[1536px] flex-col gap-7 px-4 pb-8 pt-6 sm:px-6 lg:px-8 xl:px-12">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<ShieldCheck aria-hidden="true" className="size-[22px] text-brand" />
						<span className="text-[17px] text-brand">sicherPlan</span>
						<span className="text-[11px] text-text-secondary">GESTÃO DE SST</span>
					</div>
					<p className="text-xs text-text-secondary">Napoli Engenharia</p>
				</div>

				<section className="flex flex-wrap items-center justify-between gap-4" aria-labelledby="collaborators-title">
					<div className="flex flex-col gap-2">
						<h1 id="collaborators-title" className="text-[26px] font-bold leading-tight text-brand-deep sm:text-[32px]">
							Colaboradores
						</h1>
						<p className="text-sm leading-[1.45] text-text-secondary">
							Cadastre sua equipe e vincule cada pessoa à função correta.
						</p>
					</div>
					<div className="inline-flex items-center gap-2 rounded-control bg-surface-muted p-3 text-xs text-brand-deep">
						<CalendarDays aria-hidden="true" className="size-[17px]" />
						<time dateTime="2026-10-03">03/10/2026</time>
					</div>
				</section>

				<section aria-label="Cadastro e colaboradores" className="grid items-start gap-6 xl:grid-cols-[minmax(300px,420px)_minmax(0,1fr)]">
					<Card className="gap-6 p-5 sm:p-6">
						<CardHeader>
							<CardTitle>Cadastrar colaborador</CardTitle>
							<CardDescription>Preencha os dados para adicionar à equipe.</CardDescription>
						</CardHeader>

						<form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
							<div className="flex flex-col gap-2">
								<label htmlFor="collaborator-name" className="text-[13px] font-semibold text-text-primary">
									Nome completo
								</label>
								<Input
									id="collaborator-name"
									name="name"
									autoComplete="name"
									placeholder="Ex.: Bruna Azevedo Mendes"
									value={form.name}
									onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
									required
								/>
							</div>

							<div className="flex flex-col gap-2">
								<label htmlFor="collaborator-cpf" className="text-[13px] font-semibold text-text-primary">
									CPF
								</label>
								<Input
									id="collaborator-cpf"
									name="cpf"
									inputMode="numeric"
									autoComplete="off"
									maxLength={14}
									placeholder="000.000.000-00"
									value={form.cpf}
									onChange={(event) => setForm((current) => ({ ...current, cpf: formatCpf(event.target.value) }))}
									required
								/>
								<p className="text-xs text-text-secondary">Dados fictícios para demonstração.</p>
							</div>

							<div className="flex flex-col gap-2">
								<label htmlFor="collaborator-role" className="text-[13px] font-semibold text-text-primary">
									Função
								</label>
								<Select
									id="collaborator-role"
									name="role"
									value={form.role}
									onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
									required
								>
									<option value="" disabled>Selecione uma função</option>
									{Object.keys(rolesBySector).map((role) => (
										<option key={role} value={role}>{role}</option>
									))}
								</Select>
							</div>

							<div className="flex flex-col gap-2">
								<label htmlFor="collaborator-sector" className="text-[13px] font-semibold text-text-primary">
									Setor • automático
								</label>
								<Input
									id="collaborator-sector"
									value={selectedSector}
									placeholder="Definido pela função"
									endAdornment={<LockKeyhole className="size-[18px]" />}
									disabled
								/>
								<p className="text-xs text-text-secondary">Definido pela função selecionada. Não editável.</p>
							</div>

							<div className="mt-1 border-t border-border pt-4">
								<div className="flex flex-wrap gap-3">
									<Button type="submit" icon={<Save className="size-[18px]" />}>
										Salvar colaborador
									</Button>
									<Button type="reset" variant="secondary" onClick={() => setForm(emptyForm)}>
										Limpar
									</Button>
								</div>
							</div>
							<p className="text-xs leading-[1.5] text-text-secondary">
								O setor acompanha o vínculo da função, mantendo os cadastros consistentes.
							</p>
						</form>
					</Card>

					<Card className="min-w-0 gap-6 p-5 sm:p-6">
						<CardHeader>
							<CardTitle>Colaboradores cadastrados</CardTitle>
							<CardDescription>{collaborators.length} colaboradores • Todos os registros da unidade</CardDescription>
						</CardHeader>

						<CardContent className="flex flex-col gap-4">
							<div className="w-full">
								<Input
									aria-label="Buscar por nome ou CPF"
									placeholder="Buscar por nome ou CPF"
									value={searchTerm}
									onChange={(event) => setSearchTerm(event.target.value)}
									startAdornment={<Search className="size-[18px] text-brand" />}
								/>
							</div>

							<Table aria-label="Colaboradores cadastrados">
								<TableHeader>
									<TableRow className="border-0">
										<TableHead>Nome completo</TableHead>
										<TableHead className="w-[150px]">CPF</TableHead>
										<TableHead className="w-[210px]">Função</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{visibleCollaborators.map(({ cpf, name, role }) => (
										<TableRow key={cpf} className="h-[61px]">
											<TableCell className="font-semibold text-brand-deep">{name}</TableCell>
											<TableCell className="whitespace-nowrap text-xs text-text-secondary">{cpf}</TableCell>
											<TableCell className="text-xs">{role}</TableCell>
										</TableRow>
									))}
									{visibleCollaborators.length === 0 && (
										<TableRow>
											<TableCell colSpan={3} className="py-8 text-center text-text-secondary">
												Nenhum colaborador encontrado.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>

							<div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary">
								<span>Mostrando {visibleCollaborators.length} de {collaborators.length} colaboradores</span>
								<span className="text-text-primary">Página 1 de 1</span>
							</div>
						</CardContent>
					</Card>
				</section>
			</main>
		</div>
	)
}

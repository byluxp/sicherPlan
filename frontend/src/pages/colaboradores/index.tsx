import { useEffect, useState, type FormEvent } from 'react'
import { CalendarDays, Pencil, Save, Search, ShieldCheck, Trash2, X } from 'lucide-react'
import AppHeader from '../../components/header/app-header'
import Button from '../../components/ui/button'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import Input from '../../components/ui/input'
import Select from '../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { api } from '../../services/api'
import { colaboradorService, type Colaborador, type ColaboradorCreate } from '../../services/colaboradorService'

type Setor = { id: number; nome: string }
type Funcao = { id: number; nome: string; setor_id: number }
type FormState = {
	nome: string
	cpf: string
	data_nascimento: string
	data_admissao: string
	setor_id: string
	funcao_id: string
}

const emptyForm: FormState = {
	nome: '',
	cpf: '',
	data_nascimento: '',
	data_admissao: '',
	setor_id: '',
	funcao_id: '',
}

function formatCpf(value: string) {
	const digits = value.replace(/\D/g, '').slice(0, 11)
	return digits
		.replace(/(\d{3})(\d)/, '$1.$2')
		.replace(/(\d{3})(\d)/, '$1.$2')
		.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function toFormState(colaborador: Colaborador): FormState {
	return {
		nome: colaborador.nome,
		cpf: formatCpf(colaborador.cpf),
		data_nascimento: colaborador.data_nascimento ?? '',
		data_admissao: colaborador.data_admissao,
		setor_id: String(colaborador.setor_id),
		funcao_id: String(colaborador.funcao_id),
	}
}

export default function CollaboratorsPage() {
	const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
	const [setores, setSetores] = useState<Setor[]>([])
	const [funcoes, setFuncoes] = useState<Funcao[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [form, setForm] = useState<FormState>(emptyForm)
	const [editingId, setEditingId] = useState<number | null>(null)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)

	useEffect(() => {
		document.title = 'Colaboradores | sicherPlan'
		void carregarDados()
	}, [])

	async function carregarDados() {
		setLoading(true)
		try {
			const [colaboradoresResponse, setoresResponse, funcoesResponse] = await Promise.all([
				colaboradorService.listarTodos(),
				api.get<Setor[]>('/setores/'),
				api.get<Funcao[]>('/funcoes/'),
			])
			setColaboradores(colaboradoresResponse)
			setSetores(setoresResponse.data)
			setFuncoes(funcoesResponse.data)
			setError(null)
		} catch (requestError) {
			console.error('Erro ao carregar dados dos colaboradores:', requestError)
			setError('Não foi possível carregar os dados. Confira se o backend e o PostgreSQL estão ativos.')
		} finally {
			setLoading(false)
		}
	}

	const funcoesDoSetor = funcoes.filter((funcao) => String(funcao.setor_id) === form.setor_id)
	const normalizedSearch = searchTerm.trim().toLocaleLowerCase('pt-BR')
	const visibleCollaborators = colaboradores.filter((colaborador) => {
		const setor = setores.find((item) => item.id === colaborador.setor_id)?.nome ?? ''
		const funcao = funcoes.find((item) => item.id === colaborador.funcao_id)?.nome ?? ''
		return `${colaborador.nome} ${colaborador.cpf} ${setor} ${funcao}`.toLocaleLowerCase('pt-BR').includes(normalizedSearch)
	})

	function limparFormulario() {
		setForm(emptyForm)
		setEditingId(null)
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setSaving(true)
		setError(null)
		setNotice(null)
		const dados: ColaboradorCreate = {
			nome: form.nome.trim(),
			cpf: form.cpf,
			data_nascimento: form.data_nascimento || null,
			data_admissao: form.data_admissao,
			data_demissao: null,
			setor_id: Number(form.setor_id),
			funcao_id: Number(form.funcao_id),
			ativo: true,
		}

		try {
			if (editingId === null) {
				await colaboradorService.criar(dados)
				setNotice('Colaborador cadastrado no banco de dados.')
			} else {
				await colaboradorService.atualizar(editingId, dados)
				setNotice('Cadastro do colaborador atualizado.')
			}
			limparFormulario()
			await carregarDados()
		} catch (requestError) {
			console.error('Erro ao salvar colaborador:', requestError)
			setError('Não foi possível salvar. Verifique o CPF, o setor e a função e tente novamente.')
		} finally {
			setSaving(false)
		}
	}

	function iniciarEdicao(colaborador: Colaborador) {
		setEditingId(colaborador.id)
		setForm(toFormState(colaborador))
		setError(null)
		setNotice(null)
	}

	async function removerColaborador(colaborador: Colaborador) {
		if (!window.confirm(`Desativar o cadastro de ${colaborador.nome}?`)) return
		setError(null)
		setNotice(null)
		try {
			await colaboradorService.deletar(colaborador.id)
			if (editingId === colaborador.id) limparFormulario()
			setNotice('Colaborador desativado.')
			await carregarDados()
		} catch (requestError) {
			console.error('Erro ao desativar colaborador:', requestError)
			setError('Não foi possível desativar o colaborador.')
		}
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
						<h1 id="collaborators-title" className="text-[26px] font-bold leading-tight text-brand-deep sm:text-[32px]">Colaboradores</h1>
						<p className="text-sm leading-[1.45] text-text-secondary">Cadastre sua equipe e vincule cada pessoa à função correta.</p>
					</div>
					<div className="inline-flex items-center gap-2 rounded-control bg-surface-muted p-3 text-xs text-brand-deep">
						<CalendarDays aria-hidden="true" className="size-[17px]" />
						<time dateTime={new Date().toISOString().slice(0, 10)}>{new Date().toLocaleDateString('pt-BR')}</time>
					</div>
				</section>

				{error && <p role="alert" className="rounded-control border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
				{notice && <p role="status" className="rounded-control border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>}

				<section aria-label="Cadastro e colaboradores" className="grid items-start gap-6 xl:grid-cols-[minmax(300px,420px)_minmax(0,1fr)]">
					<Card className="gap-6 p-5 sm:p-6">
						<CardHeader>
							<CardTitle>{editingId === null ? 'Cadastrar colaborador' : 'Editar colaborador'}</CardTitle>
						</CardHeader>
						<form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
							<div className="flex flex-col gap-2">
								<label htmlFor="collaborator-name" className="text-[13px] font-semibold text-text-primary">Nome completo</label>
								<Input id="collaborator-name" name="nome" autoComplete="name" placeholder="Ex.: João da Silva" value={form.nome} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} required />
							</div>
							<div className="flex flex-col gap-2">
								<label htmlFor="collaborator-cpf" className="text-[13px] font-semibold text-text-primary">CPF</label>
								<Input id="collaborator-cpf" name="cpf" inputMode="numeric" autoComplete="off" maxLength={14} placeholder="000.000.000-00" value={form.cpf} onChange={(event) => setForm((current) => ({ ...current, cpf: formatCpf(event.target.value) }))} required />
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="flex flex-col gap-2">
									<label htmlFor="collaborator-birth" className="text-[13px] font-semibold text-text-primary">Data de nascimento</label>
									<Input id="collaborator-birth" type="date" value={form.data_nascimento} onChange={(event) => setForm((current) => ({ ...current, data_nascimento: event.target.value }))} />
								</div>
								<div className="flex flex-col gap-2">
									<label htmlFor="collaborator-hire" className="text-[13px] font-semibold text-text-primary">Data de admissão</label>
									<Input id="collaborator-hire" type="date" value={form.data_admissao} onChange={(event) => setForm((current) => ({ ...current, data_admissao: event.target.value }))} required />
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<label htmlFor="collaborator-sector" className="text-[13px] font-semibold text-text-primary">Setor</label>
								<Select id="collaborator-sector" value={form.setor_id} onChange={(event) => setForm((current) => ({ ...current, setor_id: event.target.value, funcao_id: '' }))} required>
									<option value="" disabled>Selecione um setor</option>
									{setores.map((setor) => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}
								</Select>
							</div>
							<div className="flex flex-col gap-2">
								<label htmlFor="collaborator-role" className="text-[13px] font-semibold text-text-primary">Função</label>
								<Select id="collaborator-role" value={form.funcao_id} onChange={(event) => setForm((current) => ({ ...current, funcao_id: event.target.value }))} required disabled={!form.setor_id}>
									<option value="" disabled>Selecione uma função</option>
									{funcoesDoSetor.map((funcao) => <option key={funcao.id} value={funcao.id}>{funcao.nome}</option>)}
								</Select>
							</div>
							<div className="mt-1 border-t border-border pt-4">
								<div className="flex flex-wrap gap-3">
									<Button type="submit" disabled={saving || loading} icon={<Save className="size-[18px]" />}>{saving ? 'Salvando...' : editingId === null ? 'Salvar colaborador' : 'Atualizar colaborador'}</Button>
									{editingId !== null ? (
										<Button type="button" variant="secondary" onClick={limparFormulario} icon={<X className="size-[18px]" />}>Cancelar</Button>
									) : (
										<Button type="reset" variant="secondary" onClick={limparFormulario}>Limpar</Button>
									)}
								</div>
							</div>
						</form>
					</Card>

					<Card className="min-w-0 gap-6 p-5 sm:p-6">
						<CardHeader>
							<CardTitle>Colaboradores cadastrados</CardTitle>
							<CardDescription>{colaboradores.length} colaboradores ativos no banco de dados</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							<Input aria-label="Buscar por nome ou CPF" placeholder="Buscar por nome ou CPF" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} startAdornment={<Search className="size-[18px] text-brand" />} />
							<Table aria-label="Colaboradores cadastrados">
								<TableHeader><TableRow className="border-0"><TableHead>Nome completo</TableHead><TableHead className="w-[150px]">CPF</TableHead><TableHead className="w-[210px]">Função / setor</TableHead><TableHead className="w-[96px] text-right">Ações</TableHead></TableRow></TableHeader>
								<TableBody>
									{visibleCollaborators.map((colaborador) => {
										const funcao = funcoes.find((item) => item.id === colaborador.funcao_id)?.nome ?? 'Função não encontrada'
										const setor = setores.find((item) => item.id === colaborador.setor_id)?.nome ?? 'Setor não encontrado'
										return <TableRow key={colaborador.id} className="h-[61px]">
											<TableCell className="font-semibold text-brand-deep">{colaborador.nome}</TableCell>
											<TableCell className="whitespace-nowrap text-xs text-text-secondary">{formatCpf(colaborador.cpf)}</TableCell>
											<TableCell className="text-xs"><span className="block">{funcao}</span><span className="text-text-secondary">{setor}</span></TableCell>
											<TableCell><div className="flex justify-end gap-1">
												<button type="button" title={`Editar ${colaborador.nome}`} aria-label={`Editar ${colaborador.nome}`} onClick={() => iniciarEdicao(colaborador)} className="inline-flex size-9 items-center justify-center rounded-control text-brand hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand"><Pencil aria-hidden="true" className="size-4" /></button>
												<button type="button" title={`Desativar ${colaborador.nome}`} aria-label={`Desativar ${colaborador.nome}`} onClick={() => void removerColaborador(colaborador)} className="inline-flex size-9 items-center justify-center rounded-control text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-700"><Trash2 aria-hidden="true" className="size-4" /></button>
											</div></TableCell>
										</TableRow>
									})}
									{!loading && visibleCollaborators.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-text-secondary">Nenhum colaborador encontrado.</TableCell></TableRow>}
									{loading && <TableRow><TableCell colSpan={4} className="py-8 text-center text-text-secondary">Carregando colaboradores...</TableCell></TableRow>}
								</TableBody>
							</Table>
							<div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary"><span>Mostrando {visibleCollaborators.length} de {colaboradores.length} colaboradores</span></div>
						</CardContent>
					</Card>
				</section>
			</main>
		</div>
	)
}

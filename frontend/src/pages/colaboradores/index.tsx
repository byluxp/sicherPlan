import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { CalendarDays, CircleAlert, Eye, FileCheck, FileUp, Pencil, Save, Search, ShieldCheck, Trash2, Upload, X } from 'lucide-react'
import AppHeader from '../../components/header/app-header'
import Button from '../../components/ui/button'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import Input from '../../components/ui/input'
import Select from '../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { api } from '../../services/api'
import {
	colaboradorService,
	type Colaborador,
	type ColaboradorCreate,
	type ColaboradorImportacaoDocumento,
} from '../../services/colaboradorService'
import { mensagemErroApi } from '../../services/funcaosetorService'

type Setor = { id: number; nome: string }
type Funcao = { id: number; nome: string; setor_id: number }
type FormState = {
	nome: string
	cpf: string
	data_nascimento: string
	data_admissao: string
	setor_id: string
	funcao_id: string
	apto_trabalho_altura: boolean | null
}

// marcação de aptidão para trabalho em altura; clicar de novo na opção marcada volta para "não avaliado"
const opcoesAptidaoAltura = [
	{ valor: true, rotulo: 'Apto', ativo: 'border-brand bg-brand text-brand-on-primary' },
	{ valor: false, rotulo: 'Inapto', ativo: 'border-status-danger-text bg-status-danger-text text-white' },
] as const

const emptyForm: FormState = {
	nome: '',
	cpf: '',
	data_nascimento: '',
	data_admissao: '',
	setor_id: '',
	funcao_id: '',
	apto_trabalho_altura: null,
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
		data_admissao: colaborador.data_admissao ?? '',
		setor_id: String(colaborador.setor_id),
		funcao_id: String(colaborador.funcao_id),
		apto_trabalho_altura: colaborador.apto_trabalho_altura,
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
	const [isImporting, setIsImporting] = useState(false)
	const [importError, setImportError] = useState('')
	// dados do documento importado, mostrados para conferência até o colaborador ser salvo
	const [importedDocument, setImportedDocument] = useState<ColaboradorImportacaoDocumento | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		document.title = 'Colaboradores | sicherPlan'
		void carregarDados().then((carregados) => {
			// "Editar" na página de detalhes volta para cá com ?editar=<id>
			const editarId = Number(new URLSearchParams(window.location.search).get('editar'))
			const colaborador = carregados.find((item) => item.id === editarId)
			if (!editarId) return
			window.history.replaceState(null, '', window.location.pathname)
			if (colaborador) iniciarEdicao(colaborador)
			else setError('O colaborador selecionado para edição não está entre os ativos.')
		})
	}, [])

	async function carregarDados(): Promise<Colaborador[]> {
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
			return colaboradoresResponse
		} catch (requestError) {
			console.error('Erro ao carregar dados dos colaboradores:', requestError)
			setError('Não foi possível carregar os dados. Confira se o backend e o PostgreSQL estão ativos.')
			return []
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
		setImportedDocument(null)
		setImportError('')
	}

	async function handleImport(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0]
		event.target.value = ''
		if (!file) return
		setImportError('')
		setError(null)
		setNotice(null)
		if (file.size > 10 * 1024 * 1024) {
			setImportError('O arquivo ultrapassa o limite de 10 MB.')
			return
		}
		if (!/\.(pdf|png|jpe?g)$/i.test(file.name)) {
			setImportError('Selecione um arquivo PDF, PNG ou JPG.')
			return
		}

		setIsImporting(true)
		try {
			const imported = await colaboradorService.importarDocumento(file)
			// preenche só os dados pessoais; setor, função e admissão continuam a cargo de quem cadastra
			setForm((current) => ({
				...current,
				nome: imported.nome ?? current.nome,
				cpf: imported.cpf ? formatCpf(imported.cpf) : current.cpf,
				data_nascimento: imported.data_nascimento ?? current.data_nascimento,
			}))
			setImportedDocument(imported)
		} catch (requestError) {
			setImportedDocument(null)
			setImportError(mensagemErroApi(requestError, 'Não foi possível ler o documento.'))
		} finally {
			setIsImporting(false)
		}
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setError(null)
		setNotice(null)
		if (!form.setor_id || !form.funcao_id) {
			setError('Selecione o setor e a função do colaborador para salvar.')
			return
		}
		setSaving(true)
		const dados: ColaboradorCreate = {
			nome: form.nome.trim(),
			cpf: form.cpf,
			data_nascimento: form.data_nascimento || null,
			data_admissao: form.data_admissao || null,
			data_demissao: null,
			setor_id: Number(form.setor_id),
			funcao_id: Number(form.funcao_id),
			ativo: true,
			apto_trabalho_altura: form.apto_trabalho_altura,
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
			setError(mensagemErroApi(requestError, 'Não foi possível salvar. Verifique o CPF, o setor e a função e tente novamente.'))
		} finally {
			setSaving(false)
		}
	}

	function iniciarEdicao(colaborador: Colaborador) {
		setEditingId(colaborador.id)
		setForm(toFormState(colaborador))
		setImportedDocument(null)
		setImportError('')
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
							{importedDocument && (
								<div role="status" className="flex flex-col gap-2 rounded-control border border-brand bg-surface-success p-3 text-xs leading-[1.5] text-brand-deep">
									<p className="flex items-center gap-1.5 text-[13px] font-semibold">
										<FileCheck aria-hidden="true" className="size-4 shrink-0" />
										Dados lidos do documento ({importedDocument.tipo_documento}). Confira, selecione setor e função e clique em Salvar colaborador.
									</p>
									<p className="text-text-secondary">
										{importedDocument.metodo_leitura === 'ia' ? 'Leitura feita por IA (Gemini).' : 'Leitura feita por OCR local.'}
									</p>
									{importedDocument.avisos.map((aviso) => (
										<p key={aviso} className="flex items-start gap-1.5 font-medium text-status-warning-text">
											<CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />{aviso}
										</p>
									))}
									{importedDocument.campos_nao_encontrados.length > 0 && (
										<p className="flex items-start gap-1.5 font-medium text-status-warning-text">
											<CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
											Não encontrado no documento: {importedDocument.campos_nao_encontrados.join(', ')}. Preencha manualmente.
										</p>
									)}
									{importedDocument.colaborador_existente && (
										<p className="flex flex-wrap items-center gap-2 font-medium text-status-danger-text">
											<CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
											Este CPF já está cadastrado para {importedDocument.colaborador_existente.nome}.
											<button type="button" className="underline" onClick={() => iniciarEdicao(importedDocument.colaborador_existente!)}>
												Abrir cadastro existente
											</button>
										</p>
									)}
								</div>
							)}

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
									<Input id="collaborator-hire" type="date" value={form.data_admissao} onChange={(event) => setForm((current) => ({ ...current, data_admissao: event.target.value }))} />
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<label htmlFor="collaborator-sector" className="text-[13px] font-semibold text-text-primary">Setor <span aria-hidden="true" className="text-status-danger-text">*</span></label>
								<Select id="collaborator-sector" value={form.setor_id} onChange={(event) => setForm((current) => ({ ...current, setor_id: event.target.value, funcao_id: '' }))} required>
									<option value="" disabled>Selecione um setor</option>
									{setores.map((setor) => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}
								</Select>
							</div>
							<div className="flex flex-col gap-2">
								<label htmlFor="collaborator-role" className="text-[13px] font-semibold text-text-primary">Função <span aria-hidden="true" className="text-status-danger-text">*</span></label>
								<Select id="collaborator-role" value={form.funcao_id} onChange={(event) => setForm((current) => ({ ...current, funcao_id: event.target.value }))} required disabled={!form.setor_id}>
									<option value="" disabled>Selecione uma função</option>
									{funcoesDoSetor.map((funcao) => <option key={funcao.id} value={funcao.id}>{funcao.nome}</option>)}
								</Select>
							</div>
							<fieldset className="flex flex-col gap-2">
								<legend className="mb-2 text-[13px] font-semibold text-text-primary">Trabalho em altura (NR-35)</legend>
								<div className="grid grid-cols-2 gap-1.5 rounded-control border border-border bg-surface-muted p-1.5">
									{opcoesAptidaoAltura.map((opcao) => {
										const marcado = form.apto_trabalho_altura === opcao.valor
										return (
											<button
												key={opcao.rotulo}
												type="button"
												aria-pressed={marcado}
												onClick={() => setForm((current) => ({ ...current, apto_trabalho_altura: marcado ? null : opcao.valor }))}
												className={`min-h-[38px] rounded-control border px-2 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand ${marcado ? opcao.ativo : 'border-transparent bg-surface-card text-brand hover:bg-surface-success'}`}
											>
												{opcao.rotulo}
											</button>
										)
									})}
								</div>
								<p className={`text-xs leading-[1.5] ${form.apto_trabalho_altura === false ? 'font-medium text-status-danger-text' : 'text-text-secondary'}`}>
									{form.apto_trabalho_altura === null
										? 'Não avaliado. Marque conforme o ASO do colaborador.'
										: form.apto_trabalho_altura
											? 'Apto para trabalho em altura.'
											: 'Inapto: o certificado de NR-35 não poderá ser emitido.'}
								</p>
							</fieldset>
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

						{editingId === null && (
							<>
								<div className="flex w-full items-center gap-3 text-xs text-text-secondary" aria-hidden="true">
									<span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" />
								</div>
								<div className="flex w-full flex-col items-center gap-3 rounded-control border border-dashed border-border bg-surface-input p-5 text-center sm:p-6">
									<Upload aria-hidden="true" className="size-7 text-brand" />
									<input
										ref={fileInputRef}
										id="collaborator-import"
										type="file"
										accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
										className="sr-only"
										onChange={handleImport}
									/>
									<Button
										type="button"
										variant="secondary"
										disabled={isImporting}
										onClick={() => fileInputRef.current?.click()}
										icon={<FileUp className="size-[18px]" />}
									>
										{isImporting ? 'Lendo documento...' : 'Importar documento de identificação'}
									</Button>
									<p className="text-xs text-text-secondary">PDF, PNG ou JPG • até 10 MB</p>
									<p className="text-xs leading-[1.5] text-text-secondary">Envie o RG ou a CNH do colaborador. Nome, CPF e data de nascimento preenchem o formulário para conferência.</p>
									{importError && <p role="alert" className="text-xs font-medium text-status-danger-text">{importError}</p>}
								</div>
							</>
						)}
					</Card>

					<Card className="min-w-0 gap-6 p-5 sm:p-6">
						<CardHeader>
							<CardTitle>Colaboradores cadastrados</CardTitle>
							<CardDescription>{colaboradores.length} colaboradores ativos no banco de dados</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							<Input aria-label="Buscar por nome ou CPF" placeholder="Buscar por nome ou CPF" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} startAdornment={<Search className="size-[18px] text-brand" />} />
							<Table aria-label="Colaboradores cadastrados">
								<TableHeader><TableRow className="border-0"><TableHead>Nome completo</TableHead><TableHead className="w-[150px]">CPF</TableHead><TableHead className="w-[210px]">Função / setor</TableHead><TableHead className="w-[132px] text-right">Ações</TableHead></TableRow></TableHeader>
								<TableBody>
									{visibleCollaborators.map((colaborador) => {
										const funcao = funcoes.find((item) => item.id === colaborador.funcao_id)?.nome ?? 'Função não encontrada'
										const setor = setores.find((item) => item.id === colaborador.setor_id)?.nome ?? 'Setor não encontrado'
										return <TableRow key={colaborador.id} className="h-[61px]">
											<TableCell className="font-semibold text-brand-deep">{colaborador.nome}</TableCell>
											<TableCell className="whitespace-nowrap text-xs text-text-secondary">{formatCpf(colaborador.cpf)}</TableCell>
											<TableCell className="text-xs"><span className="block">{funcao}</span><span className="text-text-secondary">{setor}</span></TableCell>
											<TableCell><div className="flex justify-end gap-1">
												<button type="button" title={`Consultar ${colaborador.nome}`} aria-label={`Consultar ${colaborador.nome}`} onClick={() => window.location.assign(`/colaboradores/detalhe?id=${colaborador.id}`)} className="inline-flex size-9 items-center justify-center rounded-control text-brand hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand"><Eye aria-hidden="true" className="size-4" /></button>
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

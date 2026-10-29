import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { CircleAlert, FileCheck, FileUp, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import Badge, { type BadgeVariant } from '../../components/ui/badge'
import Button from '../../components/ui/button'
import Input from '../../components/ui/input'
import Select from '../../components/ui/select'
import { asoService, TIPOS_ASO, type Aso, type AsoExame, type AsoImportacaoDocumento } from '../../services/asoService'
import { mensagemErroApi } from '../../services/funcaosetorService'

export type Situacao = { label: string; variant: BadgeVariant }

export function formatDate(value: string | null) {
	if (!value) return '—'
	const [year, month, day] = value.slice(0, 10).split('-').map(Number)
	return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)))
}

// mesma regra do dashboard: "a vencer" nos próximos 30 dias
export function situacaoVencimento(value: string | null): Situacao {
	if (!value) return { label: 'Válido', variant: 'success' }
	const [year, month, day] = value.slice(0, 10).split('-').map(Number)
	const now = new Date()
	const dias = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86_400_000)
	if (dias < 0) return { label: 'Vencido', variant: 'danger' }
	if (dias <= 30) return { label: 'A vencer', variant: 'warning' }
	return { label: 'Válido', variant: 'success' }
}

type FormAso = {
	id: number | null
	tipo: string
	data_exame: string
	data_emissao: string
	data_vencimento: string
	resultado: 'Apto' | 'Inapto' | null
	apto_trabalho_altura: boolean | null
	exames: { nome: string; data: string }[]
	observacao: string
}

const formVazio: FormAso = {
	id: null,
	tipo: '',
	data_exame: '',
	data_emissao: '',
	data_vencimento: '',
	resultado: null,
	apto_trabalho_altura: null,
	exames: [],
	observacao: '',
}

// admissional, periódico, retorno e mudança de risco vencem em 12 meses (padrão da NR-7); o demissional não vence
function sugerirVencimento(tipo: string, dataEmissao: string) {
	if (!tipo || tipo === 'Demissional' || !dataEmissao) return ''
	const [year, month, day] = dataEmissao.split('-').map(Number)
	const ultimoDia = new Date(Date.UTC(year + 1, month, 0)).getUTCDate()
	return `${year + 1}-${String(month).padStart(2, '0')}-${String(Math.min(day, ultimoDia)).padStart(2, '0')}`
}

function examesDoForm(exames: AsoExame[]) {
	return exames.map((exame) => ({ nome: exame.nome, data: exame.data ?? '' }))
}

function toForm(aso: Aso): FormAso {
	return {
		id: aso.id,
		tipo: aso.tipo,
		data_exame: aso.data_exame ?? '',
		data_emissao: aso.data_emissao.slice(0, 10),
		data_vencimento: aso.data_vencimento?.slice(0, 10) ?? '',
		resultado: aso.resultado,
		apto_trabalho_altura: aso.apto_trabalho_altura,
		exames: examesDoForm(aso.exames),
		observacao: aso.observacao ?? '',
	}
}

const ALTURA_ROTULO: Record<string, string> = { true: 'Apto para altura', false: 'Inapto para altura', null: 'Altura: não consta' }

function Opcoes<T>({ legenda, opcoes, valor, onChange }: { legenda: string; opcoes: { valor: T; rotulo: string; ativo: string }[]; valor: T; onChange: (valor: T) => void }) {
	return (
		<fieldset className="flex flex-col gap-2">
			<legend className="mb-2 text-[13px] font-semibold text-text-primary">{legenda}</legend>
			<div className="grid gap-1.5 rounded-control border border-border bg-surface-muted p-1.5" style={{ gridTemplateColumns: `repeat(${opcoes.length}, minmax(0, 1fr))` }}>
				{opcoes.map((opcao) => {
					const marcado = valor === opcao.valor
					return (
						<button
							key={opcao.rotulo}
							type="button"
							aria-pressed={marcado}
							onClick={() => onChange(opcao.valor)}
							className={`min-h-[38px] rounded-control border px-2 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand ${marcado ? opcao.ativo : 'border-transparent bg-surface-card text-brand hover:bg-surface-success'}`}
						>
							{opcao.rotulo}
						</button>
					)
				})}
			</div>
		</fieldset>
	)
}

const ATIVO_APTO = 'border-brand bg-brand text-brand-on-primary'
const ATIVO_INAPTO = 'border-status-danger-text bg-status-danger-text text-white'
const ATIVO_NEUTRO = 'border-text-secondary bg-text-secondary text-white'

// Histórico e edição dos ASOs de um colaborador já cadastrado, com leitura do PDF do ASO
export default function GestaoAsos({ colaboradorId, onAlterado }: { colaboradorId: number; onAlterado: () => void }) {
	const [asos, setAsos] = useState<Aso[]>([])
	const [form, setForm] = useState<FormAso | null>(null)
	const [lido, setLido] = useState<AsoImportacaoDocumento | null>(null)
	const [lendo, setLendo] = useState(false)
	const [salvando, setSalvando] = useState(false)
	const [erro, setErro] = useState('')
	const [aviso, setAviso] = useState('')
	const arquivoRef = useRef<HTMLInputElement>(null)

	async function carregar() {
		try {
			setAsos(await asoService.listarPorColaborador(colaboradorId))
		} catch (requestError) {
			setErro(mensagemErroApi(requestError, 'Não foi possível carregar os ASOs.'))
		}
	}

	useEffect(() => {
		let active = true
		asoService.listarPorColaborador(colaboradorId)
			.then((dados) => { if (active) setAsos(dados) })
			.catch((requestError) => { if (active) setErro(mensagemErroApi(requestError, 'Não foi possível carregar os ASOs.')) })
		return () => { active = false }
	}, [colaboradorId])

	function abrirForm(novo: FormAso) {
		setErro('')
		setAviso('')
		setLido(null)
		setForm(novo)
	}

	function alterar(campos: Partial<FormAso>) {
		setForm((atual) => {
			if (!atual) return atual
			const proximo = { ...atual, ...campos }
			// tipo ou liberação mudou: recalcula o vencimento sugerido (o campo continua editável)
			if ('tipo' in campos || 'data_emissao' in campos) proximo.data_vencimento = sugerirVencimento(proximo.tipo, proximo.data_emissao)
			return proximo
		})
	}

	async function importar(event: ChangeEvent<HTMLInputElement>) {
		const arquivo = event.target.files?.[0]
		event.target.value = ''
		if (!arquivo) return
		setErro('')
		setAviso('')
		if (arquivo.size > 10 * 1024 * 1024) {
			setErro('O arquivo ultrapassa o limite de 10 MB.')
			return
		}
		if (!/\.(pdf|png|jpe?g)$/i.test(arquivo.name)) {
			setErro('Selecione um arquivo PDF, PNG ou JPG.')
			return
		}
		setLendo(true)
		try {
			const dados = await asoService.importarDocumento(colaboradorId, arquivo)
			setLido(dados)
			// preenche o formulário com o que foi lido; o que não foi encontrado fica como estava
			setForm((atual) => {
				const base = atual ?? formVazio
				return {
					...base,
					tipo: dados.tipo ?? base.tipo,
					data_exame: dados.data_exame ?? base.data_exame,
					data_emissao: dados.data_emissao ?? base.data_emissao,
					data_vencimento: dados.data_vencimento ?? (dados.tipo === 'Demissional' ? '' : base.data_vencimento),
					resultado: dados.resultado ?? base.resultado,
					apto_trabalho_altura: dados.apto_trabalho_altura ?? base.apto_trabalho_altura,
					exames: dados.exames.length > 0 ? examesDoForm(dados.exames) : base.exames,
				}
			})
		} catch (requestError) {
			setErro(mensagemErroApi(requestError, 'Não foi possível ler o ASO.'))
		} finally {
			setLendo(false)
		}
	}

	async function salvar(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!form) return
		setErro('')
		if (!form.tipo || !form.data_emissao || !form.resultado) {
			setErro('Preencha o tipo, a data de liberação e o resultado do ASO.')
			return
		}
		const dados = {
			colaborador_id: colaboradorId,
			tipo: form.tipo,
			data_exame: form.data_exame || null,
			data_emissao: form.data_emissao,
			data_vencimento: form.data_vencimento || null,
			resultado: form.resultado,
			apto_trabalho_altura: form.apto_trabalho_altura,
			exames: form.exames.filter((exame) => exame.nome.trim()).map((exame) => ({ nome: exame.nome.trim(), data: exame.data || null })),
			url_documento: null,
			observacao: form.observacao.trim() || null,
		}
		setSalvando(true)
		try {
			if (form.id === null) await asoService.criar(dados)
			else await asoService.atualizar(form.id, dados)
			setAviso(form.id === null ? 'ASO cadastrado.' : 'ASO atualizado.')
			setForm(null)
			setLido(null)
			await carregar()
			onAlterado()
		} catch (requestError) {
			setErro(mensagemErroApi(requestError, 'Não foi possível salvar o ASO.'))
		} finally {
			setSalvando(false)
		}
	}

	async function excluir(aso: Aso) {
		if (!window.confirm(`Excluir o ASO ${aso.tipo.toLowerCase()} liberado em ${formatDate(aso.data_emissao)}?`)) return
		setErro('')
		setAviso('')
		try {
			await asoService.excluir(aso.id)
			if (form?.id === aso.id) setForm(null)
			setAviso('ASO excluído.')
			await carregar()
			onAlterado()
		} catch (requestError) {
			setErro(mensagemErroApi(requestError, 'Não foi possível excluir o ASO.'))
		}
	}

	return (
		<div className="flex flex-col gap-4 border-t border-border pt-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h3 className="text-[15px] font-semibold text-brand-deep">ASOs do colaborador</h3>
					<p className="text-xs text-text-secondary">O ASO mais recente atualiza a aptidão para trabalho em altura do cadastro.</p>
				</div>
				{!form && (
					<Button type="button" icon={<Plus className="size-[18px]" />} onClick={() => abrirForm(formVazio)}>Novo ASO</Button>
				)}
			</div>

			{erro && <p role="alert" className="rounded-control border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{erro}</p>}
			{aviso && <p role="status" className="rounded-control border border-border bg-surface-success px-4 py-3 text-sm text-brand-deep">{aviso}</p>}

			{form && (
				<form onSubmit={salvar} className="flex flex-col gap-4 rounded-card border border-border bg-surface-page p-4 sm:p-5">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<p className="text-sm font-semibold text-brand-deep">{form.id === null ? 'Novo ASO' : 'Editar ASO'}</p>
						<input ref={arquivoRef} type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" className="sr-only" onChange={importar} />
						<Button type="button" variant="secondary" disabled={lendo} icon={<FileUp className="size-[18px]" />} onClick={() => arquivoRef.current?.click()}>
							{lendo ? 'Lendo ASO...' : 'Importar PDF do ASO'}
						</Button>
					</div>

					{lido && (
						<div className="flex flex-col gap-1.5 rounded-control border border-border bg-surface-card px-4 py-3 text-xs">
							<p className="flex items-start gap-1.5 font-medium text-brand-deep">
								<FileCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
								ASO lido{lido.nome ? ` de ${lido.nome}` : ''}. Confira os campos antes de salvar.
							</p>
							<p className="text-text-secondary">{lido.metodo_leitura === 'ia' ? 'Leitura feita por IA (Gemini).' : 'Leitura feita no próprio servidor (texto do PDF ou OCR).'}</p>
							{lido.avisos.map((texto) => (
								<p key={texto} className="flex items-start gap-1.5 font-medium text-status-danger-text">
									<CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />{texto}
								</p>
							))}
							{lido.campos_nao_encontrados.length > 0 && (
								<p className="flex items-start gap-1.5 font-medium text-status-warning-text">
									<CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
									Não encontrado no ASO: {lido.campos_nao_encontrados.join(', ')}. Preencha manualmente.
								</p>
							)}
						</div>
					)}

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="flex flex-col gap-2">
							<label htmlFor="aso-tipo" className="text-[13px] font-semibold text-text-primary">Tipo do ASO</label>
							<Select id="aso-tipo" value={form.tipo} onChange={(event) => alterar({ tipo: event.target.value })} required>
								<option value="">Selecione</option>
								{TIPOS_ASO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
							</Select>
						</div>
						<div className="flex flex-col gap-2">
							<label htmlFor="aso-exame" className="text-[13px] font-semibold text-text-primary">Data do exame clínico</label>
							<Input id="aso-exame" type="date" value={form.data_exame} onChange={(event) => alterar({ data_exame: event.target.value })} />
						</div>
						<div className="flex flex-col gap-2">
							<label htmlFor="aso-emissao" className="text-[13px] font-semibold text-text-primary">Data de liberação do ASO</label>
							<Input id="aso-emissao" type="date" value={form.data_emissao} onChange={(event) => alterar({ data_emissao: event.target.value })} required />
						</div>
						<div className="flex flex-col gap-2">
							<label htmlFor="aso-vencimento" className="text-[13px] font-semibold text-text-primary">Vencimento</label>
							<Input id="aso-vencimento" type="date" value={form.data_vencimento} onChange={(event) => setForm({ ...form, data_vencimento: event.target.value })} />
							<p className="text-xs text-text-secondary">{form.tipo === 'Demissional' ? 'O demissional não vence.' : 'Sugerido: 12 meses após a liberação. Ajuste se o PCMSO definir outro prazo.'}</p>
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<Opcoes
							legenda="Resultado"
							valor={form.resultado}
							onChange={(resultado) => alterar({ resultado })}
							opcoes={[
								{ valor: 'Apto' as const, rotulo: 'Apto', ativo: ATIVO_APTO },
								{ valor: 'Inapto' as const, rotulo: 'Inapto', ativo: ATIVO_INAPTO },
							]}
						/>
						<Opcoes
							legenda="Trabalho em altura (NR-35)"
							valor={form.apto_trabalho_altura}
							onChange={(apto_trabalho_altura) => alterar({ apto_trabalho_altura })}
							opcoes={[
								{ valor: true as boolean | null, rotulo: 'Apto', ativo: ATIVO_APTO },
								{ valor: false as boolean | null, rotulo: 'Inapto', ativo: ATIVO_INAPTO },
								{ valor: null as boolean | null, rotulo: 'Não consta', ativo: ATIVO_NEUTRO },
							]}
						/>
					</div>

					<fieldset className="flex flex-col gap-2">
						<legend className="mb-2 text-[13px] font-semibold text-text-primary">Exames realizados</legend>
						{form.exames.length === 0 && <p className="text-xs text-text-secondary">Nenhum exame informado.</p>}
						{form.exames.map((exame, indice) => (
							<div key={indice} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_170px_auto]">
								<Input
									aria-label={`Exame ${indice + 1}`}
									placeholder="Ex.: Audiometria"
									value={exame.nome}
									containerClassName="col-span-1"
									onChange={(event) => alterar({ exames: form.exames.map((item, i) => (i === indice ? { ...item, nome: event.target.value } : item)) })}
								/>
								<Input
									aria-label={`Data do exame ${indice + 1}`}
									type="date"
									value={exame.data}
									containerClassName="order-3 col-span-2 sm:order-none sm:col-span-1"
									onChange={(event) => alterar({ exames: form.exames.map((item, i) => (i === indice ? { ...item, data: event.target.value } : item)) })}
								/>
								<button
									type="button"
									aria-label={`Remover exame ${indice + 1}`}
									className="inline-flex size-12 items-center justify-center rounded-control text-status-danger-text hover:bg-status-danger"
									onClick={() => alterar({ exames: form.exames.filter((_, i) => i !== indice) })}
								>
									<Trash2 aria-hidden="true" className="size-[18px]" />
								</button>
							</div>
						))}
						<div>
							<Button type="button" variant="secondary" icon={<Plus className="size-[18px]" />} onClick={() => alterar({ exames: [...form.exames, { nome: '', data: '' }] })}>Adicionar exame</Button>
						</div>
					</fieldset>

					<div className="flex flex-col gap-2">
						<label htmlFor="aso-observacao" className="text-[13px] font-semibold text-text-primary">Observação</label>
						<Input id="aso-observacao" value={form.observacao} onChange={(event) => alterar({ observacao: event.target.value })} />
					</div>

					<div className="flex flex-wrap gap-3 border-t border-border pt-4">
						<Button type="submit" disabled={salvando || lendo} icon={<Save className="size-[18px]" />}>{salvando ? 'Salvando...' : form.id === null ? 'Salvar ASO' : 'Atualizar ASO'}</Button>
						<Button type="button" variant="secondary" icon={<X className="size-[18px]" />} onClick={() => { setForm(null); setLido(null); setErro('') }}>Cancelar</Button>
					</div>
				</form>
			)}

			{asos.length === 0 ? (
				<p className="text-sm text-text-secondary">Nenhum ASO registrado.</p>
			) : (
				<ul className="flex flex-col gap-2">
					{asos.map((aso) => {
						const situacao = situacaoVencimento(aso.data_vencimento)
						return (
							<li key={aso.id} className="flex flex-wrap items-start justify-between gap-3 rounded-control border border-border bg-surface-card px-4 py-3">
								<div className="flex min-w-0 flex-col gap-1.5">
									<p className="text-sm font-semibold text-brand-deep">{aso.tipo}</p>
									<p className="text-xs text-text-secondary">
										Liberado em {formatDate(aso.data_emissao)} • {aso.data_vencimento ? `vence em ${formatDate(aso.data_vencimento)}` : 'sem vencimento'}
									</p>
									<div className="flex flex-wrap gap-1.5">
										<Badge variant={situacao.variant}>{situacao.label}</Badge>
										{aso.resultado && <Badge variant={aso.resultado === 'Apto' ? 'success' : 'danger'}>{aso.resultado}</Badge>}
										<Badge variant={aso.apto_trabalho_altura === false ? 'danger' : aso.apto_trabalho_altura ? 'success' : 'warning'}>{ALTURA_ROTULO[String(aso.apto_trabalho_altura)]}</Badge>
									</div>
									{aso.exames.length > 0 && (
										<p className="text-xs text-text-secondary">Exames: {aso.exames.map((exame) => exame.data ? `${exame.nome} (${formatDate(exame.data)})` : exame.nome).join(', ')}</p>
									)}
								</div>
								<div className="flex gap-1">
									<button type="button" aria-label={`Editar ASO de ${formatDate(aso.data_emissao)}`} className="inline-flex size-9 items-center justify-center rounded-control text-brand hover:bg-surface-muted" onClick={() => abrirForm(toForm(aso))}>
										<Pencil aria-hidden="true" className="size-[18px]" />
									</button>
									<button type="button" aria-label={`Excluir ASO de ${formatDate(aso.data_emissao)}`} className="inline-flex size-9 items-center justify-center rounded-control text-status-danger-text hover:bg-status-danger" onClick={() => excluir(aso)}>
										<Trash2 aria-hidden="true" className="size-[18px]" />
									</button>
								</div>
							</li>
						)
					})}
				</ul>
			)}
		</div>
	)
}

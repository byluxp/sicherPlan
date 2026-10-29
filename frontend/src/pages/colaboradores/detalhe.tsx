import { useEffect, useState, type ReactNode } from 'react'
import { Check, Pencil } from 'lucide-react'
import AppHeader from '../../components/header/app-header'
import Badge, { type BadgeVariant } from '../../components/ui/badge'
import Button from '../../components/ui/button'
import Card from '../../components/ui/card'
import { colaboradorService, type FichaColaborador } from '../../services/colaboradorService'
import { mensagemErroApi } from '../../services/funcaosetorService'
import GestaoAsos, { formatDate, situacaoVencimento, type Situacao } from './asos'
import { precisaEmitir, ROTULO_SITUACAO, treinamentosExigidos, type SituacaoTreinamento } from '../../utils/treinamentosObrigatorios'

const VARIANTE_SITUACAO: Record<SituacaoTreinamento, BadgeVariant> = {
	pendente: 'warning',
	vencido: 'danger',
	a_vencer: 'warning',
	valido: 'success',
}

const CONFORME: Situacao = { label: 'Conforme', variant: 'success' }
const PENDENTE: Situacao = { label: 'Pendente', variant: 'warning' }

// chave: valor de apto_trabalho_altura (true, false ou null = não avaliado)
const APTIDAO_ALTURA: Record<string, { situacao: Situacao; detalhe: string }> = {
	true: { situacao: { label: 'Apto', variant: 'success' }, detalhe: 'Liberado para trabalho em altura' },
	false: { situacao: { label: 'Inapto', variant: 'danger' }, detalhe: 'Certificado de NR-35 bloqueado' },
	null: { situacao: { label: 'Não avaliado', variant: 'warning' }, detalhe: 'Marque a aptidão no cadastro' },
}

function formatCpf(value: string) {
	return value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function textoValidade(value: string | null) {
	return value ? `Validade: até ${formatDate(value)}` : 'Sem vencimento'
}

// documento de cadastro: conforme quando existe um registro validado do tipo
function situacaoDocumento(ficha: FichaColaborador, padrao: RegExp): Situacao {
	const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
	return ficha.documentos.some((documento) => documento.validado && padrao.test(normalizar(documento.tipo_documento))) ? CONFORME : PENDENTE
}

// registros assinados: conforme quando existe ao menos um e todos estão assinados
function situacaoAssinatura(registros: { assinado: boolean | null }[]): Situacao {
	return registros.length > 0 && registros.every((registro) => registro.assinado) ? CONFORME : PENDENTE
}

function Secao({ titulo, acao, children }: { titulo: string; acao?: ReactNode; children: ReactNode }) {
	return (
		<section className="flex flex-col gap-4 rounded-card border border-border bg-white p-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-[17px] font-semibold text-brand-deep">{titulo}</h2>
				{acao}
			</div>
			{children}
		</section>
	)
}

function Item({ titulo, situacao, detalhe }: { titulo: string; situacao: Situacao; detalhe?: string }) {
	return (
		<div className="flex flex-col items-start gap-2">
			<p className="text-sm font-semibold text-brand-deep">{titulo}</p>
			<Badge variant={situacao.variant}>{situacao.label}</Badge>
			{detalhe && <p className="text-sm text-text-secondary">{detalhe}</p>}
		</div>
	)
}

export default function CollaboratorDetailPage() {
	const colaboradorId = Number(new URLSearchParams(window.location.search).get('id'))
	const [ficha, setFicha] = useState<FichaColaborador | null>(null)
	const [erro, setErro] = useState('')
	const [editandoSaude, setEditandoSaude] = useState(false)

	// recarrega depois de mexer nos ASOs: o ASO atual e a aptidão para altura podem ter mudado
	function recarregarFicha() {
		colaboradorService.consultarFicha(colaboradorId)
			.then(setFicha)
			.catch((requestError) => setErro(mensagemErroApi(requestError, 'Não foi possível carregar os dados do colaborador.')))
	}

	useEffect(() => {
		document.title = 'Detalhes do colaborador | sicherPlan'
		if (!colaboradorId) {
			setErro('Colaborador não informado. Volte para a lista de colaboradores e use a ação Consultar.')
			return
		}
		let active = true
		colaboradorService.consultarFicha(colaboradorId)
			.then((dados) => { if (active) setFicha(dados) })
			.catch((requestError) => { if (active) setErro(mensagemErroApi(requestError, 'Não foi possível carregar os dados do colaborador.')) })
		return () => { active = false }
	}, [colaboradorId])

	const asoAtual = ficha ? [...ficha.asos].sort((a, b) => b.data_emissao.localeCompare(a.data_emissao))[0] : undefined
	// só os treinamentos exigidos pela função aparecem; os demais não têm relação com a atividade
	const exigidos = treinamentosExigidos(
		ficha?.treinamentosObrigatorios ?? [],
		(ficha?.treinamentos ?? []).map((treinamento) => ({ ...treinamento, data: treinamento.data_emissao })),
	)
	const pendentes = exigidos.filter(({ situacao }) => precisaEmitir(situacao)).length

	return (
		<div className="min-h-screen bg-surface-page font-sans text-text-primary">
			<AppHeader activePage="collaborators" />
			<main className="mx-auto flex w-full max-w-[1536px] flex-col px-4 pb-8 pt-6 sm:px-6 lg:px-8 xl:px-12">
				<Card className="gap-6 p-5 sm:p-6">
					<header className="flex flex-col gap-2">
						<h1 className="text-[26px] font-bold leading-tight text-brand-deep">Detalhes do colaborador</h1>
						<p className="text-sm text-text-secondary">Visualize os dados completos de um colaborador, incluindo saúde ocupacional, treinamentos e documentação.</p>
					</header>

					{erro && <p role="alert" className="rounded-control border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{erro}</p>}
					{!ficha && !erro && <p role="status" className="text-sm text-text-secondary">Carregando dados do colaborador...</p>}

					{ficha && (
						<>
							<section aria-label="Dados do colaborador" className="flex flex-col gap-5 rounded-card border border-border bg-surface-success p-5">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<p className="text-[22px] font-bold text-brand-deep">{ficha.colaborador.nome}</p>
										<p className="mt-1 text-sm text-text-secondary">CPF: {formatCpf(ficha.colaborador.cpf)}</p>
									</div>
									<p className={`text-sm font-semibold ${ficha.colaborador.ativo ? 'text-brand' : 'text-status-danger-text'}`}>{ficha.colaborador.ativo ? 'Ativo' : 'Inativo'}</p>
								</div>
								<dl className="grid gap-4 sm:grid-cols-3">
									{([['Função', ficha.funcao], ['Setor', ficha.setor], ['Admissão', formatDate(ficha.colaborador.data_admissao)]] as const).map(([rotulo, valor]) => (
										<div key={rotulo}>
											<dt className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{rotulo}</dt>
											<dd className="mt-1 text-sm text-brand-deep">{valor}</dd>
										</div>
									))}
									<div className="sm:col-span-3">
										<dt className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Descrição da função</dt>
										<dd className="mt-1 text-sm leading-[1.6] text-brand-deep">{ficha.descricaoFuncao ?? 'Sem descrição cadastrada. Adicione em Funções e setores.'}</dd>
									</div>
								</dl>
							</section>

							<Secao
								titulo="Saúde ocupacional"
								acao={
									<Button type="button" variant="secondary" icon={editandoSaude ? <Check className="size-[18px]" /> : <Pencil className="size-[18px]" />} onClick={() => setEditandoSaude((atual) => !atual)}>
										{editandoSaude ? 'Concluir' : 'Editar'}
									</Button>
								}
							>
								<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
									{asoAtual
										? <Item titulo={`ASO • ${asoAtual.tipo}`} situacao={situacaoVencimento(asoAtual.data_vencimento)} detalhe={textoValidade(asoAtual.data_vencimento)} />
										: <Item titulo="ASO" situacao={PENDENTE} detalhe="Nenhum ASO registrado" />}
									<Item titulo="Trabalho em altura" {...APTIDAO_ALTURA[String(ficha.colaborador.apto_trabalho_altura)]} />
								</div>
								{editandoSaude && <GestaoAsos colaboradorId={ficha.colaborador.id} onAlterado={recarregarFicha} />}
							</Secao>

							<Secao titulo="Treinamentos">
								{exigidos.length === 0 ? (
									<p className="text-sm text-text-secondary">
										Nenhum treinamento obrigatório cadastrado para a função {ficha.funcao}. Defina os treinamentos exigidos em Funções e setores.
									</p>
								) : (
									<>
										<p className={`text-sm ${pendentes > 0 ? 'font-semibold text-status-warning-text' : 'text-text-secondary'}`}>
											{pendentes > 0
												? `${pendentes} de ${exigidos.length} treinamentos exigidos pela função estão pendentes ou vencidos.`
												: `Todos os ${exigidos.length} treinamentos exigidos pela função estão em dia.`}
										</p>
										<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
											{exigidos.map(({ obrigatorio, realizado, situacao }) => (
												<Item
													key={obrigatorio.id}
													titulo={obrigatorio.nr_codigo ? `${obrigatorio.nr_codigo} • ${obrigatorio.nome}` : obrigatorio.nome}
													situacao={{ label: ROTULO_SITUACAO[situacao], variant: VARIANTE_SITUACAO[situacao] }}
													detalhe={realizado ? textoValidade(realizado.data_vencimento) : 'Não realizado'}
												/>
											))}
										</div>
									</>
								)}
							</Secao>

							<Secao titulo="Documentação">
								<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
									<Item titulo="RG / CNH" situacao={situacaoDocumento(ficha, /\b(rg|cnh|identidade|habilitacao|cin)\b/)} />
									<Item titulo="CTPS" situacao={situacaoDocumento(ficha, /\b(ctps|carteira de trabalho)\b/)} />
									<Item titulo="Ficha de EPI" situacao={situacaoAssinatura(ficha.entregas)} />
									<Item titulo="Ficha de registro" situacao={situacaoDocumento(ficha, /ficha de registro/)} />
									<Item titulo="Ordem de serviço" situacao={situacaoAssinatura(ficha.ordensServico)} />
								</div>
							</Secao>

							<div className="flex flex-col items-start gap-3">
								<p className="text-xs text-text-secondary">Ação disponível para o cadastro deste colaborador</p>
								<Button type="button" variant="secondary" icon={<Pencil className="size-[18px]" />} onClick={() => window.location.assign(`/colaboradores?editar=${ficha.colaborador.id}`)}>
									Editar
								</Button>
							</div>
						</>
					)}
				</Card>
			</main>
		</div>
	)
}

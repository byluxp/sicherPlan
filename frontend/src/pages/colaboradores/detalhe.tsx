import { useEffect, useState, type ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import AppHeader from '../../components/header/app-header'
import Badge, { type BadgeVariant } from '../../components/ui/badge'
import Button from '../../components/ui/button'
import Card from '../../components/ui/card'
import { colaboradorService, type FichaColaborador, type FichaTreinamento } from '../../services/colaboradorService'
import { mensagemErroApi } from '../../services/funcaosetorService'

type Situacao = { label: string; variant: BadgeVariant }

// NRs exibidas sempre na ficha; outras NRs que o colaborador tiver aparecem em seguida
const TREINAMENTOS_PADRAO = [
	{ nr: 'NR-06', nome: 'EPI' },
	{ nr: 'NR-10', nome: 'Eletricidade' },
	{ nr: 'NR-12', nome: 'Máquinas' },
	{ nr: 'NR-18', nome: 'Canteiro' },
	{ nr: 'NR-35', nome: 'Trabalho em altura' },
]

const CONFORME: Situacao = { label: 'Conforme', variant: 'success' }
const PENDENTE: Situacao = { label: 'Pendente', variant: 'warning' }

function formatDate(value: string | null) {
	if (!value) return '—'
	const [year, month, day] = value.slice(0, 10).split('-').map(Number)
	return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)))
}

function formatCpf(value: string) {
	return value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

// mesma regra do dashboard: "a vencer" nos próximos 30 dias
function situacaoVencimento(value: string | null): Situacao {
	if (!value) return { label: 'Válido', variant: 'success' }
	const [year, month, day] = value.slice(0, 10).split('-').map(Number)
	const now = new Date()
	const dias = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86_400_000)
	if (dias < 0) return { label: 'Vencido', variant: 'danger' }
	if (dias <= 30) return { label: 'A vencer', variant: 'warning' }
	return { label: 'Válido', variant: 'success' }
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

function ultimoPorNr(treinamentos: FichaTreinamento[]) {
	const ultimos = new Map<string, FichaTreinamento>()
	for (const treinamento of treinamentos) {
		const chave = treinamento.nr_codigo ?? treinamento.nome_certificado
		const atual = ultimos.get(chave)
		if (!atual || treinamento.data_emissao > atual.data_emissao) ultimos.set(chave, treinamento)
	}
	return ultimos
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
	return (
		<section className="flex flex-col gap-4 rounded-card border border-border bg-white p-5">
			<h2 className="text-[17px] font-semibold text-brand-deep">{titulo}</h2>
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
	const treinamentosAtuais = ficha ? ultimoPorNr(ficha.treinamentos) : new Map<string, FichaTreinamento>()
	const outrosTreinamentos = Array.from(treinamentosAtuais.entries()).filter(([nr]) => !TREINAMENTOS_PADRAO.some((padrao) => padrao.nr === nr))

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
								</dl>
							</section>

							<Secao titulo="Saúde ocupacional">
								{asoAtual
									? <Item titulo={`ASO • ${asoAtual.tipo}`} situacao={situacaoVencimento(asoAtual.data_vencimento)} detalhe={textoValidade(asoAtual.data_vencimento)} />
									: <Item titulo="ASO" situacao={PENDENTE} detalhe="Nenhum ASO registrado" />}
							</Secao>

							<Secao titulo="Treinamentos">
								<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
									{TREINAMENTOS_PADRAO.map(({ nr, nome }) => {
										const treinamento = treinamentosAtuais.get(nr)
										return treinamento
											? <Item key={nr} titulo={`${nr} • ${nome}`} situacao={situacaoVencimento(treinamento.data_vencimento)} detalhe={textoValidade(treinamento.data_vencimento)} />
											: <Item key={nr} titulo={`${nr} • ${nome}`} situacao={{ label: 'Não realizado', variant: 'neutral' }} />
									})}
									{outrosTreinamentos.map(([nr, treinamento]) => (
										<Item key={nr} titulo={`${nr} • ${treinamento.nome_certificado}`} situacao={situacaoVencimento(treinamento.data_vencimento)} detalhe={textoValidade(treinamento.data_vencimento)} />
									))}
								</div>
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

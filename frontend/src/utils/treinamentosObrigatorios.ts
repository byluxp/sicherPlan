import type { TreinamentoObrigatorio } from '../services/funcaosetorService'

export type SituacaoTreinamento = 'pendente' | 'vencido' | 'a_vencer' | 'valido'

// Treinamento já realizado pelo colaborador (um registro por emissão: inicial ou reciclagem)
export interface TreinamentoRealizado {
	certificado_id: number
	nr_codigo: string | null
	data: string
	data_vencimento: string | null
}

export interface TreinamentoExigido<T extends TreinamentoRealizado> {
	obrigatorio: TreinamentoObrigatorio
	realizado: T | undefined
	situacao: SituacaoTreinamento
}

export const ROTULO_SITUACAO: Record<SituacaoTreinamento, string> = {
	pendente: 'Pendente',
	vencido: 'Vencido',
	a_vencer: 'A vencer',
	valido: 'Válido',
}

// a mesma NR conta como o mesmo treinamento, mesmo se houver mais de um certificado dela no catálogo
function chave(nrCodigo: string | null, certificadoId: number) {
	return nrCodigo ?? `certificado-${certificadoId}`
}

// mesma regra do dashboard: "a vencer" nos próximos 30 dias
export function situacaoPorVencimento(dataVencimento: string | null): SituacaoTreinamento {
	if (!dataVencimento) return 'valido'
	const [ano, mes, dia] = dataVencimento.slice(0, 10).split('-').map(Number)
	const hoje = new Date()
	const dias = Math.floor((Date.UTC(ano, mes - 1, dia) - Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) / 86_400_000)
	if (dias < 0) return 'vencido'
	if (dias <= 30) return 'a_vencer'
	return 'valido'
}

// Cruza os treinamentos exigidos pela função com os realizados; só o mais recente de cada treinamento vale
export function treinamentosExigidos<T extends TreinamentoRealizado>(obrigatorios: TreinamentoObrigatorio[], realizados: T[]): TreinamentoExigido<T>[] {
	const ultimos = new Map<string, T>()
	for (const realizado of realizados) {
		const id = chave(realizado.nr_codigo, realizado.certificado_id)
		const atual = ultimos.get(id)
		if (!atual || realizado.data > atual.data) ultimos.set(id, realizado)
	}
	return obrigatorios.map((obrigatorio) => {
		const realizado = ultimos.get(chave(obrigatorio.nr_codigo, obrigatorio.id))
		return { obrigatorio, realizado, situacao: realizado ? situacaoPorVencimento(realizado.data_vencimento) : 'pendente' }
	})
}

export function precisaEmitir(situacao: SituacaoTreinamento) {
	return situacao === 'pendente' || situacao === 'vencido'
}

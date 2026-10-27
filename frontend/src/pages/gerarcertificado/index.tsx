import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import AppHeader from '../../components/header/app-header'
import Avatar from '../../components/ui/avatar'
import Badge, { type BadgeVariant } from '../../components/ui/badge'
import Button from '../../components/ui/button'
import Card, { CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import Input from '../../components/ui/input'
import Select from '../../components/ui/select'
import addIcon from '../../assets/figma/certificados/add.svg'
import brandIcon from '../../assets/figma/certificados/brand.svg'
import certificateIcon from '../../assets/figma/certificados/certificate.svg'
import confirmIcon from '../../assets/figma/certificados/confirm.svg'
import dateBadgeIcon from '../../assets/figma/certificados/date-badge.svg'
import editIcon from '../../assets/figma/certificados/edit.svg'
import graduationIcon from '../../assets/figma/certificados/graduation.svg'
import infoIcon from '../../assets/figma/certificados/info.svg'
import lockIcon from '../../assets/figma/certificados/lock.svg'
import statusCheckIcon from '../../assets/figma/certificados/status-check.svg'
import statusClockIcon from '../../assets/figma/certificados/status-clock.svg'
import statusExpiredIcon from '../../assets/figma/certificados/status-expired.svg'
import { mensagemErroApi } from '../../services/funcaosetorService'
import { ROTULO_SITUACAO, treinamentosExigidos } from '../../utils/treinamentosObrigatorios'
import {
	gerarcertificadoService,
	type CertificatePageData,
	type CertificateType,
	type EmployeeCertificate,
	type NrCodigo,
} from '../../services/gerarcertificadoService'

type CertificateStatus = {
	label: string
	variant: BadgeVariant
	icon: string
}

type Training = {
	nr: NrCodigo
	nome: string
	disponivel: boolean
}

type QueuedCertificate = {
	nr: NrCodigo
	date: string
}

const trainings: Training[] = [
	{ nr: 'NR-06', nome: 'Equipamento de proteção individual', disponivel: true },
	{ nr: 'NR-12', nome: 'Segurança em máquinas e equipamentos (em breve)', disponivel: false },
	{ nr: 'NR-18', nome: 'Condições e meio ambiente de trabalho na indústria da construção', disponivel: true },
	{ nr: 'NR-35', nome: 'Trabalho em altura', disponivel: true },
]

function trainingName(training: Training | undefined) {
	return training ? `${training.nr} • ${training.nome}` : 'Treinamento não encontrado'
}

const today = () => {
	const date = new Date()
	const offset = date.getTimezoneOffset()
	return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

function formatCpf(value: string) {
	const digits = value.replace(/\D/g, '').slice(0, 11)
	return digits
		.replace(/(\d{3})(\d)/, '$1.$2')
		.replace(/(\d{3})(\d)/, '$1.$2')
		.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatDate(value: string | null) {
	if (!value) return 'Sem vencimento definido'
	const [year, month, day] = value.slice(0, 10).split('-').map(Number)
	return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)))
}

function dateStatus(value: string | null): CertificateStatus {
	if (!value) return { label: 'Conforme', variant: 'success', icon: statusCheckIcon }
	const [year, month, day] = value.slice(0, 10).split('-').map(Number)
	const dueDate = Date.UTC(year, month - 1, day)
	const now = new Date()
	const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
	const daysRemaining = Math.floor((dueDate - todayUtc) / 86_400_000)
	if (daysRemaining < 0) return { label: 'Vencido', variant: 'danger', icon: statusExpiredIcon }
	if (daysRemaining <= 30) return { label: 'A vencer', variant: 'warning', icon: statusClockIcon }
	return { label: 'Conforme', variant: 'success', icon: statusCheckIcon }
}

function certificateName(certificate: CertificateType | null) {
	if (!certificate) return 'Certificado não encontrado'
	return `${certificate.nr_codigo ? `${certificate.nr_codigo} • ` : ''}${certificate.nome}`
}

function initials(name: string) {
	return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function certificateFileName(record: EmployeeCertificate) {
	return `Certificado_${(record.certificado?.nr_codigo ?? 'NR').replace('-', '')}_${record.id}.docx`
}

export default function GenerateCertificatePage() {
	const [data, setData] = useState<CertificatePageData>({ colaboradores: [], certificados: [], registros: [] })
	const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
	const [selectedNr, setSelectedNr] = useState<NrCodigo>('NR-06')
	const [trainingDate, setTrainingDate] = useState(today)
	const [queue, setQueue] = useState<QueuedCertificate[]>([])
	const [confirmed, setConfirmed] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [error, setError] = useState('')
	const [notice, setNotice] = useState('')
	const [downloadingId, setDownloadingId] = useState<number | null>(null)

	useEffect(() => {
		document.title = 'Gerar certificado | sicherPlan'
		let active = true
		gerarcertificadoService.listarDados()
			.then((result) => {
				if (!active) return
				setData(result)
				const preferredEmployee = result.colaboradores.find((item) => item.nome === 'Carlos Eduardo Silva') ?? result.colaboradores[0]
				setSelectedEmployeeId(preferredEmployee?.id ?? null)
			})
			.catch((requestError) => {
				console.error('Erro ao carregar dados para certificados:', requestError)
				if (active) setError('Não foi possível carregar colaboradores e certificados. Confira se o backend está ativo.')
			})
			.finally(() => { if (active) setIsLoading(false) })
		return () => { active = false }
	}, [])

	const employee = data.colaboradores.find((item) => item.id === selectedEmployeeId) ?? null
	// inapto para trabalho em altura não pode receber o certificado de NR-35
	const isBlocked = (nr: NrCodigo) => nr === 'NR-35' && employee?.apto_trabalho_altura === false
	const selectedTraining = trainings.find((item) => item.nr === selectedNr)
	const canIssue = Boolean(selectedTraining?.disponivel) && !isBlocked(selectedNr)
	// agrupado por certificado, do treinamento mais recente para o inicial
	const employeeRecords = useMemo(() => data.registros
		.filter((record) => record.colaborador_id === selectedEmployeeId)
		.sort((left, right) => (left.certificado?.nr_codigo ?? '').localeCompare(right.certificado?.nr_codigo ?? '')
			|| right.data_conclusao.localeCompare(left.data_conclusao)),
	[data.registros, selectedEmployeeId])
	// só o último certificado de cada NR vale para a situação; os anteriores foram reciclados
	const currentRecordIds = useMemo(() => {
		const latest = new Map<number, EmployeeCertificate>()
		for (const record of employeeRecords) {
			const existing = latest.get(record.certificado_id)
			if (!existing || record.data_conclusao > existing.data_conclusao) latest.set(record.certificado_id, record)
		}
		return new Set(Array.from(latest.values()).map((record) => record.id))
	}, [employeeRecords])
	// treinamentos exigidos pela função que ainda não foram feitos, venceram ou vencem em até 30 dias
	const pendingTrainings = useMemo(() => treinamentosExigidos(
		employee?.treinamentos_obrigatorios ?? [],
		employeeRecords.map((record) => ({
			certificado_id: record.certificado_id,
			nr_codigo: record.certificado?.nr_codigo ?? null,
			data: record.data_conclusao,
			data_vencimento: record.data_vencimento,
		})),
	).filter(({ situacao }) => situacao !== 'valido'), [employee, employeeRecords])
	const pendingNrs = new Set(pendingTrainings.map(({ obrigatorio }) => obrigatorio.nr_codigo))
	const queuedCertificates = queue.map((item) => ({
		...item,
		training: trainings.find((training) => training.nr === item.nr),
	}))
	const currentDate = today()

	function changeEmployee(value: string) {
		setSelectedEmployeeId(value ? Number(value) : null)
		setQueue([])
		setConfirmed(false)
		setNotice('')
	}

	function queueSelectedCertificate() {
		if (!selectedTraining || !canIssue || !trainingDate) return
		setQueue((current) => current.some((item) => item.nr === selectedTraining.nr)
			? current
			: [...current, { nr: selectedTraining.nr, date: trainingDate }])
		setConfirmed(false)
		setNotice(`${trainingName(selectedTraining)} adicionado à fila.`)
	}

	async function generateCertificates() {
		if (!employee || !selectedTraining || !canIssue || !confirmed || !trainingDate) return
		const toGenerate = queue.length > 0 ? queue : [{ nr: selectedTraining.nr, date: trainingDate }]
		setIsSaving(true)
		setError('')
		setNotice('')
		let generatedCount = 0
		try {
			const generated: string[] = []
			for (const item of toGenerate) {
				const response = await gerarcertificadoService.gerarCertificado({
					colaborador_id: employee.id,
					nr_codigo: item.nr,
					data_conclusao: item.date,
				})
				generated.push(`${item.nr} (certificado nº ${response.id}, treinamento nº ${response.treinamento_id})`)
				generatedCount += 1
			}
			setQueue([])
			setNotice(`Gerado(s): ${generated.join('; ')}. Use o botão Baixar para obter o arquivo.`)
			setConfirmed(false)
		} catch (requestError) {
			console.error('Erro ao gerar certificado:', requestError)
			setQueue(toGenerate.slice(generatedCount))
			setError(mensagemErroApi(requestError, 'Não foi possível gerar o certificado. Confira os dados e tente novamente.'))
		} finally {
			// recarrega para trazer os registros e certificados criados pelo backend
			try {
				setData(await gerarcertificadoService.listarDados())
			} catch (reloadError) {
				console.error('Erro ao recarregar certificados:', reloadError)
			}
			setIsSaving(false)
		}
	}

	async function downloadCertificate(record: EmployeeCertificate) {
		setDownloadingId(record.id)
		setError('')
		try {
			await gerarcertificadoService.baixarCertificado(record.id, certificateFileName(record))
		} catch (requestError) {
			console.error('Erro ao baixar certificado:', requestError)
			setError('Não foi possível baixar o arquivo do certificado.')
		} finally {
			setDownloadingId(null)
		}
	}

	return (
		<div className="min-h-screen bg-surface-page font-sans text-text-primary">
			<AppHeader activePage="certificates" />
			<main className="mx-auto flex w-full max-w-[1536px] flex-col gap-7 px-4 pb-8 pt-6 sm:px-6 lg:px-8 xl:px-12">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<img src={brandIcon} alt="" width="22" height="22" />
						<span className="text-[17px] text-brand">sicherPlan</span>
						<span className="text-[11px] text-text-secondary">GESTÃO DE SST</span>
					</div>
					<p className="text-xs text-text-secondary">Napoli Engenharia</p>
				</div>

				<section className="flex flex-wrap items-center justify-between gap-4" aria-labelledby="certificate-title">
					<div className="flex flex-col gap-2">
						<h1 id="certificate-title" className="text-[26px] font-bold leading-tight text-brand-deep sm:text-[32px]">Gerar certificado</h1>
						<p className="text-sm leading-[1.45] text-text-secondary">Selecione o colaborador, informe o treinamento e confira os dados do certificado.</p>
					</div>
					<div className="inline-flex items-center gap-2 rounded-control bg-surface-muted p-3 text-xs text-brand-deep">
						<img src={dateBadgeIcon} alt="" width="17" height="17" />
						<time dateTime={currentDate}>{new Intl.DateTimeFormat('pt-BR').format(new Date(`${currentDate}T12:00:00`))}</time>
					</div>
				</section>

				{error && <p role="alert" className="rounded-control border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
				{notice && <p role="status" className="rounded-control border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>}

				<section aria-label="Dados do certificado e treinamentos" className="grid items-start gap-6 xl:grid-cols-[minmax(360px,460px)_minmax(0,1fr)]">
					<Card className="gap-6 p-5 sm:p-6">
						<CardHeader>
							<CardTitle>Dados do certificado</CardTitle>
							<CardDescription>Selecione a pessoa e o treinamento realizado.</CardDescription>
						</CardHeader>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<label htmlFor="certificate-employee" className="text-[13px] font-semibold text-text-primary">Colaborador</label>
								<Select id="certificate-employee" value={selectedEmployeeId ? String(selectedEmployeeId) : ''} onChange={(event) => changeEmployee(event.target.value)} disabled={isLoading || data.colaboradores.length === 0}>
									<option value="" disabled>Selecione um colaborador</option>
									{data.colaboradores.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
								</Select>
							</div>
							<div className="flex flex-col gap-2">
								<label htmlFor="certificate-role" className="text-[13px] font-semibold text-text-primary">Função</label>
								<div className="relative">
									<Input id="certificate-role" value={employee?.funcao ?? ''} readOnly placeholder="Selecione um colaborador" className="bg-surface-muted pr-11 text-text-secondary" />
										<img src={lockIcon} alt="" width="18" height="18" className="absolute right-3 top-1/2 -translate-y-1/2" />
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<label htmlFor="certificate-cpf" className="text-[13px] font-semibold text-text-primary">CPF</label>
								<div className="relative">
									<Input id="certificate-cpf" value={employee ? formatCpf(employee.cpf) : ''} readOnly placeholder="000.000.000-00" className="bg-surface-muted pr-11 text-text-secondary" />
										<img src={lockIcon} alt="" width="18" height="18" className="absolute right-3 top-1/2 -translate-y-1/2" />
								</div>
								<p className="text-xs leading-[1.5] text-text-secondary">Dados do cadastro. Use Editar dados para alterá-los.</p>
							</div>
							{employee && pendingTrainings.length > 0 && (
								<div role="status" className="flex flex-col gap-2 rounded-control border border-status-warning-text/30 bg-status-warning p-3 text-status-warning-text">
									<p className="text-[13px] font-semibold">Treinamentos pendentes para a função {employee.funcao}</p>
									<ul className="flex flex-col gap-1">
										{pendingTrainings.map(({ obrigatorio, situacao }) => {
											const name = obrigatorio.nr_codigo ?? obrigatorio.nome
											const training = trainings.find((item) => item.nr === obrigatorio.nr_codigo && item.disponivel && !isBlocked(item.nr))
											const label = <><span className="font-semibold">{name}</span> › {ROTULO_SITUACAO[situacao]}{obrigatorio.nr_codigo === 'NR-35' && isBlocked('NR-35') && ' (colaborador inapto para trabalho em altura)'}</>
											return (
												<li key={obrigatorio.id} className="text-xs">
													{training
														? <button type="button" className="text-left underline-offset-2 hover:underline" title={`Selecionar ${name}`} onClick={() => { setSelectedNr(training.nr); setConfirmed(false) }}>{label}</button>
														: <span title={obrigatorio.nr_codigo ? 'Certificado desta NR ainda não é emitido pelo sistema' : undefined}>{label}</span>}
												</li>
											)
										})}
									</ul>
								</div>
							)}
							<fieldset className="flex flex-col gap-2" disabled={isLoading}>
								<legend className="mb-2 text-[13px] font-semibold text-text-primary">Tipo de treinamento</legend>
								<div className="grid grid-cols-2 gap-1.5 rounded-control border border-border bg-surface-muted p-1.5 sm:grid-cols-4">
									{trainings.map((item) => {
										const isSelected = item.nr === selectedNr
										const blocked = isBlocked(item.nr)
										return <button key={item.nr} type="button" aria-pressed={isSelected} disabled={!item.disponivel || blocked} title={blocked ? 'Colaborador inapto para trabalho em altura' : item.disponivel ? undefined : 'Certificado ainda não disponível'} onClick={() => { setSelectedNr(item.nr); setConfirmed(false) }} className={`min-h-[38px] rounded-control px-2 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${isSelected ? 'bg-brand text-brand-on-primary' : 'bg-surface-card text-brand hover:bg-surface-success'}`}>
											{item.nr}
											{pendingNrs.has(item.nr) && <span aria-label="pendente" title="Pendente para a função" className="ml-1 inline-block size-1.5 rounded-full bg-status-warning-text align-middle" />}
										</button>
									})}
								</div>
								{selectedTraining && <p className="text-xs leading-[1.5] text-text-secondary">{trainingName(selectedTraining)}</p>}
								{isBlocked('NR-35') && <p role="alert" className="text-xs font-medium leading-[1.5] text-status-danger-text">Colaborador marcado como inapto para trabalho em altura: o certificado de NR-35 não pode ser emitido.</p>}
							</fieldset>
							<div className="flex flex-col gap-2">
								<label htmlFor="certificate-date" className="text-[13px] font-semibold text-text-primary">Data do treinamento</label>
								<Input id="certificate-date" type="date" value={trainingDate} max={currentDate} onChange={(event) => { setTrainingDate(event.target.value); setConfirmed(false) }} required />
							</div>
						</div>

						<div className="border-t border-border pt-4">
							<div className="flex flex-wrap gap-3">
								<Button type="button" disabled={!employee || !canIssue || !trainingDate || confirmed} onClick={() => { setConfirmed(true); setNotice('Dados conferidos. Você já pode registrar o certificado.') }} icon={<img src={confirmIcon} alt="" width="18" height="18" />}>{confirmed ? 'Dados confirmados' : 'Confirmar'}</Button>
								<Button type="button" variant="secondary" onClick={() => window.location.assign('/colaboradores')} icon={<img src={editIcon} alt="" width="18" height="18" />}>Editar dados</Button>
							</div>
							<p className="mt-4 text-xs leading-[1.5] text-text-secondary">Confira o nome, o treinamento e a data antes de gerar o certificado.</p>
						</div>
					</Card>

					<div className="flex min-w-0 flex-col gap-6">
						<Card className="gap-5 p-5 sm:p-6">
							<CardHeader>
								<CardTitle>Treinamentos registrados</CardTitle>
								<CardDescription>Certificados vinculados ao colaborador e à função {employee ? `• ${employee.funcao}` : ''}</CardDescription>
							</CardHeader>
							{employee && <div className="flex flex-wrap items-center gap-4 rounded-control bg-surface-muted p-4 sm:p-[18px]">
								<Avatar size="lg" aria-label={employee.nome}>{initials(employee.nome)}</Avatar>
								<div className="min-w-0 flex-1">
									<p className="truncate text-base font-semibold text-brand-deep">{employee.nome}</p>
									<p className="mt-1 text-xs text-text-secondary">CPF {formatCpf(employee.cpf)} • {employee.setor}</p>
								</div>
								<p className="text-xs text-text-secondary">{employeeRecords.length} {employeeRecords.length === 1 ? 'treinamento' : 'treinamentos'}</p>
							</div>}
							<div className="divide-y divide-border">
								{employeeRecords.map((record) => {
									const status: CertificateStatus = currentRecordIds.has(record.id)
										? dateStatus(record.data_vencimento)
										: { label: 'Reciclado', variant: 'neutral', icon: infoIcon }
									return <div key={record.id} className="flex min-h-[78px] flex-wrap items-center gap-3 py-3.5 sm:gap-[14px]">
										<span className="inline-flex size-11 shrink-0 items-center justify-center rounded-control bg-surface-muted"><img src={graduationIcon} alt="" width="24" height="24" /></span>
										<div className="min-w-0 flex-1">
											<p className="text-sm font-semibold text-brand-deep">{certificateName(record.certificado)}{record.tipo && <span className="ml-2 text-xs font-normal text-text-secondary">{record.tipo === 'inicial' ? 'Treinamento inicial' : 'Reciclagem'}</span>}</p>
											<p className="mt-1 text-xs text-text-secondary">Realizado em {formatDate(record.data_conclusao)} • {record.data_vencimento ? `Válido até ${formatDate(record.data_vencimento)}` : 'Sem vencimento definido'}{record.treinamento_id && ` • Treinamento nº ${record.treinamento_id}`}</p>
										</div>
										<Badge variant={status.variant}><img src={status.icon} alt="" width="14" height="14" />{status.label}</Badge>
										{record.url_certificado && <Button type="button" variant="secondary" className="px-3" disabled={downloadingId === record.id} onClick={() => void downloadCertificate(record)} icon={<Download className="size-[18px]" />}>{downloadingId === record.id ? 'Baixando...' : 'Baixar'}</Button>}
									</div>
								})}
								{!isLoading && employeeRecords.length === 0 && <p className="py-8 text-center text-sm text-text-secondary">Nenhum treinamento registrado para este colaborador.</p>}
								{isLoading && <p className="py-8 text-center text-sm text-text-secondary">Carregando treinamentos...</p>}
							</div>
							<p className="flex items-start gap-2 text-xs leading-[1.5] text-text-secondary"><img src={infoIcon} alt="" width="16" height="16" className="mt-0.5 shrink-0" />A vencer: próximos 30 dias. A situação é calculada com base na data de vencimento cadastrada.</p>
						</Card>

						<Card className="gap-[18px] p-5 sm:p-6">
							<div className="flex flex-wrap items-center justify-between gap-4">
								<div className="min-w-0 flex-1">
									<p className="text-base font-semibold text-brand-deep">{employee?.nome ?? 'Selecione um colaborador'}</p>
									<p className="mt-1 text-[13px] text-text-secondary">{employee?.funcao ?? 'A função será preenchida pelo cadastro'}</p>
								</div>
								<div className="flex flex-wrap gap-2">
									<Button type="button" title="Adicionar treinamento à fila" aria-label="Adicionar treinamento à fila" className="px-3" disabled={!canIssue || !trainingDate} onClick={queueSelectedCertificate} icon={<img src={addIcon} alt="" width="18" height="18" />} />
									<Button type="button" disabled={!employee || !canIssue || !confirmed || isSaving || isLoading} className="disabled:!border-brand disabled:!bg-brand disabled:!text-brand-on-primary disabled:opacity-60" onClick={() => void generateCertificates()} icon={<img src={certificateIcon} alt="" width="18" height="18" />}>{isSaving ? 'Gerando...' : 'Gerar certificado'}</Button>
								</div>
							</div>
							<div className="border-t border-border pt-4">
								{queuedCertificates.length > 0 ? <ul className="flex flex-col gap-2 text-xs text-text-secondary">
									{queuedCertificates.map((item) => <li key={item.nr} className="flex flex-wrap justify-between gap-2">
										<span>{trainingName(item.training)}</span><span>Data do treinamento: {formatDate(item.date)}</span>
									</li>)}
								</ul> : <div className="flex flex-wrap justify-between gap-2 text-xs text-text-secondary">
									<span>{trainingName(selectedTraining)}</span>
									<span>Data do treinamento: {trainingDate ? formatDate(trainingDate) : '—'}</span>
								</div>}
							</div>
						</Card>
					</div>
				</section>
			</main>
		</div>
	)
}
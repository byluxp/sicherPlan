import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
	CalendarDays,
	Check,
	CircleAlert,
	Clock3,
	Ear,
	FileUp,
	Footprints,
	Glasses,
	Hand,
	HardHat,
	Search,
	Shield,
	Upload,
	type LucideIcon,
} from 'lucide-react'
import Papa from 'papaparse'
import readXlsxFile from 'read-excel-file/browser'
import AppHeader from '../../components/header/app-header'
import Badge, { type BadgeVariant } from '../../components/ui/badge'
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

type Epi = {
	id: number
	name: string
	type: string
	caNumber: string
	expiresOn: string
}

type EpiForm = Omit<Epi, 'id'>
type EpiStatus = 'valid' | 'expiring' | 'expired'

const referenceTimestamp = Date.UTC(2026, 9, 3)
const thirtyDays = 30 * 24 * 60 * 60 * 1000

const epiTypes = [
	'Proteção da cabeça',
	'Proteção dos olhos',
	'Proteção auditiva',
	'Proteção das mãos',
	'Proteção dos pés',
	'Proteção respiratória',
]

const initialEpis: Epi[] = [
	{ id: 1, name: 'Capacete de segurança', type: 'Proteção da cabeça', caNumber: '12345', expiresOn: '2028-08-15' },
	{ id: 2, name: 'Óculos de proteção', type: 'Proteção dos olhos', caNumber: '23456', expiresOn: '2028-06-20' },
	{ id: 3, name: 'Protetor auricular', type: 'Proteção auditiva', caNumber: '34567', expiresOn: '2026-10-18' },
	{ id: 4, name: 'Luva de segurança', type: 'Proteção das mãos', caNumber: '45678', expiresOn: '2026-09-25' },
	{ id: 5, name: 'Botina de segurança', type: 'Proteção dos pés', caNumber: '56789', expiresOn: '2027-12-10' },
	{ id: 6, name: 'Respirador PFF2', type: 'Proteção respiratória', caNumber: '67890', expiresOn: '2026-10-28' },
]

const iconByType: Record<string, LucideIcon> = {
	'Proteção da cabeça': HardHat,
	'Proteção dos olhos': Glasses,
	'Proteção auditiva': Ear,
	'Proteção das mãos': Hand,
	'Proteção dos pés': Footprints,
	'Proteção respiratória': Shield,
}

const statusDetails: Record<EpiStatus, { label: string; variant: BadgeVariant; icon: LucideIcon }> = {
	valid: { label: 'Válido', variant: 'success', icon: Check },
	expiring: { label: 'Vencendo', variant: 'warning', icon: Clock3 },
	expired: { label: 'Vencido', variant: 'danger', icon: CircleAlert },
}

const emptyForm: EpiForm = { name: '', type: epiTypes[0], caNumber: '', expiresOn: '' }

function getStatus(expiresOn: string): EpiStatus {
	const expiresAt = new Date(`${expiresOn}T00:00:00.000Z`).getTime()
	if (expiresAt < referenceTimestamp) return 'expired'
	if (expiresAt <= referenceTimestamp + thirtyDays) return 'expiring'
	return 'valid'
}

function formatDate(date: string) {
	return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${date}T00:00:00.000Z`))
}

function normalizeHeader(value: unknown) {
	return String(value ?? '')
		.trim()
		.toLocaleLowerCase('pt-BR')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
}

function toIsoDate(value: unknown) {
	if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10)
	const text = String(value ?? '').trim()
	const brDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
	if (brDate) return `${brDate[3]}-${brDate[2].padStart(2, '0')}-${brDate[1].padStart(2, '0')}`
	if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
	return ''
}

function parseCsv(file: File) {
	return new Promise<unknown[][]>((resolve, reject) => {
		Papa.parse<unknown[]>(file, {
			skipEmptyLines: 'greedy',
			complete: (result) => resolve(result.data),
			error: reject,
		})
	})
}

async function readImportFile(file: File) {
	if (file.name.toLocaleLowerCase('pt-BR').endsWith('.csv')) return parseCsv(file)
	const [firstSheet] = await readXlsxFile(file)
	return firstSheet?.data ?? []
}

function rowsToEpis(rows: unknown[][], startingId: number): Epi[] {
	if (rows.length < 2) throw new Error('A planilha não contém linhas para importar.')

	const headers = rows[0].map(normalizeHeader)
	const nameIndex = headers.findIndex((header) => header.includes('nome') || header.includes('equipamento'))
	const typeIndex = headers.findIndex((header) => header.includes('tipo'))
	const expiryIndex = headers.findIndex((header) => header.includes('validade') || header.includes('vencimento'))
	const caIndex = headers.findIndex((header) => header === 'ca' || header.includes('numero do ca') || header.includes('codigo ca'))
	if (nameIndex < 0 || typeIndex < 0 || expiryIndex < 0) {
		throw new Error('Inclua colunas de nome do EPI, tipo e validade do CA.')
	}

	const imported = rows.slice(1).flatMap((row, index) => {
		const name = String(row[nameIndex] ?? '').trim()
		const type = String(row[typeIndex] ?? '').trim()
		const expiresOn = toIsoDate(row[expiryIndex])
		if (!name || !type || !expiresOn) return []
		return [{
			id: startingId + index,
			name,
			type,
			caNumber: caIndex < 0 ? '' : String(row[caIndex] ?? '').trim(),
			expiresOn,
		}]
	})
	if (imported.length === 0) throw new Error('Nenhuma linha válida encontrada para importar.')
	return imported
}

export default function EpiPage() {
	const [epis, setEpis] = useState(initialEpis)
	const [form, setForm] = useState(emptyForm)
	const [searchTerm, setSearchTerm] = useState('')
	const [importMessage, setImportMessage] = useState('')
	const [isImporting, setIsImporting] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		document.title = 'EPIs | sicherPlan'
	}, [])

	const statusCounts = epis.reduce<Record<EpiStatus, number>>((counts, epi) => {
		counts[getStatus(epi.expiresOn)] += 1
		return counts
	}, { valid: 0, expiring: 0, expired: 0 })
	const normalizedSearch = searchTerm.trim().toLocaleLowerCase('pt-BR')
	const visibleEpis = epis.filter((epi) =>
		`${epi.name} ${epi.type} ${epi.caNumber}`.toLocaleLowerCase('pt-BR').includes(normalizedSearch),
	)

	function handleSave(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const name = form.name.trim()
		if (!name || !form.type || !form.expiresOn) return
		setEpis((current) => [
			...current,
			{ ...form, id: Date.now(), name },
		])
		setForm(emptyForm)
	}

	async function handleImport(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0]
		if (!file) return
		setImportMessage('')
		if (file.size > 10 * 1024 * 1024) {
			setImportMessage('O arquivo ultrapassa o limite de 10 MB.')
			event.target.value = ''
			return
		}
		if (!/\.(csv|xlsx)$/i.test(file.name)) {
			setImportMessage('Selecione um arquivo CSV ou XLSX.')
			event.target.value = ''
			return
		}

		setIsImporting(true)
		try {
			const rows = await readImportFile(file)
			const imported = rowsToEpis(rows, Date.now())
			setEpis((current) => [...current, ...imported])
			setImportMessage(`${imported.length} ${imported.length === 1 ? 'EPI importado' : 'EPIs importados'} com sucesso.`)
		} catch (error) {
			setImportMessage(error instanceof Error ? error.message : 'Não foi possível ler o arquivo.')
		} finally {
			setIsImporting(false)
			event.target.value = ''
		}
	}

	return (
		<div className="min-h-screen bg-surface-page font-sans text-text-primary">
			<AppHeader activePage="epi" />
			<main className="mx-auto flex w-full max-w-[1536px] flex-col gap-7 px-4 pb-8 pt-6 sm:px-6 lg:px-8 xl:px-12">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<Shield aria-hidden="true" className="size-[22px] text-brand" />
						<span className="text-[17px] text-brand">sicherPlan</span>
						<span className="text-[11px] text-text-secondary">GESTÃO DE SST</span>
					</div>
					<p className="text-xs text-text-secondary">Napoli Engenharia</p>
				</div>

				<section className="flex flex-wrap items-center justify-between gap-4" aria-labelledby="epi-title">
					<div className="flex flex-col gap-2">
						<h1 id="epi-title" className="text-[26px] font-bold leading-tight text-brand-deep sm:text-[32px]">
							Equipamentos de proteção
						</h1>
						<p className="text-sm leading-[1.45] text-text-secondary">
							Mantenha os EPIs cadastrados e acompanhe a validade dos certificados de aprovação.
						</p>
					</div>
					<div className="inline-flex items-center gap-2 rounded-control bg-surface-muted p-3 text-xs text-brand-deep">
						<CalendarDays aria-hidden="true" className="size-[17px]" />
						<time dateTime={new Date().toISOString().slice(0, 10)}>{new Date().toLocaleDateString('pt-BR')}</time>
					</div>
				</section>

				<section aria-label="Cadastro e catálogo de EPIs" className="grid items-start gap-6 xl:grid-cols-[minmax(300px,420px)_minmax(0,1fr)]">
					<Card className="gap-6 p-5 sm:p-6">
						<CardHeader>
							<CardTitle>Cadastrar EPI</CardTitle>
							<CardDescription>Informe os dados do equipamento e do CA.</CardDescription>
						</CardHeader>

						<form className="flex w-full flex-col gap-4" onSubmit={handleSave}>
							<div className="flex flex-col gap-2">
								<label htmlFor="epi-name" className="text-[13px] font-semibold text-text-primary">Nome do EPI</label>
								<Input
									id="epi-name"
									value={form.name}
									onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
									placeholder="Ex.: Capacete com jugular"
									required
								/>
							</div>

							<div className="flex flex-col gap-2">
								<label htmlFor="epi-ca" className="text-[13px] font-semibold text-text-primary"> CA do EPI </label>
								<Input
									id="epi-ca"
									value={form.caNumber}
									onChange={(event) => setForm ((current) => ({...current, caNumber: event.target.value}))}
									placeholder="Ex.: 23456"
									required
								/>
							</div>

							<div className="flex flex-col gap-2">
								<label htmlFor="epi-type" className="text-[13px] font-semibold text-text-primary">Tipo</label>
								<Select
									id="epi-type"
									value={form.type}
									onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
								>
									{epiTypes.map((type) => <option key={type} value={type}>{type}</option>)}
								</Select>
							</div>

							<div className="flex flex-col gap-2">
								<label htmlFor="validade-ca" className="text-[13px] font-semibold text-text-primary">Validade do CA</label>
								<Input
									id="validade-ca"
									type="date"
									min={new Date().toISOString().slice(0, 10)}
									value={form.expiresOn}
									onChange={(event) => setForm((current) => ({ ...current, expiresOn: event.target.value }))}
									required
								/>
								<p className="text-xs text-text-secondary">Data de validade do Certificado de Aprovação.</p>
							</div>

							<div>
								<Button type="submit" icon={<Check className="size-[18px]" />}>Salvar EPI</Button>
							</div>
						</form>

						<div className="flex w-full items-center gap-3 text-xs text-text-secondary" aria-hidden="true">
							<span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" />
						</div>

						<div className="flex w-full flex-col items-center gap-3 rounded-control border border-dashed border-border bg-surface-input p-5 text-center sm:p-6">
							<Upload aria-hidden="true" className="size-7 text-brand" />
							<input
								ref={fileInputRef}
								id="epi-import"
								type="file"
								accept=".csv,.xlsx"
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
								{isImporting ? 'Importando...' : 'Importar arquivo'}
							</Button>
							<p className="text-xs text-text-secondary">CSV ou XLSX • até 10 MB</p>
							<p className="text-xs leading-[1.5] text-text-secondary">Inclua nome do EPI, tipo, validade do CA e número do CA.</p>
							{importMessage && <p role="status" className="text-xs font-medium text-brand">{importMessage}</p>}
						</div>
					</Card>

					<Card className="min-w-0 gap-6 p-5 sm:p-6">
						<CardHeader>
							<CardTitle>EPIs cadastrados</CardTitle>
							<CardDescription>
								{epis.length} equipamentos • {statusCounts.valid} válidos, {statusCounts.expiring} vencendo e {statusCounts.expired} {statusCounts.expired === 1 ? 'vencido' : 'vencidos'}
							</CardDescription>
						</CardHeader>

						<CardContent className="flex flex-col gap-4">
							<Input
								aria-label="Buscar pelo nome do EPI"
								placeholder="Buscar pelo nome do EPI"
								value={searchTerm}
								onChange={(event) => setSearchTerm(event.target.value)}
								startAdornment={<Search className="size-[18px] text-brand" />}
							/>

							<Table aria-label="EPIs cadastrados">
								<TableHeader>
									<TableRow className="border-0">
										<TableHead>Equipamento / tipo</TableHead>
										<TableHead className="w-[140px]">Validade do CA</TableHead>
										<TableHead className="w-[120px]">Situação</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{visibleEpis.map((epi) => {
										const Icon = iconByType[epi.type] ?? Shield
										const status = statusDetails[getStatus(epi.expiresOn)]
										const StatusIcon = status.icon
										return (
											<TableRow key={epi.id} className="h-[85px]">
												<TableCell>
													<div className="flex min-w-[240px] items-center gap-3">
														<span className="inline-flex size-[42px] shrink-0 items-center justify-center rounded-control bg-surface-muted text-brand">
															<Icon aria-hidden="true" className="size-[23px]" />
														</span>
														<div className="min-w-0">
															<p className="font-semibold text-brand-deep">{epi.name}</p>
															<p className="text-[11px] text-text-secondary">
																{epi.type}{epi.caNumber ? ` • CA ${epi.caNumber}` : ''}
															</p>
														</div>
													</div>
												</TableCell>
												<TableCell className="whitespace-nowrap">{formatDate(epi.expiresOn)}</TableCell>
												<TableCell>
													<Badge variant={status.variant} icon={<StatusIcon />}>
														{status.label}
													</Badge>
												</TableCell>
											</TableRow>
										)
									})}
									{visibleEpis.length === 0 && (
										<TableRow>
											<TableCell colSpan={3} className="py-8 text-center text-text-secondary">
												Nenhum EPI encontrado.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>

							<p className="text-xs leading-[1.45] text-text-secondary">Vencendo: CA com validade nos próximos 30 dias.</p>
						</CardContent>
					</Card>
				</section>
			</main>
		</div>
	)
}

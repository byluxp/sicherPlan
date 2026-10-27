import { useEffect, useState, type FormEvent } from 'react'
import { Boxes, Building2, CalendarDays, Check, Factory, Pencil, Plus, Save, ShieldCheck, Wrench, X } from 'lucide-react'
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
import { colaboradorService, type Colaborador } from '../../services/colaboradorService'
import {
	funcaosetorService,
	mensagemErroApi,
	nrsTreinamentoObrigatorio,
	type Funcao,
	type Setor,
} from '../../services/funcaosetorService'

const sectorIcons = [Factory, Wrench, Boxes, Building2]

export default function FunctionsSectorsPage() {
	const [sectors, setSectors] = useState<Setor[]>([])
	const [functions, setFunctions] = useState<Funcao[]>([])
	const [collaborators, setCollaborators] = useState<Colaborador[]>([])
	const [sectorName, setSectorName] = useState('')
	const [editingSector, setEditingSector] = useState<Setor | null>(null)
	const [functionName, setFunctionName] = useState('')
	const [selectedSectorId, setSelectedSectorId] = useState<number | ''>('')
	const [editingFunction, setEditingFunction] = useState<Funcao | null>(null)
	const [selectedNrs, setSelectedNrs] = useState<string[]>([])
	const [customTrainings, setCustomTrainings] = useState<string[]>([])
	const [isAddingCustom, setIsAddingCustom] = useState(false)
	const [customTrainingText, setCustomTrainingText] = useState('')
	const [isLoading, setIsLoading] = useState(true)
	const [isSavingSector, setIsSavingSector] = useState(false)
	const [isSavingFunction, setIsSavingFunction] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')

	useEffect(() => {
		document.title = 'Funções e setores | sicherPlan'
		let isMounted = true

		async function carregarDados() {
			try {
				const [setoresCarregados, funcoesCarregadas, colaboradoresCarregados] = await Promise.all([
					funcaosetorService.listarSetores(),
					funcaosetorService.listarFuncoes(),
					colaboradorService.listarTodos(),
				])
				if (!isMounted) return

				setSectors(setoresCarregados)
				setFunctions(funcoesCarregadas)
				setCollaborators(colaboradoresCarregados)
				setSelectedSectorId(setoresCarregados[0]?.id ?? '')
			} catch (error) {
				if (isMounted) {
					setErrorMessage(mensagemErroApi(error, 'Não foi possível carregar setores e funções.'))
				}
			} finally {
				if (isMounted) setIsLoading(false)
			}
		}

		void carregarDados()
		return () => {
			isMounted = false
		}
	}, [])

	async function handleSectorSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const name = sectorName.trim()
		if (!name) return
		const duplicate = sectors.some((sector) =>
			sector.nome.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR') && sector.id !== editingSector?.id,
		)
		if (duplicate) {
			setErrorMessage('Já existe um setor cadastrado com esse nome.')
			return
		}

		setErrorMessage('')
		setIsSavingSector(true)
		try {
			const dados = {
				nome: name,
				descricao: editingSector?.descricao ?? null,
				ativo: editingSector?.ativo ?? true,
			}
			if (editingSector) {
				const setorAtualizado = await funcaosetorService.atualizarSetor(editingSector.id, dados)
				setSectors((current) => current.map((sector) => sector.id === setorAtualizado.id ? setorAtualizado : sector))
			} else {
				const setorCriado = await funcaosetorService.criarSetor(dados)
				setSectors((current) => [...current, setorCriado])
				setSelectedSectorId(setorCriado.id)
			}
			setSectorName('')
			setEditingSector(null)
		} catch (error) {
			setErrorMessage(mensagemErroApi(error, 'Não foi possível salvar o setor.'))
		} finally {
			setIsSavingSector(false)
		}
	}

	function resetFunctionForm() {
		setEditingFunction(null)
		setFunctionName('')
		setSelectedNrs([])
		setCustomTrainings([])
		setIsAddingCustom(false)
		setCustomTrainingText('')
	}

	function toggleNr(nr: string) {
		setSelectedNrs((current) => current.includes(nr) ? current.filter((item) => item !== nr) : [...current, nr])
	}

	function addCustomTraining() {
		const typed = customTrainingText.trim().replace(/\s+/g, ' ')
		if (!typed) return
		// "NR 10" digitado no campo livre marca a opção da lista em vez de duplicá-la; outras NRs viram "NR-20"
		const nrCode = /^nr[\s-]*0*(\d{1,2})$/i.exec(typed)
		const training = nrCode ? `NR-${nrCode[1].padStart(2, '0')}` : typed
		if (nrsTreinamentoObrigatorio.includes(training)) {
			setSelectedNrs((current) => current.includes(training) ? current : [...current, training])
		} else if (!customTrainings.some((item) => item.toLocaleLowerCase('pt-BR') === training.toLocaleLowerCase('pt-BR'))) {
			setCustomTrainings((current) => [...current, training])
		}
		setCustomTrainingText('')
		setIsAddingCustom(false)
	}

	function startEditingFunction(job: Funcao) {
		setEditingFunction(job)
		setFunctionName(job.nome)
		setSelectedSectorId(job.setor_id)
		const codes = job.treinamentos_obrigatorios.map((training) => training.nr_codigo ?? training.nome)
		setSelectedNrs(codes.filter((code) => nrsTreinamentoObrigatorio.includes(code)))
		setCustomTrainings(codes.filter((code) => !nrsTreinamentoObrigatorio.includes(code)))
		setIsAddingCustom(false)
		setCustomTrainingText('')
		setErrorMessage('')
	}

	async function handleFunctionSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const name = functionName.trim()
		if (!name || selectedSectorId === '') return
		if (functions.some((job) => job.id !== editingFunction?.id && job.nome.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'))) {
			setErrorMessage('Já existe uma função cadastrada com esse nome.')
			return
		}

		setErrorMessage('')
		setIsSavingFunction(true)
		try {
			const dados = {
				nome: name,
				setor_id: selectedSectorId,
				descricao: editingFunction?.descricao ?? null,
				ativo: editingFunction?.ativo ?? true,
				treinamentos_obrigatorios: [...selectedNrs, ...customTrainings],
			}
			if (editingFunction) {
				const funcaoAtualizada = await funcaosetorService.atualizarFuncao(editingFunction.id, dados)
				setFunctions((current) => current.map((job) => job.id === funcaoAtualizada.id ? funcaoAtualizada : job))
			} else {
				const funcaoCriada = await funcaosetorService.criarFuncao(dados)
				setFunctions((current) => [...current, funcaoCriada])
			}
			resetFunctionForm()
		} catch (error) {
			setErrorMessage(mensagemErroApi(error, 'Não foi possível salvar a função.'))
		} finally {
			setIsSavingFunction(false)
		}
	}

	function startEditingSector(sector: Setor) {
		setEditingSector(sector)
		setSectorName(sector.nome)
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
				{isLoading && <p role="status" className="text-sm text-text-secondary">Carregando dados...</p>}
				{errorMessage && <p role="alert" className="rounded-control border border-border bg-surface-muted px-4 py-3 text-sm text-text-primary">{errorMessage}</p>}

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
								<Button type="submit" disabled={isLoading || isSavingSector} icon={<Save className="size-[18px]" />}>
									{isSavingSector ? 'Salvando...' : editingSector ? 'Atualizar setor' : 'Salvar setor'}
								</Button>
								{editingSector && (
									<Button type="button" variant="secondary" onClick={cancelEditingSector} disabled={isSavingSector}>
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
								{!isLoading && sectors.length === 0 && <p className="text-sm text-text-secondary">Nenhum setor cadastrado.</p>}
								{sectors.map((sector, index) => {
									const Icon = sectorIcons[index % sectorIcons.length]
									return (
										<div
											key={sector.id}
											className="flex min-w-0 items-center gap-3.5 rounded-control border border-border bg-surface-input p-3 sm:p-4"
										>
											<span className="inline-flex size-10 shrink-0 items-center justify-center rounded-control bg-surface-muted text-brand">
												<Icon aria-hidden="true" className="size-5" />
											</span>
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-semibold text-brand-deep">{sector.nome}</p>
												<p className="text-xs text-text-secondary">
													{collaborators.filter((collaborator) => collaborator.setor_id === sector.id).length} colaboradores
												</p>
											</div>
											<button
												type="button"
												aria-label={`Editar setor ${sector.nome}`}
												onClick={() => startEditingSector(sector)}
												disabled={isSavingSector}
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
							<CardTitle>{editingFunction ? 'Editar função' : 'Cadastrar função'}</CardTitle>
							<CardDescription>Cada função pertence a um setor previamente cadastrado e define os treinamentos exigidos de quem a ocupa.</CardDescription>
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
													value={selectedSectorId}
													onChange={(event) => setSelectedSectorId(event.target.value ? Number(event.target.value) : '')}
													disabled={isLoading || sectors.length === 0 || isSavingFunction}
													required
								>
														{sectors.length === 0 && <option value="">Cadastre um setor primeiro</option>}
														{sectors.map((sector) => (
															<option key={sector.id} value={sector.id}>{sector.nome}</option>
									))}
								</Select>
												<p className="text-xs text-text-secondary">Escolha um dos setores cadastrados abaixo.</p>
							</div>

							<div className="flex flex-wrap gap-2">
												{sectors.map((sector) => {
													const isSelected = selectedSectorId === sector.id
									return (
										<button
													key={sector.id}
											type="button"
											aria-pressed={isSelected}
														onClick={() => setSelectedSectorId(sector.id)}
														disabled={isSavingFunction}
											className={`inline-flex min-h-9 items-center gap-1.5 rounded-control border px-3 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${isSelected ? 'border-brand bg-surface-success text-brand-deep' : 'border-border bg-surface-input text-text-primary hover:bg-surface-muted'}`}
										>
											{isSelected && <Check aria-hidden="true" className="size-3.5" />}
														{sector.nome}
										</button>
									)
								})}
							</div>

							<fieldset className="flex flex-col gap-2" disabled={isSavingFunction}>
								<legend className="mb-2 text-[13px] font-semibold text-text-primary">Treinamentos obrigatórios</legend>
								<div className="flex flex-wrap gap-2">
									{nrsTreinamentoObrigatorio.map((nr) => {
										const isSelected = selectedNrs.includes(nr)
										return (
											<button
												key={nr}
												type="button"
												aria-pressed={isSelected}
												onClick={() => toggleNr(nr)}
												className={`inline-flex min-h-9 items-center gap-1.5 rounded-control border px-3 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${isSelected ? 'border-brand bg-surface-success text-brand-deep' : 'border-border bg-surface-input text-text-primary hover:bg-surface-muted'}`}
											>
												{isSelected && <Check aria-hidden="true" className="size-3.5" />}
												{nr}
											</button>
										)
									})}
									{customTrainings.map((training) => (
										<span key={training} className="inline-flex min-h-9 items-center gap-1.5 rounded-control border px-3 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand border-brand bg-surface-success text-brand-deep">
											<Check aria-hidden="true" className="size-3.5" />
											{training}
											<button
												type="button"
												aria-label={`Remover ${training}`}
												title="Remover"
												onClick={() => setCustomTrainings((current) => current.filter((item) => item !== training))}
												className="-mr-1 inline-flex size-5 items-center justify-center rounded-full hover:bg-surface-muted"
											>
												<X aria-hidden="true" className="size-3.5" />
											</button>
										</span>
									))}
									<button
										type="button"
										aria-label="Adicionar outro treinamento"
										title="Adicionar outro treinamento"
										aria-expanded={isAddingCustom}
										onClick={() => setIsAddingCustom((current) => !current)}
										className="inline-flex min-h-9 items-center gap-1.5 rounded-control border px-3 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand border-dashed border-brand bg-surface-input text-brand hover:bg-surface-muted"
									>
										<Plus aria-hidden="true" className="size-3.5" />
									</button>
								</div>
								{isAddingCustom && (
									<div className="flex flex-wrap items-center gap-2">
										<Input
											aria-label="Nome do treinamento"
											autoFocus
											value={customTrainingText}
											onChange={(event) => setCustomTrainingText(event.target.value)}
											onKeyDown={(event) => {
												// Enter adiciona o treinamento em vez de enviar o formulário da função
												if (event.key === 'Enter') { event.preventDefault(); addCustomTraining() }
												if (event.key === 'Escape') { setIsAddingCustom(false); setCustomTrainingText('') }
											}}
											placeholder="Ex.: Primeiros socorros, NR 20"
											maxLength={120}
											containerClassName="min-w-[220px] flex-1"
										/>
										<Button type="button" variant="secondary" disabled={!customTrainingText.trim()} onClick={addCustomTraining} icon={<Plus className="size-[18px]" />}>
											Adicionar
										</Button>
									</div>
								)}
								<p className="text-xs text-text-secondary">Selecione os treinamentos exigidos para esta função. Use o + para incluir outro treinamento.</p>
							</fieldset>

							<div className="flex flex-wrap gap-3">
								<Button type="submit" disabled={isLoading || isSavingFunction || sectors.length === 0} icon={<Save className="size-[18px]" />}>
									{isSavingFunction ? 'Salvando...' : editingFunction ? 'Atualizar função' : 'Salvar função'}
								</Button>
								{editingFunction && (
									<Button type="button" variant="secondary" onClick={resetFunctionForm} disabled={isSavingFunction}>
										Cancelar
									</Button>
								)}
							</div>
						</form>

						<div className="w-full border-t border-border pt-5">
							<div className="mb-4 flex items-center justify-between gap-3">
								<h2 className="text-sm font-semibold text-brand-deep">Funções cadastradas</h2>
											<span className="text-xs text-text-secondary">{functions.length} funções</span>
							</div>
							<CardContent>
												{!isLoading && functions.length === 0 && <p className="mb-3 text-sm text-text-secondary">Nenhuma função cadastrada.</p>}
								<Table aria-label="Funções cadastradas">
									<TableHeader>
										<TableRow className="border-0">
											<TableHead>Função</TableHead>
											<TableHead className="w-[155px]">Setor vinculado</TableHead>
											<TableHead>Treinamentos obrigatórios</TableHead>
											<TableHead className="w-[56px] text-right">Ações</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
														{functions.map((job) => (
															<TableRow key={job.id} className="h-[53px]">
																<TableCell>{job.nome}</TableCell>
																<TableCell className="text-xs text-text-secondary">{sectors.find((sector) => sector.id === job.setor_id)?.nome ?? 'Setor não encontrado'}</TableCell>
																<TableCell className="text-xs">
																	{job.treinamentos_obrigatorios.length > 0
																		? job.treinamentos_obrigatorios.map((training) => training.nr_codigo ?? training.nome).join(', ')
																		: <span className="text-text-secondary">Nenhum</span>}
																</TableCell>
																<TableCell>
																	<div className="flex justify-end">
																		<button
																			type="button"
																			title={`Editar ${job.nome}`}
																			aria-label={`Editar ${job.nome}`}
																			onClick={() => startEditingFunction(job)}
																			disabled={isSavingFunction}
																			className="inline-flex size-9 items-center justify-center rounded-control text-brand hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand"
																		>
																			<Pencil aria-hidden="true" className="size-4" />
																		</button>
																	</div>
																</TableCell>
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

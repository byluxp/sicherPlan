import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import CollaboratorsPage from './pages/colaboradores'
import CollaboratorDetailPage from './pages/colaboradores/detalhe'
import DashboardPage from './pages/dashboard'
import FunctionsSectorsPage from './pages/funcaosetor'
import EpiPage from './pages/epi'
import EpiSupplyPage from './pages/fornecerepi'
import GenerateCertificatePage from './pages/gerarcertificado'

const currentPath = window.location.pathname.replace(/\/$/, '')
const CurrentPage = currentPath === '/colaboradores'
  ? CollaboratorsPage
  : currentPath === '/colaboradores/detalhe'
    ? CollaboratorDetailPage
  : currentPath === '/funcoes-setores'
    ? FunctionsSectorsPage
    : currentPath === '/epis'
      ? EpiPage
      : currentPath === '/fornecer-epi'
        ? EpiSupplyPage
        : currentPath === '/gerar-certificado'
          ? GenerateCertificatePage
        : DashboardPage

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CurrentPage />
  </StrictMode>,
)

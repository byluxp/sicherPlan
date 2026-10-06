import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import CollaboratorsPage from './pages/colaboradores'
import DashboardPage from './pages/dashboard'
import FunctionsSectorsPage from './pages/funcaosetor'
import EpiPage from './pages/epi'
import EpiSupplyPage from './pages/fornecerepi'

const currentPath = window.location.pathname.replace(/\/$/, '')
const CurrentPage = currentPath === '/colaboradores'
  ? CollaboratorsPage
  : currentPath === '/funcoes-setores'
    ? FunctionsSectorsPage
    : currentPath === '/epis'
      ? EpiPage
      : currentPath === '/fornecer-epi'
        ? EpiSupplyPage
        : DashboardPage

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CurrentPage />
  </StrictMode>,
)

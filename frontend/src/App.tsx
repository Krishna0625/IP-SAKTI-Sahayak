import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { CreateInnovationPage } from './pages/CreateInnovationPage'
import { InnovationDetailPage } from './pages/InnovationDetailPage'
import { ClassificationPage } from './pages/ClassificationPage'
import { IpExplorerPage } from './pages/IpExplorerPage'
import { TkIntelligencePage } from './pages/TkIntelligencePage'
import { AbsAssessmentPage } from './pages/AbsAssessmentPage'
import { RegulatoryPage } from './pages/RegulatoryPage'
import { SahayakPage } from './pages/SahayakPage'
import { SourcesPage } from './pages/SourcesPage'
import { SettingsPage } from './pages/SettingsPage'
import { UpdatesPage } from './pages/UpdatesPage'
import { HelpPage } from './pages/HelpPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/innovation/new" element={<CreateInnovationPage />} />
        <Route path="/innovation/:id" element={<InnovationDetailPage />} />
        <Route path="/classification" element={<ClassificationPage />} />
        <Route path="/ip-explorer" element={<IpExplorerPage />} />
        <Route path="/tk-intelligence" element={<TkIntelligencePage />} />
        <Route path="/abs-assessment" element={<AbsAssessmentPage />} />
        <Route path="/regulatory" element={<RegulatoryPage />} />
        <Route path="/sahayak" element={<SahayakPage />} />
        <Route path="/sources" element={<SourcesPage />} />
        <Route path="/updates" element={<UpdatesPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

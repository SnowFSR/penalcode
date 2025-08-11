import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/app-layout'
import NotMatch from './pages/NotMatch'
import Penalcode from './pages/Penalcode'
import Caselaw from './pages/Caselaw'
import Amendments from './pages/Amendments'
import LegalConcepts from './pages/LegalConcepts'

export default function Router() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route path="" element={<Penalcode />} />
                <Route path="caselaw" element={<Caselaw />} />
                <Route path="amendments" element={<Amendments />} />
                <Route path="concepts" element={<LegalConcepts />} />
                <Route path="*" element={<NotMatch />} />
            </Route>
        </Routes>
    )
}

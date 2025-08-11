import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/app-layout'
import NotMatch from './pages/NotMatch'
import Penalcode from './pages/Penalcode'

export default function Router() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route path="" element={<Penalcode />} />
                <Route path="*" element={<NotMatch />} />
            </Route>
        </Routes>
    )
}

import { Navigate, Route, Routes } from 'react-router-dom'
import { EquipmentProvider } from './context/EquipmentContext'
import { Layout } from './components/Layout'
import { getSession, isAdminSession } from './services/auth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventario from './pages/Inventario'
import RegistrarEquipo from './pages/RegistrarEquipo'
import DetalleEquipo from './pages/DetalleEquipo'
import Asignaciones from './pages/Asignaciones'
import Historial from './pages/Historial'
import Configuracion from './pages/Configuracion'

function Protected({ children }: { children: React.ReactElement }) {
  return getSession() ? children : <Navigate to="/login" replace />
}

function AdminOnly({ children }: { children: React.ReactElement }) {
  return isAdminSession() ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <EquipmentProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Protected><Layout /></Protected>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/inventario/nuevo" element={<RegistrarEquipo />} />
          <Route path="/inventario/:id" element={<DetalleEquipo />} />
          <Route path="/asignaciones" element={<Asignaciones />} />
          <Route path="/historial" element={<Historial />} />
          <Route path="/configuracion" element={<AdminOnly><Configuracion /></AdminOnly>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </EquipmentProvider>
  )
}

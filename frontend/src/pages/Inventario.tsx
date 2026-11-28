import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Button } from '../components/Button'
import { EquipmentTable } from '../components/EquipmentTable'
import { useEquipment } from '../context/EquipmentContext'

export default function Inventario() {
  const { equipment, removeEquipment, loading, error, refresh } = useEquipment()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [actionError, setActionError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState(searchParams.get('estado') ?? 'Todos los estados')
  const [type, setType] = useState('Todos los tipos')

  const filtered = useMemo(() => equipment.filter((item) => {
    const initialQuery = searchParams.get('busqueda') ?? ''
    const matchesQuery = `${item.id} ${item.name} ${item.brand} ${item.model} ${item.employee}`
      .toLowerCase()
      .includes(`${initialQuery} ${query}`.toLowerCase().trim())
    const matchesStatus = status === 'Todos los estados' || item.status === status
    const matchesType = type === 'Todos los tipos' || item.type === type
    return matchesQuery && matchesStatus && matchesType
  }), [equipment, query, status, type, searchParams])

  const retireEquipment = async (id: string) => {
    const item = equipment.find((entry) => entry.id === id)
    if (!item || !window.confirm(`¿Dar de baja el equipo ${item.id}? Esta acción cambiará su estado y quedará registrada en el historial.`)) return
    setActionError('')
    try {
      await removeEquipment(id)
    } catch (actionError) {
      setActionError(actionError instanceof Error ? actionError.message : 'No fue posible dar de baja el equipo.')
    }
  }

  return (
    <section className="panel inventory-panel">
      {loading && <div className="table-footer"><span>Cargando inventario...</span></div>}
      {error && <div className="table-footer"><span>{error}</span><button className="link-button" onClick={() => void refresh()}>Reintentar</button></div>}
      {actionError && <div className="table-footer"><span role="alert">{actionError}</span><button className="link-button" onClick={() => setActionError('')}>Cerrar</button></div>}
      <div className="inventory-toolbar">
        <div className="table-search">
          <Icon name="search" size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por inventario, equipo o empleado" />
        </div>
        <div className="filters">
          <div className="select-wrap">
            <Icon name="filter" size={16} />
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Todos los estados</option><option>Activo</option><option>Disponible</option><option>Mantenimiento</option><option>Baja</option>
            </select>
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option>Todos los tipos</option><option>Laptop</option><option>Escritorio</option><option>Workstation</option><option>All-in-One</option>
          </select>
          <Button icon="plus" onClick={() => navigate('/inventario/nuevo')}>Agregar equipo</Button>
        </div>
      </div>
      <EquipmentTable
        equipment={filtered}
        showDetail={(item) => navigate(`/inventario/${item.id}`)}
        editItem={(item) => navigate(`/inventario/${item.id}?editar=1`)}
        deleteItem={retireEquipment}
      />
      <div className="table-footer">
        <span>Mostrando <strong>{filtered.length}</strong> de <strong>{equipment.length}</strong> equipos</span>
      </div>
    </section>
  )
}

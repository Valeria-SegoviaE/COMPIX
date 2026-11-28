import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Button } from '../components/Button'
import { EquipmentTable } from '../components/EquipmentTable'
import { useEquipment } from '../context/EquipmentContext'

export default function Inventario() {
  const { equipment, removeEquipment, loading, error, refresh } = useEquipment()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Todos los estados')
  const [type, setType] = useState('Todos los tipos')

  const filtered = useMemo(() => equipment.filter((item) => {
    const matchesQuery = `${item.id} ${item.name} ${item.brand} ${item.model} ${item.employee}`.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = status === 'Todos los estados' || item.status === status
    const matchesType = type === 'Todos los tipos' || item.type === type
    return matchesQuery && matchesStatus && matchesType
  }), [equipment, query, status, type])

  return (
    <section className="panel inventory-panel">
      {loading && <div className="table-footer"><span>Cargando inventario...</span></div>}
      {error && <div className="table-footer"><span>{error}</span><button className="link-button" onClick={() => void refresh()}>Reintentar</button></div>}
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
            <option>Todos los tipos</option><option>Laptop</option><option>Escritorio</option>
          </select>
          <Button icon="plus" onClick={() => navigate('/inventario/nuevo')}>Agregar equipo</Button>
        </div>
      </div>
      <EquipmentTable equipment={filtered} showDetail={(item) => navigate(`/inventario/${item.id}`)} deleteItem={removeEquipment} />
      <div className="table-footer">
        <span>Mostrando <strong>{filtered.length}</strong> de <strong>{equipment.length}</strong> equipos</span>
        <div className="pagination">
          <button disabled>‹</button><button className="current">1</button><button>2</button><button>3</button><span>…</span><button>25</button><button>›</button>
        </div>
      </div>
    </section>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Button } from '../components/Button'
import { getTimeline } from '../services/equipmentService'
import { exportCsv } from '../services/export'
import type { TimelineEvent } from '../types'

export default function Historial() {
  const navigate = useNavigate()
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [query, setQuery] = useState('')
  const [movementType, setMovementType] = useState('Todos los movimientos')
  const [period, setPeriod] = useState('Últimos 30 días')
  const [visibleCount, setVisibleCount] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTimeline = async () => {
    setLoading(true)
    setError('')
    try {
      setTimeline(await getTimeline())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar el historial.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadTimeline() }, [])

  const filteredTimeline = useMemo(() => {
    const now = Date.now()
    const periodDuration = period === 'Esta semana'
      ? 7 * 24 * 60 * 60 * 1000
      : period === 'Este año'
        ? 365 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return timeline.filter((item) => {
      const matchesQuery = `${item.equipment} ${item.type} ${item.title} ${item.description}`
        .toLocaleLowerCase()
        .includes(normalizedQuery)
      const type = item.type.toLocaleLowerCase()
      const matchesType = movementType === 'Todos los movimientos'
        || (movementType === 'Registros' && type.includes('registro'))
        || (movementType === 'Asignaciones' && (type.includes('asign') || type.includes('devolucion')))
        || (movementType === 'Cambios de estado' && !type.includes('registro') && !type.includes('asign') && !type.includes('devolucion'))
      const matchesPeriod = now - new Date(item.occurredAt).getTime() <= periodDuration
      return matchesQuery && matchesType && matchesPeriod
    })
  }, [timeline, query, movementType, period])

  const exportTimeline = () => exportCsv(
    'historial-compix.csv',
    ['Fecha', 'Hora', 'Equipo', 'Movimiento', 'Detalle'],
    filteredTimeline.map((item) => [item.date, item.time, item.equipment, item.type, item.description]),
  )

  return (
    <section className="panel history-panel">
      <div className="inventory-toolbar">
        <div className="table-search">
          <Icon name="search" size={18} />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(20) }} placeholder="Buscar por equipo o movimiento" />
        </div>
        <div className="filters">
          <select value={movementType} onChange={(event) => { setMovementType(event.target.value); setVisibleCount(20) }}>
            <option>Todos los movimientos</option><option>Registros</option><option>Asignaciones</option><option>Cambios de estado</option>
          </select>
          <select value={period} onChange={(event) => { setPeriod(event.target.value); setVisibleCount(20) }}>
            <option>Últimos 30 días</option><option>Esta semana</option><option>Este año</option>
          </select>
          <Button variant="secondary" icon="download" onClick={exportTimeline} disabled={filteredTimeline.length === 0}>Exportar</Button>
        </div>
      </div>
      {error && <div className="table-footer"><span role="alert">{error}</span><button className="link-button" onClick={() => void loadTimeline()}>Reintentar</button></div>}
      <div className="timeline">
        {filteredTimeline.slice(0, visibleCount).map((item) => (
          <div className="timeline-row" key={item.id}>
            <div className="timeline-date"><strong>{item.date}</strong><span>{item.time}</span></div>
            <div className={`timeline-marker ${item.color}`}><Icon name={item.icon} size={17} /></div>
            <div className="timeline-content">
              <div className="timeline-meta"><span>{item.type}</span><button onClick={() => navigate(`/inventario/${item.equipment}`)}>{item.equipment}</button></div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
        {!loading && !error && filteredTimeline.length === 0 && <div className="empty-state"><Icon name="history" size={28} /><strong>Sin movimientos</strong><span>No hay movimientos que coincidan con los filtros seleccionados.</span></div>}
        {loading && <div className="table-footer">Cargando historial...</div>}
      </div>
      {visibleCount < filteredTimeline.length && <div className="load-more"><button onClick={() => setVisibleCount((count) => count + 20)}>Cargar más movimientos</button></div>}
    </section>
  )
}

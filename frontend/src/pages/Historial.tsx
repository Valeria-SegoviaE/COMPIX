import { Icon } from '../components/Icon'
import { Button } from '../components/Button'
import { getTimeline } from '../services/equipmentService'

export default function Historial() {
  const timeline = getTimeline()

  return (
    <section className="panel history-panel">
      <div className="inventory-toolbar">
        <div className="table-search"><Icon name="search" size={18} /><input placeholder="Buscar por equipo o movimiento" /></div>
        <div className="filters">
          <select><option>Todos los movimientos</option><option>Registros</option><option>Asignaciones</option><option>Cambios de estado</option></select>
          <select><option>Últimos 30 días</option><option>Esta semana</option><option>Este año</option></select>
          <Button variant="secondary" icon="download">Exportar</Button>
        </div>
      </div>
      <div className="timeline">
        {timeline.map((item, i) => (
          <div className="timeline-row" key={`${item.equipment}-${i}`}>
            <div className="timeline-date"><strong>{item.date}</strong><span>{item.time}</span></div>
            <div className={`timeline-marker ${item.color}`}><Icon name={item.icon} size={17} /></div>
            <div className="timeline-content">
              <div className="timeline-meta"><span>{item.type}</span><button>{item.equipment}</button></div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="load-more"><button>Cargar más movimientos</button></div>
    </section>
  )
}

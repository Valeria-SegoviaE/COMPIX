import { Navigate, useNavigate, useParams } from 'react-router-dom'
import type { IconName } from '../types'
import { Icon } from '../components/Icon'
import { Button } from '../components/Button'
import { initials, statusClass } from '../components/EquipmentTable'
import { useEquipment } from '../context/EquipmentContext'

function Info({ label, value, icon }: { label: string; value: string; icon?: IconName }) {
  return (
    <div className={`info-item ${icon ? 'with-icon' : ''}`}>
      {icon && <span><Icon name={icon} size={18} /></span>}
      <div><small>{label}</small><strong>{value}</strong></div>
    </div>
  )
}

export default function DetalleEquipo() {
  const { id } = useParams()
  const { equipment } = useEquipment()
  const navigate = useNavigate()
  const item = equipment.find((e) => e.id === id)

  if (!item) return <Navigate to="/inventario" replace />

  return (
    <>
      <section className="detail-hero panel">
        <div className="device-illustration"><Icon name={item.type === 'Laptop' ? 'monitor' : 'cpu'} size={38} /></div>
        <div className="detail-title">
          <div><h2>{item.name}</h2><span>{item.id}</span></div>
          <span className={statusClass(item.status)}><i />{item.status}</span>
        </div>
        <div className="detail-actions">
          <Button variant="secondary" icon="edit">Editar información</Button>
          <Button icon="swap">Cambiar estado</Button>
        </div>
      </section>
      <div className="detail-grid">
        <section className="panel detail-info">
          <div className="panel-heading"><div><h2>Información del equipo</h2><p>Datos generales y especificaciones técnicas</p></div></div>
          <h3>Datos generales</h3>
          <div className="info-grid">
            <Info label="Número de inventario" value={item.id} />
            <Info label="Tipo de equipo" value={item.type} />
            <Info label="Marca" value={item.brand} />
            <Info label="Modelo" value={item.model} />
            <Info label="Número de serie" value={item.serial} />
            <Info label="Fecha de registro" value={item.date} />
          </div>
          <hr />
          <h3>Especificaciones técnicas</h3>
          <div className="spec-list">
            <Info label="Procesador" value={item.processor} icon="cpu" />
            <Info label="Memoria RAM" value={item.ram} icon="grid" />
            <Info label="Almacenamiento" value={item.storage} icon="archive" />
          </div>
          <hr />
          <h3>Observaciones</h3>
          <p className="notes">Equipo entregado con cargador original y mochila corporativa. Garantía vigente hasta mayo de 2027.</p>
        </section>
        <aside className="detail-side">
          <section className="panel assigned-card">
            <div className="panel-heading"><h2>Asignación actual</h2></div>
            <div className="assigned-person">
              <div className="avatar large">{initials(item.employee)}</div>
              <div><strong>{item.employee}</strong><span>{item.department}</span></div>
            </div>
            <div className="mini-info"><Icon name="calendar" /><div><span>Fecha de asignación</span><strong>20 de mayo de 2025</strong></div></div>
            <button className="link-button" onClick={() => navigate('/asignaciones')}>Ver detalle de asignación <Icon name="chevron" size={15} /></button>
          </section>
          <section className="panel state-card">
            <div className="panel-heading"><h2>Resumen de estado</h2></div>
            <div className="state-row"><span>Estado actual</span><span className={statusClass(item.status)}><i />{item.status}</span></div>
            <div className="state-row"><span>Última actualización</span><strong>Hoy, 09:42</strong></div>
            <div className="state-row"><span>Registrado por</span><strong>Carlos Gómez</strong></div>
          </section>
        </aside>
      </div>
    </>
  )
}

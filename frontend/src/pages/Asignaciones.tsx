import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Button } from '../components/Button'
import { initials } from '../components/EquipmentTable'
import { getAssignments } from '../services/equipmentService'

export default function Asignaciones() {
  const navigate = useNavigate()
  const assignments = getAssignments()

  return (
    <section className="panel inventory-panel">
      <div className="inventory-toolbar">
        <div className="table-search"><Icon name="search" size={18} /><input placeholder="Buscar empleado, departamento o equipo" /></div>
        <Button icon="plus">Nueva asignación</Button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>EMPLEADO</th><th>DEPARTAMENTO</th><th>EQUIPO ASIGNADO</th><th>FECHA DE ASIGNACIÓN</th><th>ESTADO</th><th>ACCIONES</th></tr>
          </thead>
          <tbody>
            {assignments.map((row) => (
              <tr key={row.equipmentId}>
                <td><div className="employee-cell"><span>{initials(row.employee)}</span><strong className="medium">{row.employee}</strong></div></td>
                <td>{row.department}</td>
                <td><strong className="medium">{row.equipmentName}</strong><small className="block">{row.equipmentId}</small></td>
                <td>{row.date}</td>
                <td><span className={row.status === 'Activa' ? 'badge badge-activo' : 'badge badge-mantenimiento'}><i />{row.status}</span></td>
                <td>
                  <div className="assignment-actions">
                    <button><Icon name="swap" size={15} /> Reasignar</button>
                    <button className="release">Liberar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>Mostrando <strong>{assignments.length}</strong> de <strong>196</strong> asignaciones</span>
        <button className="link-button" onClick={() => navigate('/inventario')}>Consultar equipos disponibles <Icon name="chevron" size={15} /></button>
      </div>
    </section>
  )
}

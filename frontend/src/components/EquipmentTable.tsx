import type { Equipment } from '../types'
import { Icon } from './Icon'

export const statusClass = (status: string) => `badge badge-${status.toLowerCase().replace(' ', '-')}`
export const initials = (name: string) => name.split(' ').map((x) => x[0]).slice(0, 2).join('')

interface Props {
  equipment: Equipment[]
  compact?: boolean
  showDetail: (item: Equipment) => void
  deleteItem?: (id: string) => void
}

export function EquipmentTable({ equipment, compact = false, showDetail, deleteItem }: Props) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>N.º DE INVENTARIO</th><th>EQUIPO</th><th>MARCA / MODELO</th>
            {!compact && <th>EMPLEADO ASIGNADO</th>}
            <th>ESTADO</th><th className="actions-head">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {equipment.map((item) => (
            <tr key={item.id}>
              <td><button className="inventory-id" onClick={() => showDetail(item)}>{item.id}</button></td>
              <td>
                <div className="equipment-cell">
                  <span className="equipment-icon"><Icon name={item.type === 'Laptop' ? 'monitor' : 'cpu'} size={18} /></span>
                  <div><strong>{item.name}</strong><small>{item.type}</small></div>
                </div>
              </td>
              <td><strong className="medium">{item.brand}</strong><small className="block">{item.model}</small></td>
              {!compact && (
                <td>
                  {item.employee === 'Sin asignar'
                    ? <span className="muted">{item.employee}</span>
                    : <div className="employee-cell"><span>{initials(item.employee)}</span>{item.employee}</div>}
                </td>
              )}
              <td><span className={statusClass(item.status)}><i />{item.status}</span></td>
              <td>
                <div className="row-actions">
                  <button title="Visualizar" onClick={() => showDetail(item)}><Icon name="eye" size={17} /></button>
                  <button title="Editar"><Icon name="edit" size={17} /></button>
                  {deleteItem && <button title="Eliminar" className="delete" onClick={() => deleteItem(item.id)}><Icon name="trash" size={17} /></button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {equipment.length === 0 && (
        <div className="empty-state">
          <Icon name="search" size={28} />
          <strong>No se encontraron equipos</strong>
          <span>Prueba con otros términos o filtros.</span>
        </div>
      )}
    </div>
  )
}

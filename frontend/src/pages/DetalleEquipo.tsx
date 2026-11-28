import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import type { EquipmentStatus, IconName } from '../types'
import { Icon } from '../components/Icon'
import { Button } from '../components/Button'
import { initials, statusClass } from '../components/EquipmentTable'
import { useEquipment } from '../context/EquipmentContext'
import { changeEquipmentStatus, typeToApi, updateEquipment } from '../services/equipmentService'

interface EditForm {
  inventoryCode: string
  serial: string
  type: string
  brand: string
  model: string
  processor: string
  ram: string
  storage: string
  operatingSystem: string
  acquisitionDate: string
  notes: string
}

type ApiEquipmentStatus = 'Activo' | 'En Mantenimiento' | 'Disponible' | 'Dado de Baja'

const statusToApi = (status: EquipmentStatus): ApiEquipmentStatus => {
  if (status === 'Mantenimiento') return 'En Mantenimiento'
  if (status === 'Baja') return 'Dado de Baja'
  return status
}

const statusToUi = (status: ApiEquipmentStatus): EquipmentStatus => {
  if (status === 'En Mantenimiento') return 'Mantenimiento'
  if (status === 'Dado de Baja') return 'Baja'
  return status
}

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
  const { equipment, loading, replaceEquipment } = useEquipment()
  const navigate = useNavigate()
  const item = equipment.find((e) => e.id === id)
  const [dialog, setDialog] = useState<'edit' | 'status' | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [nextStatus, setNextStatus] = useState<EquipmentStatus>('Disponible')
  const [editForm, setEditForm] = useState<EditForm>({
    inventoryCode: '',
    serial: '',
    type: 'Laptop',
    brand: '',
    model: '',
    processor: '',
    ram: '',
    storage: '',
    operatingSystem: '',
    acquisitionDate: '',
    notes: '',
  })

  const openEdit = () => {
    if (!item) return
    setEditForm({
      inventoryCode: item.id,
      serial: item.serial,
      type: item.type,
      brand: item.brand,
      model: item.model,
      processor: item.processor,
      ram: item.ram.replace(/\D/g, ''),
      storage: item.storage,
      operatingSystem: item.operatingSystem ?? '',
      acquisitionDate: item.acquisitionDate ?? '',
      notes: item.notes ?? '',
    })
    setError('')
    setNotice('')
    setDialog('edit')
  }

  const openStatus = () => {
    if (!item) return
    setNextStatus(item.status as EquipmentStatus)
    setError('')
    setNotice('')
    setDialog('status')
  }

  const saveEquipment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!item?.numericId) {
      setError('No se encontró el identificador del equipo para actualizarlo.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const updated = await updateEquipment(item.numericId, {
        numeroSerie: editForm.serial.trim(),
        codigoInventario: editForm.inventoryCode.trim(),
        tipoEquipo: typeToApi(editForm.type),
        marca: editForm.brand.trim(),
        modelo: editForm.model.trim(),
        procesador: editForm.processor.trim(),
        memoriaRamGb: Number(editForm.ram),
        almacenamiento: editForm.storage.trim(),
        sistemaOperativo: editForm.operatingSystem.trim() || undefined,
        fechaAdquisicion: editForm.acquisitionDate || undefined,
        notasGenerales: editForm.notes.trim() || undefined,
      })
      replaceEquipment(updated)
      setDialog(null)
      setNotice('La información del equipo se actualizó correctamente.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No fue posible actualizar el equipo.')
    } finally {
      setSaving(false)
    }
  }

  const saveStatus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!item?.numericId) {
      setError('No se encontró el identificador del equipo para actualizar su estado.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await changeEquipmentStatus(item.numericId, statusToApi(nextStatus))
      replaceEquipment({ ...item, status: statusToUi(statusToApi(nextStatus)) })
      setDialog(null)
      setNotice('El estado operativo se actualizó correctamente.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No fue posible cambiar el estado.')
    } finally {
      setSaving(false)
    }
  }

  if (!item && loading) return <section className="panel loading-panel">Cargando información del equipo...</section>
  if (!item) return <Navigate to="/inventario" replace />

  return (
    <>
      {notice && <div className="assignment-notice detail-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Cerrar aviso">×</button></div>}
      <section className="detail-hero panel">
        <div className="device-illustration"><Icon name={item.type === 'Laptop' ? 'monitor' : 'cpu'} size={38} /></div>
        <div className="detail-title">
          <div><h2>{item.name}</h2><span>{item.id}</span></div>
          <span className={statusClass(item.status)}><i />{item.status}</span>
        </div>
        <div className="detail-actions">
          <Button variant="secondary" icon="edit" onClick={openEdit}>Editar información</Button>
          <Button icon="swap" onClick={openStatus}>Cambiar estado</Button>
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
            <Info label="Fecha de adquisición" value={item.date || 'Sin fecha'} />
          </div>
          <hr />
          <h3>Especificaciones técnicas</h3>
          <div className="spec-list">
            <Info label="Procesador" value={item.processor} icon="cpu" />
            <Info label="Memoria RAM" value={item.ram} icon="grid" />
            <Info label="Almacenamiento" value={item.storage} icon="archive" />
            {item.operatingSystem && <Info label="Sistema operativo" value={item.operatingSystem} icon="monitor" />}
          </div>
          <hr />
          <h3>Observaciones</h3>
          <p className="notes">{item.notes || 'Sin observaciones registradas.'}</p>
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
      {dialog && (
        <div className="dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) setDialog(null)
        }}>
          <section className="assignment-dialog" role="dialog" aria-modal="true" aria-labelledby="equipment-dialog-title">
            <header className="assignment-dialog-header">
              <div className="assignment-dialog-icon"><Icon name={dialog === 'edit' ? 'edit' : 'swap'} size={20} /></div>
              <div>
                <h2 id="equipment-dialog-title">{dialog === 'edit' ? 'Editar información' : 'Cambiar estado'}</h2>
                <p>{item.id} · {item.name}</p>
              </div>
              <button className="dialog-close" type="button" onClick={() => setDialog(null)} disabled={saving} aria-label="Cerrar">×</button>
            </header>

            {dialog === 'edit' ? (
              <form onSubmit={saveEquipment}>
                <div className="assignment-dialog-body equipment-edit-grid">
                  <label className="field"><span>Número de inventario <b>*</b></span><input required maxLength={50} value={editForm.inventoryCode} onChange={(event) => setEditForm({ ...editForm, inventoryCode: event.target.value })} disabled={saving} /></label>
                  <label className="field"><span>Número de serie <b>*</b></span><input required maxLength={100} value={editForm.serial} onChange={(event) => setEditForm({ ...editForm, serial: event.target.value })} disabled={saving} /></label>
                  <label className="field"><span>Tipo de equipo <b>*</b></span><select required value={editForm.type} onChange={(event) => setEditForm({ ...editForm, type: event.target.value })} disabled={saving}><option>Laptop</option><option>Escritorio</option><option>Workstation</option><option>All-in-One</option></select></label>
                  <label className="field"><span>Marca <b>*</b></span><input required maxLength={50} value={editForm.brand} onChange={(event) => setEditForm({ ...editForm, brand: event.target.value })} disabled={saving} /></label>
                  <label className="field"><span>Modelo <b>*</b></span><input required maxLength={80} value={editForm.model} onChange={(event) => setEditForm({ ...editForm, model: event.target.value })} disabled={saving} /></label>
                  <label className="field"><span>Procesador <b>*</b></span><input required maxLength={100} value={editForm.processor} onChange={(event) => setEditForm({ ...editForm, processor: event.target.value })} disabled={saving} /></label>
                  <label className="field"><span>Memoria RAM (GB) <b>*</b></span><input required type="number" min={1} max={1024} value={editForm.ram} onChange={(event) => setEditForm({ ...editForm, ram: event.target.value })} disabled={saving} /></label>
                  <label className="field"><span>Almacenamiento <b>*</b></span><input required maxLength={80} value={editForm.storage} onChange={(event) => setEditForm({ ...editForm, storage: event.target.value })} disabled={saving} /></label>
                  <label className="field"><span>Sistema operativo</span><input maxLength={80} value={editForm.operatingSystem} onChange={(event) => setEditForm({ ...editForm, operatingSystem: event.target.value })} disabled={saving} /></label>
                  <label className="field"><span>Fecha de adquisición</span><input type="date" value={editForm.acquisitionDate} onChange={(event) => setEditForm({ ...editForm, acquisitionDate: event.target.value })} disabled={saving} /></label>
                  <label className="field equipment-edit-full"><span>Observaciones</span><textarea rows={3} value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} disabled={saving} /></label>
                  {error && <div className="login-error equipment-edit-full" role="alert">{error}</div>}
                </div>
                <footer className="assignment-dialog-footer">
                  <Button variant="secondary" onClick={() => setDialog(null)} disabled={saving}>Cancelar</Button>
                  <Button type="submit" icon="check" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
                </footer>
              </form>
            ) : (
              <form onSubmit={saveStatus}>
                <div className="assignment-dialog-body">
                  <label className="field">
                    <span>Estado operativo <b>*</b></span>
                    <select required value={nextStatus} onChange={(event) => setNextStatus(event.target.value as EquipmentStatus)} disabled={saving}>
                      <option value="Disponible">Disponible</option>
                      <option value="Activo">Activo</option>
                      <option value="Mantenimiento">En Mantenimiento</option>
                      <option value="Baja">Dado de Baja</option>
                    </select>
                  </label>
                  {error && <div className="login-error" role="alert">{error}</div>}
                </div>
                <footer className="assignment-dialog-footer">
                  <Button variant="secondary" onClick={() => setDialog(null)} disabled={saving}>Cancelar</Button>
                  <Button type="submit" icon="check" disabled={saving}>{saving ? 'Actualizando...' : 'Guardar estado'}</Button>
                </footer>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  )
}

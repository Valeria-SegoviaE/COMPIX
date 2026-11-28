import { useNavigate } from 'react-router-dom'
import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { Button } from '../components/Button'
import { initials } from '../components/EquipmentTable'
import { getAssignments, getInitialEquipment } from '../services/equipmentService'
import { apiRequest } from '../services/api'
import { useEquipment } from '../context/EquipmentContext'
import type { Equipment } from '../types'

interface EmployeeOption {
  idEmpleado: number
  nombreCompleto: string
  numeroNomina: string
  departamento?: string | null
  activo: boolean
}

export default function Asignaciones() {
  const navigate = useNavigate()
  const { refresh: refreshEquipment } = useEquipment()
  const [assignments, setAssignments] = useState<Awaited<ReturnType<typeof getAssignments>>>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [notice, setNotice] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [observations, setObservations] = useState('')

  useEffect(() => { void getAssignments().then(setAssignments) }, [])

  useEffect(() => {
    if (!dialogOpen) return

    let cancelled = false
    setLoadingOptions(true)
    setLoadError('')
    setSubmitError('')
    setEmployeeId('')
    setEquipmentId('')

    Promise.all([
      apiRequest<EmployeeOption[]>('/api/empleados'),
      getInitialEquipment(),
    ])
      .then(([employeeList, equipmentList]) => {
        if (cancelled) return
        setEmployees((employeeList ?? []).filter((employee) => employee.activo))
        setAvailableEquipment(equipmentList.filter((item) => item.status === 'Disponible'))
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'No fue posible cargar los datos.')
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false)
      })

    return () => { cancelled = true }
  }, [dialogOpen])

  useEffect(() => {
    if (!dialogOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) setDialogOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [dialogOpen, saving])

  const submitAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setSubmitError('')
    try {
      await apiRequest('/api/asignaciones/asignar', {
        method: 'POST',
        body: JSON.stringify({
          idEquipo: Number(equipmentId),
          idEmpleado: Number(employeeId),
          observacionesEntrega: observations.trim() || null,
        }),
      })
      await refreshEquipment()
      setDialogOpen(false)
      setNotice('La asignación se registró correctamente.')
      setObservations('')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No fue posible registrar la asignación.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel inventory-panel">
      {notice && <div className="assignment-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Cerrar aviso">×</button></div>}
      <div className="inventory-toolbar">
        <div className="table-search"><Icon name="search" size={18} /><input placeholder="Buscar empleado, departamento o equipo" /></div>
        <Button icon="plus" onClick={() => { setNotice(''); setDialogOpen(true) }}>Nueva asignación</Button>
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
      {dialogOpen && (
        <div className="dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) setDialogOpen(false)
        }}>
          <section className="assignment-dialog" role="dialog" aria-modal="true" aria-labelledby="assignment-dialog-title">
            <header className="assignment-dialog-header">
              <div className="assignment-dialog-icon"><Icon name="users" size={20} /></div>
              <div>
                <h2 id="assignment-dialog-title">Nueva asignación</h2>
                <p>Asigna un equipo disponible a un empleado activo.</p>
              </div>
              <button className="dialog-close" type="button" onClick={() => setDialogOpen(false)} disabled={saving} aria-label="Cerrar">×</button>
            </header>

            <form onSubmit={submitAssignment}>
              <div className="assignment-dialog-body">
                {loadError && <div className="login-error" role="alert">{loadError}</div>}
                <label className="field">
                  <span>Empleado <b>*</b></span>
                  <select required value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} disabled={loadingOptions || saving}>
                    <option value="">{loadingOptions ? 'Cargando empleados...' : 'Selecciona un empleado'}</option>
                    {employees.map((employee) => (
                      <option key={employee.idEmpleado} value={employee.idEmpleado}>
                        {employee.nombreCompleto} · {employee.numeroNomina}
                        {employee.departamento ? ` · ${employee.departamento}` : ''}
                      </option>
                    ))}
                  </select>
                  {!loadingOptions && employees.length === 0 && !loadError &&
                    <small className="assignment-help">No hay empleados activos disponibles.</small>}
                </label>

                <label className="field">
                  <span>Equipo disponible <b>*</b></span>
                  <select required value={equipmentId} onChange={(event) => setEquipmentId(event.target.value)} disabled={loadingOptions || saving}>
                    <option value="">{loadingOptions ? 'Cargando equipos...' : 'Selecciona un equipo'}</option>
                    {availableEquipment.map((item) => (
                      <option key={item.numericId} value={item.numericId}>
                        {item.id} · {item.type} {item.brand} {item.model} · {item.serial}
                      </option>
                    ))}
                  </select>
                  {!loadingOptions && availableEquipment.length === 0 && !loadError &&
                    <small className="assignment-help">No hay equipos con estado Disponible.</small>}
                </label>

                <label className="field">
                  <span>Observaciones de entrega <small>Opcional</small></span>
                  <textarea
                    rows={3}
                    maxLength={2000}
                    placeholder="Accesorios entregados, condición del equipo u otras notas..."
                    value={observations}
                    onChange={(event) => setObservations(event.target.value)}
                    disabled={saving}
                  />
                </label>
                {submitError && <div className="login-error" role="alert">{submitError}</div>}
              </div>

              <footer className="assignment-dialog-footer">
                <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" icon="check">
                  {saving ? 'Registrando...' : 'Confirmar asignación'}
                </Button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

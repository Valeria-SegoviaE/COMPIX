import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Button } from '../components/Button'
import { initials } from '../components/EquipmentTable'
import {
  createAssignment,
  getAssignments,
  getInitialEquipment,
  reassignEquipment,
  returnAssignment,
} from '../services/equipmentService'
import { apiRequest } from '../services/api'
import { useEquipment } from '../context/EquipmentContext'
import type { Assignment, Equipment } from '../types'

interface EmployeeOption {
  idEmpleado: number
  nombreCompleto: string
  numeroNomina: string
  departamento?: string | null
  activo: boolean
}

type DialogMode = 'assign' | 'reassign' | 'release'

export default function Asignaciones() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refresh: refreshEquipment } = useEquipment()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([])
  const [query, setQuery] = useState(searchParams.get('busqueda') ?? '')
  const [loadingAssignments, setLoadingAssignments] = useState(true)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [notice, setNotice] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [observations, setObservations] = useState('')

  const loadAssignments = async (): Promise<boolean> => {
    setLoadingAssignments(true)
    setLoadError('')
    try {
      setAssignments(await getAssignments())
      return true
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No fue posible cargar las asignaciones.')
      return false
    } finally {
      setLoadingAssignments(false)
    }
  }

  useEffect(() => { void loadAssignments() }, [])

  const filteredAssignments = useMemo(() => assignments.filter((row) =>
    `${row.employee} ${row.department} ${row.equipmentName} ${row.equipmentId} ${row.serial}`
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase()),
  ), [assignments, query])

  useEffect(() => {
    if (dialogMode !== 'assign' && dialogMode !== 'reassign') return

    let cancelled = false
    setLoadingOptions(true)
    setLoadError('')
    setSubmitError('')
    Promise.all([
      apiRequest<EmployeeOption[]>('/api/empleados'),
      dialogMode === 'assign' ? getInitialEquipment() : Promise.resolve([]),
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
  }, [dialogMode])

  useEffect(() => {
    if (!dialogMode) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) setDialogMode(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [dialogMode, saving])

  const openAssignDialog = () => {
    setNotice('')
    setSelectedAssignment(null)
    setEmployeeId('')
    setEquipmentId('')
    setObservations('')
    setDialogMode('assign')
  }

  const submitAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setSubmitError('')
    try {
      if (dialogMode === 'assign') {
        await createAssignment(Number(equipmentId), Number(employeeId), observations.trim())
      } else if (dialogMode === 'reassign' && selectedAssignment) {
        await reassignEquipment(selectedAssignment.equipmentNumericId, Number(employeeId), observations.trim())
      } else if (dialogMode === 'release' && selectedAssignment) {
        await returnAssignment(selectedAssignment.idAssignment, observations.trim())
      } else {
        throw new Error('No se pudo identificar la operación de asignación.')
      }

      const currentMode = dialogMode
      const refreshed = await loadAssignments()
      await refreshEquipment()
      setDialogMode(null)
      setSelectedAssignment(null)
      setObservations('')
      setNotice(!refreshed
        ? 'La operación se guardó, pero no se pudo actualizar la lista. Intenta recargarla.'
        : currentMode === 'assign'
          ? 'La asignación se registró correctamente.'
          : currentMode === 'reassign'
            ? 'El equipo se reasignó correctamente.'
            : 'El equipo se devolvió correctamente.')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No fue posible guardar la asignación.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel inventory-panel">
      {notice && <div className="assignment-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Cerrar aviso">×</button></div>}
      <div className="inventory-toolbar">
        <div className="table-search">
          <Icon name="search" size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar empleado, departamento o equipo" />
        </div>
        <Button icon="plus" onClick={openAssignDialog}>Nueva asignación</Button>
      </div>
      {loadError && <div className="table-footer"><span role="alert">{loadError}</span><button className="link-button" onClick={() => void loadAssignments()}>Reintentar</button></div>}
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>EMPLEADO</th><th>DEPARTAMENTO</th><th>EQUIPO ASIGNADO</th><th>FECHA DE ASIGNACIÓN</th><th>ESTADO</th><th>ACCIONES</th></tr>
          </thead>
          <tbody>
            {filteredAssignments.map((row) => (
              <tr key={row.idAssignment}>
                <td><div className="employee-cell"><span>{initials(row.employee)}</span><strong className="medium">{row.employee}</strong></div></td>
                <td>{row.department}</td>
                <td><strong className="medium">{row.equipmentName}</strong><small className="block">{row.equipmentId}</small></td>
                <td>{row.date}</td>
                <td><span className={row.status === 'Activa' ? 'badge badge-activo' : 'badge badge-mantenimiento'}><i />{row.status}</span></td>
                <td>
                  <div className="assignment-actions">
                    <button onClick={() => {
                      setSelectedAssignment(row)
                      setEmployeeId('')
                      setEquipmentId(String(row.equipmentNumericId))
                      setObservations('')
                      setDialogMode('reassign')
                    }}><Icon name="swap" size={15} /> Reasignar</button>
                    <button className="release" onClick={() => {
                      setSelectedAssignment(row)
                      setObservations('')
                      setSubmitError('')
                      setDialogMode('release')
                    }}>Liberar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loadingAssignments && filteredAssignments.length === 0 && <div className="empty-state"><Icon name="users" size={28} /><strong>Sin asignaciones</strong><span>No hay asignaciones que coincidan con la búsqueda.</span></div>}
      </div>
      <div className="table-footer">
        <span>{loadingAssignments ? 'Cargando asignaciones...' : <>Mostrando <strong>{filteredAssignments.length}</strong> de <strong>{assignments.length}</strong> asignaciones activas</>}</span>
        <button className="link-button" onClick={() => navigate('/inventario?estado=Disponible')}>Consultar equipos disponibles <Icon name="chevron" size={15} /></button>
      </div>
      {dialogMode && (
        <div className="dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) setDialogMode(null)
        }}>
          <section className="assignment-dialog" role="dialog" aria-modal="true" aria-labelledby="assignment-dialog-title">
            <header className="assignment-dialog-header">
              <div className="assignment-dialog-icon"><Icon name="users" size={20} /></div>
              <div>
                <h2 id="assignment-dialog-title">{dialogMode === 'assign' ? 'Nueva asignación' : dialogMode === 'reassign' ? 'Reasignar equipo' : 'Liberar equipo'}</h2>
                <p>{dialogMode === 'release' ? `Confirma la devolución de ${selectedAssignment?.equipmentId}.` : 'Asigna un equipo a un empleado activo.'}</p>
              </div>
              <button className="dialog-close" type="button" onClick={() => setDialogMode(null)} disabled={saving} aria-label="Cerrar">×</button>
            </header>

            <form onSubmit={submitAssignment}>
              <div className="assignment-dialog-body">
                {loadError && <div className="login-error" role="alert">{loadError}</div>}
                {(dialogMode === 'assign' || dialogMode === 'reassign') && <label className="field">
                  <span>Empleado <b>*</b></span>
                  <select required value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} disabled={loadingOptions || saving}>
                    <option value="">{loadingOptions ? 'Cargando empleados...' : 'Selecciona un empleado'}</option>
                    {employees.filter((employee) => dialogMode !== 'reassign' || employee.idEmpleado !== selectedAssignment?.employeeNumericId).map((employee) => (
                      <option key={employee.idEmpleado} value={employee.idEmpleado}>
                        {employee.nombreCompleto} · {employee.numeroNomina}
                        {employee.departamento ? ` · ${employee.departamento}` : ''}
                      </option>
                    ))}
                  </select>
                  {!loadingOptions && employees.length === 0 && !loadError && <small className="assignment-help">No hay empleados activos disponibles.</small>}
                </label>}

                {dialogMode === 'assign' && <label className="field">
                  <span>Equipo disponible <b>*</b></span>
                  <select required value={equipmentId} onChange={(event) => setEquipmentId(event.target.value)} disabled={loadingOptions || saving}>
                    <option value="">{loadingOptions ? 'Cargando equipos...' : 'Selecciona un equipo'}</option>
                    {availableEquipment.map((item) => (
                      <option key={item.numericId} value={item.numericId}>
                        {item.id} · {item.type} {item.brand} {item.model} · {item.serial}
                      </option>
                    ))}
                  </select>
                  {!loadingOptions && availableEquipment.length === 0 && !loadError && <small className="assignment-help">No hay equipos disponibles.</small>}
                </label>}

                <label className="field">
                  <span>{dialogMode === 'release' ? 'Observaciones de devolución' : 'Observaciones de entrega'} <small>Opcional</small></span>
                  <textarea rows={3} maxLength={2000} placeholder="Accesorios, condición del equipo u otras notas..." value={observations} onChange={(event) => setObservations(event.target.value)} disabled={saving} />
                </label>
                {submitError && <div className="login-error" role="alert">{submitError}</div>}
              </div>

              <footer className="assignment-dialog-footer">
                <Button variant="secondary" onClick={() => setDialogMode(null)} disabled={saving}>Cancelar</Button>
                <Button type="submit" icon="check" disabled={saving || loadingOptions}>
                  {saving ? 'Guardando...' : dialogMode === 'assign' ? 'Confirmar asignación' : dialogMode === 'reassign' ? 'Confirmar reasignación' : 'Confirmar devolución'}
                </Button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

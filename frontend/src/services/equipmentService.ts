import type { Assignment, Equipment, TimelineEvent } from '../types'
import { apiRequest } from './api'

interface EquipoApi {
  idEquipo: number
  numeroSerie: string
  codigoInventario: string
  tipoEquipo: string
  marca: string
  modelo: string
  procesador: string
  memoriaRamGb: number
  almacenamiento: string
  sistemaOperativo?: string
  estadoOperativo: string
  fechaAdquisicion?: string
  notasGenerales?: string
  idEmpleadoAsignado?: number
  empleadoAsignado?: string
  departamentoAsignado?: string
}

export interface EquipmentRequest {
  numeroSerie: string
  codigoInventario: string
  tipoEquipo: 'Laptop' | 'Desktop' | 'Workstation' | 'All-in-One'
  marca: string
  modelo: string
  procesador: string
  memoriaRamGb: number
  almacenamiento: string
  sistemaOperativo?: string
  fechaAdquisicion?: string
  notasGenerales?: string
}

const statusToUi = (status: string): Equipment['status'] => {
  if (status === 'En Mantenimiento') return 'Mantenimiento'
  if (status === 'Dado de Baja') return 'Baja'
  return status
}

const typeToUi = (type: string): string =>
  type === 'Desktop' ? 'Escritorio' : type

export const typeToApi = (type: string): EquipmentRequest['tipoEquipo'] => {
  if (type === 'Escritorio') return 'Desktop'
  if (type === 'Workstation' || type === 'All-in-One') return type
  return 'Laptop'
}

export function mapEquipo(equipo: EquipoApi): Equipment {
  const date = equipo.fechaAdquisicion
    ? new Date(`${equipo.fechaAdquisicion.slice(0, 10)}T00:00:00`).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : ''

  return {
    numericId: equipo.idEquipo,
    id: equipo.codigoInventario,
    name: `${typeToUi(equipo.tipoEquipo)} ${equipo.marca} ${equipo.modelo}`,
    type: typeToUi(equipo.tipoEquipo),
    brand: equipo.marca,
    model: equipo.modelo,
    serial: equipo.numeroSerie,
    employee: equipo.empleadoAsignado || 'Sin asignar',
    department: equipo.departamentoAsignado || '—',
    status: statusToUi(equipo.estadoOperativo),
    date,
    processor: equipo.procesador,
    ram: `${equipo.memoriaRamGb} GB`,
    storage: equipo.almacenamiento,
    operatingSystem: equipo.sistemaOperativo ?? '',
    acquisitionDate: equipo.fechaAdquisicion?.slice(0, 10) ?? '',
    notes: equipo.notasGenerales ?? '',
  }
}

export async function getInitialEquipment(): Promise<Equipment[]> {
  const equipos = await apiRequest<EquipoApi[]>('/api/equipos')
  return (equipos ?? []).map(mapEquipo)
}

export async function getEquipmentById(id: number): Promise<Equipment | null> {
  const equipo = await apiRequest<EquipoApi>(`/api/equipos/${id}`)
  return equipo ? mapEquipo(equipo) : null
}

export async function getEquipmentByCode(code: string): Promise<Equipment | null> {
  const equipo = await apiRequest<EquipoApi>(`/api/equipos/codigo/${encodeURIComponent(code)}`)
  return equipo ? mapEquipo(equipo) : null
}

export async function createEquipment(form: {
  id: string
  serial: string
  type: string
  brand: string
  model: string
  processor: string
  ram: string
  storage: string
  notes: string
}): Promise<Equipment> {
  const ramMatch = form.ram.match(/\d+/)
  const request: EquipmentRequest = {
    numeroSerie: form.serial,
    codigoInventario: form.id,
    tipoEquipo: typeToApi(form.type),
    marca: form.brand,
    modelo: form.model,
    procesador: form.processor,
    memoriaRamGb: ramMatch ? Number(ramMatch[0]) : 8,
    almacenamiento: form.storage,
    sistemaOperativo: 'Windows 11 Pro',
    notasGenerales: form.notes || undefined,
  }
  const created = await apiRequest<EquipoApi>('/api/equipos', {
    method: 'POST',
    body: JSON.stringify(request),
  })
  if (!created) throw new Error('El equipo no pudo ser registrado.')
  return mapEquipo(created)
}

export async function updateEquipment(id: number, request: EquipmentRequest): Promise<Equipment> {
  const updated = await apiRequest<EquipoApi>(`/api/equipos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  })
  if (!updated) throw new Error('El equipo no pudo ser actualizado.')
  return mapEquipo(updated)
}

export async function changeEquipmentStatus(
  id: number,
  status: 'Activo' | 'En Mantenimiento' | 'Disponible' | 'Dado de Baja',
) {
  await apiRequest<undefined>(`/api/equipos/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estadoOperativo: status }),
  })
}

export async function deleteEquipment(id: number): Promise<void> {
  await apiRequest<undefined>(`/api/equipos/${id}`, { method: 'DELETE' })
}

interface AssignmentApi {
  idAsignacion: number
  idEquipo: number
  codigoInventario: string
  numeroSerie: string
  marca: string
  modelo: string
  idEmpleado: number
  nombreEmpleado: string
  departamento?: string | null
  fechaAsignacion: string
  fechaDevolucion?: string | null
}

interface HistoryApi {
  idMovimiento: number
  idEquipo: number
  codigoInventario: string
  tipoMovimiento: string
  estadoAnterior?: string | null
  estadoNuevo?: string | null
  descripcionDetalle: string
  fechaMovimiento: string
  nombreUsuarioResponsable: string
}

interface EmployeeDepartmentApi {
  idEmpleado: number
  departamento?: string | null
}

const formatDate = (date: string) => new Date(date).toLocaleDateString('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export async function getAssignments(): Promise<Assignment[]> {
  const [rows, employees] = await Promise.all([
    apiRequest<AssignmentApi[]>('/api/asignaciones'),
    apiRequest<EmployeeDepartmentApi[]>('/api/empleados'),
  ])
  const departments = new Map((employees ?? []).map((employee) => [employee.idEmpleado, employee.departamento]))
  return (rows ?? []).map((row) => ({
    idAssignment: row.idAsignacion,
    equipmentNumericId: row.idEquipo,
    employeeNumericId: row.idEmpleado,
    employee: row.nombreEmpleado,
    department: row.departamento || departments.get(row.idEmpleado) || '—',
    equipmentName: `${row.marca} ${row.modelo}`,
    equipmentId: row.codigoInventario,
    serial: row.numeroSerie,
    date: formatDate(row.fechaAsignacion),
    status: row.fechaDevolucion ? 'Devuelta' : 'Activa',
  }))
}

export async function createAssignment(
  idEquipo: number,
  idEmpleado: number,
  observacionesEntrega?: string,
): Promise<void> {
  await apiRequest('/api/asignaciones/asignar', {
    method: 'POST',
    body: JSON.stringify({ idEquipo, idEmpleado, observacionesEntrega: observacionesEntrega || null }),
  })
}

export async function reassignEquipment(
  idEquipo: number,
  idEmpleadoNuevo: number,
  observacionesEntrega?: string,
): Promise<void> {
  await apiRequest('/api/asignaciones/reasignar', {
    method: 'POST',
    body: JSON.stringify({
      idEquipo,
      idEmpleadoNuevo,
      observacionesEntrega: observacionesEntrega || null,
    }),
  })
}

export async function returnAssignment(idAsignacion: number, observacionesDevolucion?: string): Promise<void> {
  await apiRequest(`/api/asignaciones/${idAsignacion}/devolver`, {
    method: 'PUT',
    body: JSON.stringify({ observacionesDevolucion: observacionesDevolucion || null }),
  })
}

export async function getTimeline(): Promise<TimelineEvent[]> {
  const rows = await apiRequest<HistoryApi[]>('/api/historial')
  return (rows ?? []).map((row) => {
    const type = row.tipoMovimiento
    const icon: TimelineEvent['icon'] = type.toLowerCase().includes('asign')
      ? 'users'
      : type.toLowerCase().includes('mantenimiento')
        ? 'tool'
        : type.toLowerCase().includes('registro')
          ? 'plus'
          : type.toLowerCase().includes('baja')
            ? 'archive'
            : 'edit'
    const movementDate = new Date(row.fechaMovimiento)
    return {
      id: row.idMovimiento,
      equipmentNumericId: row.idEquipo,
      occurredAt: movementDate.toISOString(),
      date: movementDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: movementDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      icon,
      color: icon === 'users' ? 'blue' : icon === 'tool' ? 'orange' : icon === 'plus' ? 'green' : 'purple',
      type,
      equipment: row.codigoInventario,
      responsible: row.nombreUsuarioResponsable,
      title: row.estadoAnterior || row.estadoNuevo
        ? `Estado: ${row.estadoAnterior || '—'} → ${row.estadoNuevo || '—'}`
        : type,
      description: row.descripcionDetalle,
    }
  })
}

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

// Endpoints for assignments and history are not exposed by the current backend.
export async function getAssignments(): Promise<Assignment[]> {
  return []
}

export async function getTimeline(): Promise<TimelineEvent[]> {
  return []
}

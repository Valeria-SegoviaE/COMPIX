export type IconName =
  | 'grid' | 'monitor' | 'users' | 'history' | 'settings' | 'search' | 'bell'
  | 'plus' | 'eye' | 'edit' | 'trash' | 'chevron' | 'cpu' | 'check' | 'tool'
  | 'archive' | 'download' | 'filter' | 'arrow-left' | 'calendar' | 'user'
  | 'building' | 'swap' | 'logout' | 'menu' | 'lock' | 'mail'

export type EquipmentStatus = 'Activo' | 'Disponible' | 'Mantenimiento' | 'Baja'

export interface Equipment {
  numericId?: number
  id: string
  name: string
  type: string
  brand: string
  model: string
  serial: string
  employee: string
  department: string
  status: EquipmentStatus | string
  date: string
  processor: string
  ram: string
  storage: string
  operatingSystem?: string
  acquisitionDate?: string
  notes?: string
}

export interface Assignment {
  idAssignment: number
  equipmentNumericId: number
  employeeNumericId: number
  employee: string
  department: string
  equipmentName: string
  equipmentId: string
  serial: string
  date: string
  status: string
}

export interface TimelineEvent {
  id: number
  equipmentNumericId: number
  occurredAt: string
  date: string
  time: string
  icon: IconName
  color: string
  type: string
  equipment: string
  responsible: string
  title: string
  description: string
}

export type IconName =
  | 'grid' | 'monitor' | 'users' | 'history' | 'settings' | 'search' | 'bell'
  | 'plus' | 'eye' | 'edit' | 'trash' | 'chevron' | 'cpu' | 'check' | 'tool'
  | 'archive' | 'download' | 'filter' | 'arrow-left' | 'calendar' | 'user'
  | 'building' | 'swap' | 'logout' | 'menu' | 'lock' | 'mail'

export type EquipmentStatus = 'Activo' | 'Disponible' | 'Mantenimiento' | 'Baja'

export interface Equipment {
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
}

export interface Assignment {
  employee: string
  department: string
  equipmentName: string
  equipmentId: string
  date: string
  status: string
}

export interface TimelineEvent {
  date: string
  time: string
  icon: IconName
  color: string
  type: string
  equipment: string
  title: string
  description: string
}

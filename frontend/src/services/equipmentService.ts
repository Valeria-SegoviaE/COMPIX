import type { Assignment, Equipment, TimelineEvent } from '../types'

// VSE: Datos de ejemplo. Cuando Julio tenga la API lista, solo hay que
// reemplazar el contenido de estas funciones por llamadas fetch/axios.
// Las páginas no cambian porque solo dependen de estas funciones.

const equipmentData: Equipment[] = [
  { id: 'CMP-2025-048', name: 'Laptop Dirección 03', type: 'Laptop', brand: 'Dell', model: 'Latitude 5450', serial: 'DL5K91P2', employee: 'Mariana Torres', department: 'Dirección', status: 'Activo', date: '18 Jun 2025', processor: 'Intel Core i7-1365U', ram: '16 GB DDR5', storage: 'SSD 512 GB' },
  { id: 'CMP-2025-047', name: 'Estación Diseño 06', type: 'Escritorio', brand: 'HP', model: 'Z2 G9 Tower', serial: 'HP92L4X8', employee: 'Diego Ramírez', department: 'Diseño', status: 'Activo', date: '17 Jun 2025', processor: 'Intel Core i7-13700', ram: '32 GB DDR5', storage: 'SSD 1 TB' },
  { id: 'CMP-2025-046', name: 'Laptop Ventas 12', type: 'Laptop', brand: 'Lenovo', model: 'ThinkPad E14', serial: 'LNV8C22M', employee: 'Paola Méndez', department: 'Ventas', status: 'Mantenimiento', date: '16 Jun 2025', processor: 'AMD Ryzen 7 7730U', ram: '16 GB DDR4', storage: 'SSD 512 GB' },
  { id: 'CMP-2025-045', name: 'PC Recepción 02', type: 'Escritorio', brand: 'Dell', model: 'OptiPlex 7010', serial: 'DL2F18Q9', employee: 'Sofía Vargas', department: 'Administración', status: 'Activo', date: '14 Jun 2025', processor: 'Intel Core i5-13500', ram: '16 GB DDR5', storage: 'SSD 512 GB' },
  { id: 'CMP-2025-044', name: 'Laptop Soporte 04', type: 'Laptop', brand: 'ASUS', model: 'ExpertBook B5', serial: 'AS7B55N1', employee: 'Sin asignar', department: '—', status: 'Disponible', date: '12 Jun 2025', processor: 'Intel Core i5-1335U', ram: '16 GB DDR5', storage: 'SSD 512 GB' },
  { id: 'CMP-2024-118', name: 'PC Contabilidad 05', type: 'Escritorio', brand: 'HP', model: 'ProDesk 400 G7', serial: 'HP3P80L2', employee: 'Sin asignar', department: 'Contabilidad', status: 'Baja', date: '08 Nov 2024', processor: 'Intel Core i5-10500', ram: '8 GB DDR4', storage: 'HDD 1 TB' },
]

const assignmentData: Assignment[] = [
  { employee: 'Mariana Torres', department: 'Dirección', equipmentName: 'Laptop Dirección 03', equipmentId: 'CMP-2025-048', date: '20 May 2025', status: 'Activa' },
  { employee: 'Diego Ramírez', department: 'Diseño', equipmentName: 'Estación Diseño 06', equipmentId: 'CMP-2025-047', date: '18 Jun 2025', status: 'Activa' },
  { employee: 'Paola Méndez', department: 'Ventas', equipmentName: 'Laptop Ventas 12', equipmentId: 'CMP-2025-046', date: '03 Feb 2025', status: 'En revisión' },
  { employee: 'Sofía Vargas', department: 'Administración', equipmentName: 'PC Recepción 02', equipmentId: 'CMP-2025-045', date: '12 Ene 2025', status: 'Activa' },
  { employee: 'Andrés Castillo', department: 'Finanzas', equipmentName: 'Laptop Finanzas 08', equipmentId: 'CMP-2025-039', date: '14 Nov 2024', status: 'Activa' },
]

const timelineData: TimelineEvent[] = [
  { date: '18 JUN', time: '09:42', icon: 'users', color: 'blue', type: 'Asignación', equipment: 'CMP-2025-048', title: 'Equipo asignado a Mariana Torres', description: 'Asignación realizada al departamento de Dirección por Carlos Gómez.' },
  { date: '18 JUN', time: '08:15', icon: 'tool', color: 'orange', type: 'Cambio de estado', equipment: 'CMP-2025-046', title: 'Equipo enviado a mantenimiento', description: 'Se reportó sobrecalentamiento durante el uso. Ticket de soporte: INC-0842.' },
  { date: '17 JUN', time: '16:42', icon: 'plus', color: 'green', type: 'Registro', equipment: 'CMP-2025-047', title: 'Nuevo equipo registrado', description: 'Estación Diseño 06 agregada al inventario por Laura Sánchez.' },
  { date: '17 JUN', time: '11:18', icon: 'edit', color: 'purple', type: 'Modificación', equipment: 'CMP-2025-045', title: 'Información técnica actualizada', description: 'Memoria RAM actualizada de 8 GB a 16 GB por Carlos Gómez.' },
  { date: '16 JUN', time: '14:30', icon: 'swap', color: 'blue', type: 'Reasignación', equipment: 'CMP-2025-041', title: 'Equipo reasignado', description: 'Reasignado de Luis Herrera a Andrea Salas, departamento de Recursos Humanos.' },
]

export const getInitialEquipment = (): Equipment[] => equipmentData.map((e) => ({ ...e }))
export const getAssignments = (): Assignment[] => assignmentData
export const getTimeline = (): TimelineEvent[] => timelineData

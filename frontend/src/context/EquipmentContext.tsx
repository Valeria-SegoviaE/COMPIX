import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Equipment } from '../types'
import { deleteEquipment, getInitialEquipment } from '../services/equipmentService'

interface EquipmentContextValue {
  equipment: Equipment[]
  loading: boolean
  error: string
  refresh: () => Promise<void>
  addEquipment: (item: Equipment) => Promise<void>
  replaceEquipment: (item: Equipment) => void
  removeEquipment: (id: string) => Promise<void>
}

const EquipmentContext = createContext<EquipmentContextValue | null>(null)

export function EquipmentProvider({ children }: { children: ReactNode }) {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      setEquipment(await getInitialEquipment())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar el inventario.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const addEquipment = async (item: Equipment) => {
    setEquipment((items) => [item, ...items])
  }

  const replaceEquipment = (item: Equipment) => {
    setEquipment((items) => items.map((entry) => entry.numericId === item.numericId ? item : entry))
  }

  const removeEquipment = async (id: string) => {
    const item = equipment.find((entry) => entry.id === id)
    if (!item?.numericId) throw new Error('No se encontró el identificador del equipo para darlo de baja.')
    await deleteEquipment(item.numericId)
    setEquipment((items) => items.map((entry) => entry.id === id ? { ...entry, status: 'Baja' } : entry))
  }

  return (
    <EquipmentContext.Provider value={{ equipment, loading, error, refresh, addEquipment, replaceEquipment, removeEquipment }}>
      {children}
    </EquipmentContext.Provider>
  )
}

export function useEquipment() {
  const ctx = useContext(EquipmentContext)
  if (!ctx) throw new Error('useEquipment debe usarse dentro de EquipmentProvider')
  return ctx
}

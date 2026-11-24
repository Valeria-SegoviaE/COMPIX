import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Equipment } from '../types'
import { getInitialEquipment } from '../services/equipmentService'

interface EquipmentContextValue {
  equipment: Equipment[]
  addEquipment: (item: Equipment) => void
  removeEquipment: (id: string) => void
}

const EquipmentContext = createContext<EquipmentContextValue | null>(null)

export function EquipmentProvider({ children }: { children: ReactNode }) {
  const [equipment, setEquipment] = useState<Equipment[]>(getInitialEquipment)

  const addEquipment = (item: Equipment) => setEquipment((items) => [item, ...items])
  const removeEquipment = (id: string) => setEquipment((items) => items.filter((item) => item.id !== id))

  return (
    <EquipmentContext.Provider value={{ equipment, addEquipment, removeEquipment }}>
      {children}
    </EquipmentContext.Provider>
  )
}

export function useEquipment() {
  const ctx = useContext(EquipmentContext)
  if (!ctx) throw new Error('useEquipment debe usarse dentro de EquipmentProvider')
  return ctx
}

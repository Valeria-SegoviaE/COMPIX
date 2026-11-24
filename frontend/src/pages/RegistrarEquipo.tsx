import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Button } from '../components/Button'
import { Field, SelectField } from '../components/FormFields'
import { useEquipment } from '../context/EquipmentContext'

export default function RegistrarEquipo() {
  const { addEquipment } = useEquipment()
  const navigate = useNavigate()
  const [form, setForm] = useState({ id: '', name: '', type: '', brand: '', model: '', serial: '', processor: '', ram: '', storage: '', notes: '' })
  const change = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    addEquipment({
      id: form.id || 'CMP-2025-049',
      name: form.name || 'Equipo nuevo',
      type: form.type || 'Laptop',
      brand: form.brand || 'Sin especificar',
      model: form.model || 'Sin especificar',
      serial: form.serial || 'Sin especificar',
      employee: 'Sin asignar',
      department: '—',
      status: 'Disponible',
      date: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      processor: form.processor || 'Sin especificar',
      ram: form.ram || 'Sin especificar',
      storage: form.storage || 'Sin especificar',
    })
    navigate('/inventario')
  }

  return (
    <form className="form-layout" onSubmit={submit}>
      <section className="panel form-panel">
        <div className="section-title"><span><Icon name="monitor" /></span><div><h2>Información general</h2><p>Datos principales para identificar el equipo</p></div></div>
        <div className="form-grid">
          <Field label="Número de inventario" required placeholder="Ej. CMP-2025-049" value={form.id} onChange={(v) => change('id', v)} />
          <Field label="Nombre del equipo" required placeholder="Ej. Laptop Ventas 13" value={form.name} onChange={(v) => change('name', v)} />
          <SelectField label="Tipo de equipo" required value={form.type} onChange={(v) => change('type', v)} options={['Seleccionar tipo', 'Laptop', 'Escritorio', 'All-in-One', 'Servidor']} />
          <Field label="Número de serie" required placeholder="Ej. DL5K91P2" value={form.serial} onChange={(v) => change('serial', v)} />
          <Field label="Marca" required placeholder="Ej. Dell" value={form.brand} onChange={(v) => change('brand', v)} />
          <Field label="Modelo" required placeholder="Ej. Latitude 5450" value={form.model} onChange={(v) => change('model', v)} />
        </div>
      </section>
      <section className="panel form-panel">
        <div className="section-title"><span><Icon name="cpu" /></span><div><h2>Especificaciones técnicas</h2><p>Características de hardware del equipo</p></div></div>
        <div className="form-grid">
          <Field label="Procesador" required placeholder="Ej. Intel Core i7-1365U" value={form.processor} onChange={(v) => change('processor', v)} />
          <SelectField label="Memoria RAM" required value={form.ram} onChange={(v) => change('ram', v)} options={['Seleccionar capacidad', '8 GB DDR4', '16 GB DDR4', '16 GB DDR5', '32 GB DDR5', '64 GB DDR5']} />
          <Field label="Almacenamiento" required placeholder="Ej. SSD 512 GB" value={form.storage} onChange={(v) => change('storage', v)} />
          <div />
          <label className="field full">
            <span>Observaciones <small>Opcional</small></span>
            <textarea rows={4} value={form.notes} onChange={(e) => change('notes', e.target.value)} placeholder="Agrega notas relevantes sobre el estado o características del equipo..." />
          </label>
        </div>
      </section>
      <div className="form-actions">
        <Button variant="secondary" onClick={() => navigate('/inventario')}>Cancelar</Button>
        <Button type="submit" icon="check">Guardar equipo</Button>
      </div>
    </form>
  )
}

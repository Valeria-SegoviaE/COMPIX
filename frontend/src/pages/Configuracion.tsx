import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { Button } from '../components/Button'
import { Field } from '../components/FormFields'
import { apiRequest } from '../services/api'

type SettingsTab = 'company' | 'users' | 'notifications' | 'catalogs'
interface CompanySettings {
  name: string
  taxId: string
  email: string
  phone: string
  address: string
}
interface UserRecord {
  idUsuario: number
  nombreCompleto: string
  correo: string
  rol: string
  activo: boolean
}
interface DepartmentRecord {
  idDepartamento: number
  nombre: string
  ubicacionFisica?: string | null
}

const initialCompany: CompanySettings = {
  name: 'Grupo Nova Tecnología',
  taxId: 'GNT-920418-MX7',
  email: 'soporte@gruponova.com',
  phone: '+52 55 4872 9100',
  address: 'Av. Paseo de la Reforma 250, Ciudad de México',
}
const defaultNotifications = { assignments: true, maintenance: true, inventory: false }

function readCompanySettings(): CompanySettings {
  try {
    const stored = localStorage.getItem('compix_company_settings')
    return stored ? { ...initialCompany, ...JSON.parse(stored) as Partial<CompanySettings> } : initialCompany
  } catch {
    return initialCompany
  }
}

function readNotifications() {
  try {
    const stored = localStorage.getItem('compix_notifications')
    return stored ? { ...defaultNotifications, ...JSON.parse(stored) as Partial<typeof defaultNotifications> } : defaultNotifications
  } catch {
    return defaultNotifications
  }
}

const sections: { id: SettingsTab; label: string; icon: 'building' | 'users' | 'bell' | 'grid' }[] = [
  { id: 'company', label: 'Información de la empresa', icon: 'building' },
  { id: 'users', label: 'Usuarios y permisos', icon: 'users' },
  { id: 'notifications', label: 'Notificaciones', icon: 'bell' },
  { id: 'catalogs', label: 'Catálogos del sistema', icon: 'grid' },
]

export default function Configuracion() {
  const [tab, setTab] = useState<SettingsTab>('company')
  const [company, setCompany] = useState(readCompanySettings)
  const [notifications, setNotifications] = useState(readNotifications)
  const [users, setUsers] = useState<UserRecord[]>([])
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [userFormOpen, setUserFormOpen] = useState(false)
  const [userForm, setUserForm] = useState({ nombreCompleto: '', correo: '', contrasena: '', rol: 'Soporte' })
  const [departmentId, setDepartmentId] = useState<number | null>(null)
  const [departmentForm, setDepartmentForm] = useState({ nombre: '', ubicacionFisica: '' })

  const loadSettingsData = async () => {
    setLoading(true)
    setError('')
    try {
      if (tab === 'users') setUsers(await apiRequest<UserRecord[]>('/api/usuarios') ?? [])
      if (tab === 'catalogs') setDepartments(await apiRequest<DepartmentRecord[]>('/api/departamentos') ?? [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar la configuración.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'users' || tab === 'catalogs') void loadSettingsData()
  }, [tab])

  const saveCompany = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    try {
      localStorage.setItem('compix_company_settings', JSON.stringify(company))
      setNotice('La información se guardó en este navegador.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No fue posible guardar los datos en este navegador.')
    }
  }

  const saveNotifications = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    try {
      localStorage.setItem('compix_notifications', JSON.stringify(notifications))
      setNotice('Las preferencias se guardaron en este navegador.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No fue posible guardar las preferencias.')
    }
  }

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const created = await apiRequest<UserRecord>('/api/usuarios', {
        method: 'POST',
        body: JSON.stringify(userForm),
      })
      if (created) setUsers((items) => [created, ...items])
      else await loadSettingsData()
      setUserForm({ nombreCompleto: '', correo: '', contrasena: '', rol: 'Soporte' })
      setUserFormOpen(false)
      setNotice('El usuario se creó correctamente.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No fue posible crear el usuario.')
    } finally {
      setSaving(false)
    }
  }

  const toggleUser = async (user: UserRecord) => {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await apiRequest(`/api/usuarios/${user.idUsuario}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ activo: !user.activo }),
      })
      setUsers((items) => items.map((item) => item.idUsuario === user.idUsuario ? { ...item, activo: !user.activo } : item))
      setNotice(`El acceso de ${user.nombreCompleto} se ${user.activo ? 'desactivó' : 'activó'}.`)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No fue posible cambiar el acceso del usuario.')
    } finally {
      setSaving(false)
    }
  }

  const saveDepartment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    const request = {
      nombre: departmentForm.nombre.trim(),
      ubicacionFisica: departmentForm.ubicacionFisica.trim() || null,
    }
    try {
      if (departmentId === null) {
        const created = await apiRequest<DepartmentRecord>('/api/departamentos', {
          method: 'POST',
          body: JSON.stringify(request),
        })
        if (created) setDepartments((items) => [created, ...items])
        else await loadSettingsData()
        setNotice('El departamento se creó correctamente.')
      } else {
        await apiRequest(`/api/departamentos/${departmentId}`, {
          method: 'PUT',
          body: JSON.stringify(request),
        })
        setDepartments((items) => items.map((item) => item.idDepartamento === departmentId
          ? { ...item, nombre: request.nombre, ubicacionFisica: request.ubicacionFisica }
          : item))
        setNotice('El departamento se actualizó correctamente.')
      }
      setDepartmentId(null)
      setDepartmentForm({ nombre: '', ubicacionFisica: '' })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No fue posible guardar el departamento.')
    } finally {
      setSaving(false)
    }
  }

  const beginDepartmentEdit = (department: DepartmentRecord) => {
    setDepartmentId(department.idDepartamento)
    setDepartmentForm({ nombre: department.nombre, ubicacionFisica: department.ubicacionFisica ?? '' })
    setError('')
  }

  return (
    <div className="settings-grid">
      <section className="panel settings-nav">
        {sections.map((section) => (
          <button key={section.id} type="button" className={tab === section.id ? 'active' : ''} onClick={() => {
            setTab(section.id)
            setError('')
            setNotice('')
          }}>
            <Icon name={section.icon} />{section.label}
          </button>
        ))}
      </section>

      <section className="panel form-panel settings-form">
        {notice && <div className="assignment-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Cerrar aviso">×</button></div>}
        {error && <div className="login-error" role="alert">{error}</div>}
        {loading && <div className="table-footer">Cargando configuración...</div>}

        {tab === 'company' && (
          <form onSubmit={saveCompany}>
            <div className="section-title"><span><Icon name="building" /></span><div><h2>Información de la empresa</h2><p>Datos para reportes, guardados únicamente en este navegador</p></div></div>
            <div className="form-grid">
              <Field label="Nombre de la empresa" value={company.name} placeholder="Nombre" onChange={(value) => setCompany({ ...company, name: value })} />
              <Field label="Identificador fiscal" value={company.taxId} placeholder="RFC" onChange={(value) => setCompany({ ...company, taxId: value })} />
              <Field label="Correo de soporte" type="email" value={company.email} placeholder="soporte@empresa.com" onChange={(value) => setCompany({ ...company, email: value })} />
              <Field label="Teléfono" value={company.phone} placeholder="+52..." onChange={(value) => setCompany({ ...company, phone: value })} />
              <label className="field full"><span>Dirección</span><textarea rows={3} value={company.address} onChange={(event) => setCompany({ ...company, address: event.target.value })} /></label>
            </div>
            <div className="form-actions"><Button type="submit" icon="check">Guardar cambios</Button></div>
          </form>
        )}

        {tab === 'users' && (
          <>
            <div className="section-title"><span><Icon name="users" /></span><div><h2>Usuarios y permisos</h2><p>Administra las cuentas autorizadas para usar el sistema</p></div></div>
            <div className="form-actions"><Button icon="plus" onClick={() => setUserFormOpen((open) => !open)}>{userFormOpen ? 'Cancelar' : 'Agregar usuario'}</Button></div>
            {userFormOpen && <form className="form-grid" onSubmit={createUser}>
              <Field label="Nombre completo" required value={userForm.nombreCompleto} placeholder="Nombre y apellidos" onChange={(value) => setUserForm({ ...userForm, nombreCompleto: value })} />
              <Field label="Correo" required type="email" value={userForm.correo} placeholder="usuario@empresa.com" onChange={(value) => setUserForm({ ...userForm, correo: value })} />
              <Field label="Contraseña temporal" required type="password" value={userForm.contrasena} placeholder="Mínimo 8 caracteres" onChange={(value) => setUserForm({ ...userForm, contrasena: value })} />
              <label className="field"><span>Rol</span><select value={userForm.rol} onChange={(event) => setUserForm({ ...userForm, rol: event.target.value })}><option value="Soporte">Soporte</option><option value="Admin">Administrador</option></select></label>
              <div className="form-actions"><Button type="submit" icon="check" disabled={saving}>{saving ? 'Creando...' : 'Crear usuario'}</Button></div>
            </form>}
            <div className="table-scroll"><table>
              <thead><tr><th>USUARIO</th><th>CORREO</th><th>ROL</th><th>ACCESO</th><th>ACCIÓN</th></tr></thead>
              <tbody>{users.map((user) => <tr key={user.idUsuario}>
                <td>{user.nombreCompleto}</td><td>{user.correo}</td><td>{user.rol}</td><td>{user.activo ? 'Activo' : 'Inactivo'}</td>
                <td><button className="link-button" type="button" disabled={saving} onClick={() => void toggleUser(user)}>{user.activo ? 'Desactivar' : 'Activar'}</button></td>
              </tr>)}</tbody>
            </table>{!loading && !error && users.length === 0 && <div className="empty-state">No hay usuarios registrados.</div>}</div>
          </>
        )}

        {tab === 'notifications' && (
          <form onSubmit={saveNotifications}>
            <div className="section-title"><span><Icon name="bell" /></span><div><h2>Notificaciones</h2><p>Elige las preferencias de esta instalación de COMPIX</p></div></div>
            <div className="form-grid">
              <label className="field"><span>Asignaciones y devoluciones</span><input type="checkbox" checked={notifications.assignments} onChange={(event) => setNotifications({ ...notifications, assignments: event.target.checked })} /></label>
              <label className="field"><span>Mantenimientos</span><input type="checkbox" checked={notifications.maintenance} onChange={(event) => setNotifications({ ...notifications, maintenance: event.target.checked })} /></label>
              <label className="field"><span>Altas y cambios de inventario</span><input type="checkbox" checked={notifications.inventory} onChange={(event) => setNotifications({ ...notifications, inventory: event.target.checked })} /></label>
            </div>
            <div className="form-actions"><Button type="submit" icon="check">Guardar preferencias</Button></div>
          </form>
        )}

        {tab === 'catalogs' && (
          <>
            <div className="section-title"><span><Icon name="grid" /></span><div><h2>Catálogos del sistema</h2><p>Administra los departamentos disponibles para los empleados</p></div></div>
            <form className="form-grid" onSubmit={saveDepartment}>
              <Field label="Nombre del departamento" required value={departmentForm.nombre} placeholder="Ej. Finanzas" onChange={(value) => setDepartmentForm({ ...departmentForm, nombre: value })} />
              <Field label="Ubicación física" value={departmentForm.ubicacionFisica} placeholder="Ej. Piso 2" onChange={(value) => setDepartmentForm({ ...departmentForm, ubicacionFisica: value })} />
              <div className="form-actions"><Button type="submit" icon="check" disabled={saving}>{saving ? 'Guardando...' : departmentId === null ? 'Agregar departamento' : 'Guardar departamento'}</Button>
                {departmentId !== null && <Button variant="secondary" onClick={() => { setDepartmentId(null); setDepartmentForm({ nombre: '', ubicacionFisica: '' }) }}>Cancelar</Button>}
              </div>
            </form>
            <div className="table-scroll"><table>
              <thead><tr><th>DEPARTAMENTO</th><th>UBICACIÓN</th><th>ACCIÓN</th></tr></thead>
              <tbody>{departments.map((department) => <tr key={department.idDepartamento}>
                <td>{department.nombre}</td><td>{department.ubicacionFisica || '—'}</td>
                <td><button className="link-button" type="button" onClick={() => beginDepartmentEdit(department)}>Editar</button></td>
              </tr>)}</tbody>
            </table>{!loading && !error && departments.length === 0 && <div className="empty-state">No hay departamentos registrados.</div>}</div>
          </>
        )}
      </section>
    </div>
  )
}

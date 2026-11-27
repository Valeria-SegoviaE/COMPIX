import { Icon } from '../components/Icon'
import { Button } from '../components/Button'
import { Field } from '../components/FormFields'

export default function Configuracion() {
  return (
    <div className="settings-grid">
      <section className="panel settings-nav">
        <button className="active"><Icon name="building" />Información de la empresa</button>
        <button><Icon name="users" />Usuarios y permisos</button>
        <button><Icon name="bell" />Notificaciones</button>
        <button><Icon name="grid" />Catálogos del sistema</button>
      </section>
      <section className="panel form-panel settings-form">
        <div className="section-title"><span><Icon name="building" /></span><div><h2>Información de la empresa</h2><p>Datos que se mostrarán en reportes y documentos</p></div></div>
        <div className="form-grid">
          <Field label="Nombre de la empresa" value="Grupo Nova Tecnología" placeholder="" onChange={() => {}} />
          <Field label="Identificador fiscal" value="GNT-920418-MX7" placeholder="" onChange={() => {}} />
          <Field label="Correo de soporte" value="soporte@gruponova.com" placeholder="" onChange={() => {}} />
          <Field label="Teléfono" value="+52 55 4872 9100" placeholder="" onChange={() => {}} />
          <label className="field full"><span>Dirección</span><textarea rows={3} defaultValue="Av. Paseo de la Reforma 250, Ciudad de México" /></label>
        </div>
        <div className="form-actions"><Button icon="check">Guardar cambios</Button></div>
      </section>
    </div>
  )
}

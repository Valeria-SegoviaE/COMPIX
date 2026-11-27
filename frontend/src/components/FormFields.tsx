interface FieldProps {
  label: string
  required?: boolean
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: string
}

export function Field({ label, required, placeholder, value, onChange, type = 'text' }: FieldProps) {
  return (
    <label className="field">
      <span>{label} {required && <b>*</b>}</span>
      <input type={type} required={required} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

interface SelectProps {
  label: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  options: string[]
}

export function SelectField({ label, required, value, onChange, options }: SelectProps) {
  return (
    <label className="field">
      <span>{label} {required && <b>*</b>}</span>
      <select required={required} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((x, i) => <option key={x} value={i === 0 ? '' : x}>{x}</option>)}
      </select>
    </label>
  )
}

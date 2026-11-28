import type { ReactNode } from 'react'
import type { IconName } from '../types'
import { Icon } from './Icon'

interface Props {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  icon?: IconName
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
}

export function Button({ children, variant = 'primary', icon, onClick, type = 'button', disabled = false }: Props) {
  return (
    <button type={type} className={`btn btn-${variant}`} onClick={onClick} disabled={disabled}>
      {icon && <Icon name={icon} size={17} />}
      <span>{children}</span>
    </button>
  )
}

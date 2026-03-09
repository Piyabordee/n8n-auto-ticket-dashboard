import { ReactNode } from 'react'

export type ModalComponent<T = any> = React.ComponentType<T>

export interface ModalInstance {
  id: string
  component: ModalComponent
  props: any
  zIndex: number
}

export interface ModalContextType {
  modals: ModalInstance[]
  openModal: <T>(component: ModalComponent<T>, props: T) => void
  closeModal: () => void
  closeAll: () => void
}

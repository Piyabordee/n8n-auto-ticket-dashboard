'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ModalContextType, ModalInstance, ModalComponent } from '@/types/modal'

const ModalContext = createContext<ModalContextType | undefined>(undefined)

const Z_INDEX_BASE = 50
const Z_INDEX_STEP = 10

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<ModalInstance[]>([])

  const openModal = useCallback(<T,>(component: ModalComponent<T>, props: T) => {
    const id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const zIndex = Z_INDEX_BASE + (modals.length * Z_INDEX_STEP)

    setModals(prev => [...prev, { id, component, props, zIndex }])
  }, [modals.length])

  const closeModal = useCallback(() => {
    setModals(prev => prev.slice(0, -1))
  }, [])

  const closeAll = useCallback(() => {
    setModals([])
  }, [])

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal, closeAll }}>
      {children}
      <ModalRenderer modals={modals} />
    </ModalContext.Provider>
  )
}

function ModalRenderer({ modals }: { modals: ModalInstance[] }) {
  return (
    <>
      {modals.map(({ id, component: Component, props, zIndex }) => (
        <div key={id} style={{ zIndex }} className="relative">
          <Component {...props} />
        </div>
      ))}
    </>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within ModalProvider')
  }
  return context
}

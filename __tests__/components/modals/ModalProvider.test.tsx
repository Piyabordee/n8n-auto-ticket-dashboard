import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ModalProvider, useModal } from '../../../app/components/modals/ModalProvider'

// Test component that uses useModal
function TestComponent() {
  const { modals, openModal, closeModal, closeAll } = useModal()

  const TestModal = ({ title }: { title: string }) => (
    <div data-testid="test-modal">{title}</div>
  )

  return (
    <div>
      <span data-testid="modal-count">{modals.length}</span>
      <button onClick={() => openModal(TestModal, { title: 'Modal 1' })}>
        Open Modal 1
      </button>
      <button onClick={() => openModal(TestModal, { title: 'Modal 2' })}>
        Open Modal 2
      </button>
      <button onClick={closeModal}>Close Top</button>
      <button onClick={closeAll}>Close All</button>
    </div>
  )
}

describe('ModalProvider', () => {
  it('should render children and provide useModal hook', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    )

    expect(screen.getByTestId('modal-count')).toHaveTextContent('0')
  })

  it('should open a modal when openModal is called', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    )

    fireEvent.click(screen.getByText('Open Modal 1'))
    expect(screen.getByTestId('modal-count')).toHaveTextContent('1')
    expect(screen.getByTestId('test-modal')).toHaveTextContent('Modal 1')
  })

  it('should stack multiple modals', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    )

    fireEvent.click(screen.getByText('Open Modal 1'))
    expect(screen.getByTestId('modal-count')).toHaveTextContent('1')

    fireEvent.click(screen.getByText('Open Modal 2'))
    expect(screen.getByTestId('modal-count')).toHaveTextContent('2')
  })

  it('should close top modal when closeModal is called', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    )

    fireEvent.click(screen.getByText('Open Modal 1'))
    fireEvent.click(screen.getByText('Open Modal 2'))
    expect(screen.getByTestId('modal-count')).toHaveTextContent('2')

    fireEvent.click(screen.getByText('Close Top'))
    expect(screen.getByTestId('modal-count')).toHaveTextContent('1')
  })

  it('should close all modals when closeAll is called', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    )

    fireEvent.click(screen.getByText('Open Modal 1'))
    fireEvent.click(screen.getByText('Open Modal 2'))
    expect(screen.getByTestId('modal-count')).toHaveTextContent('2')

    fireEvent.click(screen.getByText('Close All'))
    expect(screen.getByTestId('modal-count')).toHaveTextContent('0')
  })

  it('should throw error when useModal is used outside provider', () => {
    // Suppress console.error for this test
    const consoleError = console.error
    console.error = jest.fn()

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useModal must be used within ModalProvider')

    console.error = consoleError
  })
})

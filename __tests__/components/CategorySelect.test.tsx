import React from 'react'
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import { CategorySelect } from '@/app/components/CategorySelect'

describe('CategorySelect', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  describe('basic rendering', () => {
    it('should render select element', () => {
      render(<CategorySelect value="" onChange={mockOnChange} />)

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
    })

    it('should render default option', () => {
      render(<CategorySelect value="" onChange={mockOnChange} />)

      expect(screen.getByText('Select Category')).toBeInTheDocument()
    })

    it('should render all category options', () => {
      render(<CategorySelect value="" onChange={mockOnChange} />)

      expect(screen.getByText('Software')).toBeInTheDocument()
      expect(screen.getByText('Hardware')).toBeInTheDocument()
      expect(screen.getByText('Network')).toBeInTheDocument()
      expect(screen.getByText('Camera')).toBeInTheDocument()
      expect(screen.getByText('Printer')).toBeInTheDocument()
      expect(screen.getByText('Rate')).toBeInTheDocument()
      expect(screen.getByText('POS')).toBeInTheDocument()
      expect(screen.getByText('Request')).toBeInTheDocument()
    })
  })

  describe('value handling', () => {
    it('should display selected value', () => {
      render(<CategorySelect value="Software" onChange={mockOnChange} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('Software')
    })

    it('should display empty string when no value is selected', () => {
      render(<CategorySelect value="" onChange={mockOnChange} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('')
    })
  })

  describe('change handling', () => {
    it('should call onChange when category is selected', () => {
      render(<CategorySelect value="" onChange={mockOnChange} />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'Hardware' } })

      expect(mockOnChange).toHaveBeenCalledWith('Hardware')
    })

    it('should call onChange when value is changed to empty', () => {
      render(<CategorySelect value="Software" onChange={mockOnChange} />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: '' } })

      expect(mockOnChange).toHaveBeenCalledWith('')
    })

    it('should call onChange multiple times for different selections', () => {
      render(<CategorySelect value="" onChange={mockOnChange} />)

      const select = screen.getByRole('combobox')

      fireEvent.change(select, { target: { value: 'Network' } })
      expect(mockOnChange).toHaveBeenCalledWith('Network')

      fireEvent.change(select, { target: { value: 'Printer' } })
      expect(mockOnChange).toHaveBeenCalledWith('Printer')

      fireEvent.change(select, { target: { value: 'POS' } })
      expect(mockOnChange).toHaveBeenCalledWith('POS')

      expect(mockOnChange).toHaveBeenCalledTimes(3)
    })
  })

  describe('styling', () => {
    it('should apply correct CSS classes', () => {
      render(<CategorySelect value="" onChange={mockOnChange} />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('w-full')
      expect(select).toHaveClass('px-3')
      expect(select).toHaveClass('py-2')
      expect(select).toHaveClass('border')
      expect(select).toHaveClass('border-gray-300')
    })
  })
})

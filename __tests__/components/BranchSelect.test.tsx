import React from 'react'
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import { BranchSelect } from '@/app/components/BranchSelect'

describe('BranchSelect', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  describe('basic rendering', () => {
    it('should render select element', () => {
      render(<BranchSelect value="" onChange={mockOnChange} />)

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
    })

    it('should render default option', () => {
      render(<BranchSelect value="" onChange={mockOnChange} />)

      expect(screen.getByText('Select Branch')).toBeInTheDocument()
    })

    it('should render all branch options', () => {
      render(<BranchSelect value="" onChange={mockOnChange} />)

      expect(screen.getByText('Bangkok')).toBeInTheDocument()
      expect(screen.getByText('Chiang Mai')).toBeInTheDocument()
      expect(screen.getByText('Phuket')).toBeInTheDocument()
      expect(screen.getByText('Pattaya')).toBeInTheDocument()
    })
  })

  describe('value handling', () => {
    it('should display selected value', () => {
      render(<BranchSelect value="Bangkok" onChange={mockOnChange} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('Bangkok')
    })

    it('should display empty string when no value is selected', () => {
      render(<BranchSelect value="" onChange={mockOnChange} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('')
    })
  })

  describe('change handling', () => {
    it('should call onChange when branch is selected', () => {
      render(<BranchSelect value="" onChange={mockOnChange} />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'Chiang Mai' } })

      expect(mockOnChange).toHaveBeenCalledWith('Chiang Mai')
    })

    it('should call onChange when value is changed to empty', () => {
      render(<BranchSelect value="Phuket" onChange={mockOnChange} />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: '' } })

      expect(mockOnChange).toHaveBeenCalledWith('')
    })

    it('should call onChange multiple times for different selections', () => {
      render(<BranchSelect value="" onChange={mockOnChange} />)

      const select = screen.getByRole('combobox')

      fireEvent.change(select, { target: { value: 'Pattaya' } })
      expect(mockOnChange).toHaveBeenCalledWith('Pattaya')

      fireEvent.change(select, { target: { value: 'Bangkok' } })
      expect(mockOnChange).toHaveBeenCalledWith('Bangkok')

      expect(mockOnChange).toHaveBeenCalledTimes(2)
    })
  })

  describe('styling', () => {
    it('should apply correct CSS classes', () => {
      render(<BranchSelect value="" onChange={mockOnChange} />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('w-full')
      expect(select).toHaveClass('px-3')
      expect(select).toHaveClass('py-2')
      expect(select).toHaveClass('border')
      expect(select).toHaveClass('border-gray-300')
    })
  })
})

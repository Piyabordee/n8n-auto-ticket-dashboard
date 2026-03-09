import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils'
import { ImageUpload } from '@/app/components/ImageUpload'

// Mock FileReader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  result: null,
  onloadend: null as ((event: ProgressEvent<FileReader>) => void) | null,
}

global.FileReader = jest.fn(() => mockFileReader) as any

describe('ImageUpload', () => {
  const mockOnImageChange = jest.fn()

  beforeEach(() => {
    mockOnImageChange.mockClear()
    jest.clearAllMocks()
  })

  describe('basic rendering', () => {
    it('should render file input', () => {
      render(<ImageUpload onImageChange={mockOnImageChange} />)

      const input = screen.getByLabelText(/Upload Image/)
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'file')
      expect(input).toHaveAttribute('accept', 'image/*')
    })

    it('should render label', () => {
      render(<ImageUpload onImageChange={mockOnImageChange} />)

      expect(screen.getByText('Upload Image (Optional)')).toBeInTheDocument()
    })

    it('should not show preview when no image is selected', () => {
      render(<ImageUpload onImageChange={mockOnImageChange} />)

      expect(screen.queryByAltText('Preview')).not.toBeInTheDocument()
      expect(screen.queryByText('✕')).not.toBeInTheDocument()
    })
  })

  describe('image upload handling', () => {
    it('should handle file selection', async () => {
      const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='
      mockFileReader.result = mockBase64

      render(<ImageUpload onImageChange={mockOnImageChange} />)

      const input = screen.getByLabelText(/Upload Image/) as HTMLInputElement
      const file = new File(['dummy'], 'test.png', { type: 'image/png' })

      // Create a mock readAsDataURL that calls onloadend
      mockFileReader.readAsDataURL = jest.fn((file) => {
        mockFileReader.result = mockBase64
        if (mockFileReader.onloadend) {
          mockFileReader.onloadend({ target: { result: mockBase64 } } as any)
        }
      })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockOnImageChange).toHaveBeenCalledWith(mockBase64)
      })
    })

    it('should show preview after image selection', async () => {
      const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='

      mockFileReader.readAsDataURL = jest.fn(() => {
        mockFileReader.result = mockBase64
        if (mockFileReader.onloadend) {
          mockFileReader.onloadend({ target: { result: mockBase64 } } as any)
        }
      })

      render(<ImageUpload onImageChange={mockOnImageChange} />)

      const input = screen.getByLabelText(/Upload Image/) as HTMLInputElement
      const file = new File(['dummy'], 'test.png', { type: 'image/png' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        const preview = screen.getByAltText('Preview')
        expect(preview).toBeInTheDocument()
        expect(preview).toHaveAttribute('src', mockBase64)
      })
    })
  })

  describe('image removal', () => {
    it('should show remove button when preview is displayed', async () => {
      const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='

      mockFileReader.readAsDataURL = jest.fn(() => {
        mockFileReader.result = mockBase64
        if (mockFileReader.onloadend) {
          mockFileReader.onloadend({ target: { result: mockBase64 } } as any)
        }
      })

      render(<ImageUpload onImageChange={mockOnImageChange} />)

      const input = screen.getByLabelText(/Upload Image/) as HTMLInputElement
      const file = new File(['dummy'], 'test.png', { type: 'image/png' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByAltText('Preview')).toBeInTheDocument()
      })

      expect(screen.getByText('✕')).toBeInTheDocument()
    })

    it('should remove image when remove button is clicked', async () => {
      const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='

      mockFileReader.readAsDataURL = jest.fn(() => {
        mockFileReader.result = mockBase64
        if (mockFileReader.onloadend) {
          mockFileReader.onloadend({ target: { result: mockBase64 } } as any)
        }
      })

      render(<ImageUpload onImageChange={mockOnImageChange} />)

      const input = screen.getByLabelText(/Upload Image/) as HTMLInputElement
      const file = new File(['dummy'], 'test.png', { type: 'image/png' })

      // Upload image
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByAltText('Preview')).toBeInTheDocument()
      })

      // Click remove button
      const removeButton = screen.getByText('✕')
      fireEvent.click(removeButton)

      await waitFor(() => {
        expect(screen.queryByAltText('Preview')).not.toBeInTheDocument()
        expect(mockOnImageChange).toHaveBeenCalledWith('')
      })
    })
  })

  describe('edge cases', () => {
    it('should handle null file gracefully', () => {
      render(<ImageUpload onImageChange={mockOnImageChange} />)

      const input = screen.getByLabelText(/Upload Image/) as HTMLInputElement

      fireEvent.change(input, { target: { files: [] } })

      expect(mockOnImageChange).not.toHaveBeenCalled()
    })

    it('should handle multiple file selections (only first is used)', async () => {
      const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='

      mockFileReader.readAsDataURL = jest.fn(() => {
        mockFileReader.result = mockBase64
        if (mockFileReader.onloadend) {
          mockFileReader.onloadend({ target: { result: mockBase64 } } as any)
        }
      })

      render(<ImageUpload onImageChange={mockOnImageChange} />)

      const input = screen.getByLabelText(/Upload Image/) as HTMLInputElement
      const file1 = new File(['dummy1'], 'test1.png', { type: 'image/png' })
      const file2 = new File(['dummy2'], 'test2.png', { type: 'image/png' })

      // Create a FileList-like object with multiple files
      const files = [file1, file2] as any
      fireEvent.change(input, { target: { files } })

      await waitFor(() => {
        expect(mockOnImageChange).toHaveBeenCalledWith(mockBase64)
      })

      // Should only call once (only first file is used)
      expect(mockOnImageChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('styling', () => {
    it('should apply correct CSS classes to input', () => {
      render(<ImageUpload onImageChange={mockOnImageChange} />)

      const input = screen.getByLabelText(/Upload Image/)
      expect(input).toHaveClass('w-full')
      expect(input).toHaveClass('px-3')
      expect(input).toHaveClass('py-2')
    })

    it('should apply correct styling to preview image', async () => {
      const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='

      mockFileReader.readAsDataURL = jest.fn(() => {
        mockFileReader.result = mockBase64
        if (mockFileReader.onloadend) {
          mockFileReader.onloadend({ target: { result: mockBase64 } } as any)
        }
      })

      render(<ImageUpload onImageChange={mockOnImageChange} />)

      const input = screen.getByLabelText(/Upload Image/) as HTMLInputElement
      const file = new File(['dummy'], 'test.png', { type: 'image/png' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        const preview = screen.getByAltText('Preview')
        expect(preview).toHaveClass('w-full')
        expect(preview).toHaveClass('h-64')
        expect(preview).toHaveClass('object-cover')
      })
    })
  })
})

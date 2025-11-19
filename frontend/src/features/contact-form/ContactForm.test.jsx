import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ContactForm from './ContactForm'

describe('ContactForm', () => {
  it('renders form fields', () => {
    render(<ContactForm />)
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Message/i)).toBeInTheDocument()
  })

  it('shows validation errors when submitting empty form', async () => {
    render(<ContactForm />)
    const submitButton = screen.getByRole('button', { name: /Send Message/i })

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Phone is required')).toBeInTheDocument()
      expect(screen.getByText('Message is required')).toBeInTheDocument()
    })
  })

  it('validates form fields on submit', async () => {
    render(<ContactForm />)
    const submitButton = screen.getByRole('button', { name: /Send Message/i })

    fireEvent.click(submitButton)

    await waitFor(() => {
      // Check that validation errors appear
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
  })

  it('clears error when user starts typing', async () => {
    render(<ContactForm />)
    const nameInput = screen.getByLabelText(/Full Name/i)
    const submitButton = screen.getByRole('button', { name: /Send Message/i })

    // Submit to show error
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })

    // Type to clear error
    fireEvent.change(nameInput, { target: { value: 'John' } })

    await waitFor(() => {
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<ContactForm />)

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/Phone Number/i), {
      target: { value: '123-456-7890' },
    })
    fireEvent.change(screen.getByLabelText(/Message/i), {
      target: { value: 'Test message' },
    })

    const submitButton = screen.getByRole('button', { name: /Send Message/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Thank you! We will contact you soon.')
    })

    alertSpy.mockRestore()
  })
})

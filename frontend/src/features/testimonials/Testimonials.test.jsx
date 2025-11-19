import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Testimonials from './Testimonials'

describe('Testimonials', () => {
  it('renders the first testimonial by default', () => {
    render(<Testimonials />)
    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.getByText('Syracuse, NY')).toBeInTheDocument()
  })

  it('navigates to next testimonial when next button is clicked', () => {
    render(<Testimonials />)
    const nextButton = screen.getByLabelText('Next testimonial')

    fireEvent.click(nextButton)

    expect(screen.getByText('Mary Johnson')).toBeInTheDocument()
    expect(screen.getByText('Auburn, NY')).toBeInTheDocument()
  })

  it('navigates to previous testimonial when prev button is clicked', () => {
    render(<Testimonials />)
    const prevButton = screen.getByLabelText('Previous testimonial')

    fireEvent.click(prevButton)

    // Should wrap to last testimonial
    expect(screen.getByText('Sarah Williams')).toBeInTheDocument()
    expect(screen.getByText('Fulton, NY')).toBeInTheDocument()
  })

  it('renders correct number of dot indicators', () => {
    render(<Testimonials />)
    const dots = screen.getAllByRole('button', { name: /Go to testimonial/i })
    expect(dots).toHaveLength(4)
  })

  it('navigates to specific testimonial when dot is clicked', () => {
    render(<Testimonials />)
    const thirdDot = screen.getByLabelText('Go to testimonial 3')

    fireEvent.click(thirdDot)

    expect(screen.getByText('Robert Davis')).toBeInTheDocument()
    expect(screen.getByText('Oswego, NY')).toBeInTheDocument()
  })
})

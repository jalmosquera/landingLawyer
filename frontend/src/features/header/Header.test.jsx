import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from './Header'

describe('Header', () => {
  it('renders the logo', () => {
    render(<Header />)
    const lawTexts = screen.getAllByText(/Law/i)
    expect(lawTexts.length).toBeGreaterThan(0)
  })

  it('renders navigation menu items', () => {
    render(<Header />)
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0)
    expect(screen.getAllByText('About').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Practice Areas').length).toBeGreaterThan(0)
  })

  it('renders phone number', () => {
    render(<Header />)
    const phoneLinks = screen.getAllByText(/\(315\) 255-3368/i)
    expect(phoneLinks.length).toBeGreaterThan(0)
  })

  it('toggles mobile menu when button is clicked', () => {
    render(<Header />)
    const menuButton = screen.getByLabelText('Toggle menu')

    fireEvent.click(menuButton)

    // Menu should be visible after click - check for menu titles
    expect(screen.getByText('MENU')).toBeInTheDocument()
    expect(screen.getByText('OFFICE')).toBeInTheDocument()
  })

  it('renders consultation button', () => {
    render(<Header />)
    const buttons = screen.getAllByText('Free Consultation')
    expect(buttons.length).toBeGreaterThan(0)
  })
})

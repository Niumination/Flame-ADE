import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TabBar } from './TabBar'
import { useTabs } from './useTabs'
import '@testing-library/jest-dom'

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn() as any
})

function resetStore() {
  useTabs.setState({ tabs: [], activeTabId: '' })
}

function addTab(kind: 'terminal' | 'editor' | 'preview' | 'ai-diff' | 'git' | 'settings' | 'markdown', label: string) {
  return useTabs.getState().addTab({ kind, label })
}

describe('TabBar', () => {
  beforeEach(() => {
    resetStore()
  })

  it('renders add button when empty', () => {
    render(<TabBar />)
    expect(screen.getByTestId('add-tab')).toBeInTheDocument()
  })

  it('renders tabs from store', () => {
    addTab('terminal', 'Terminal 1')
    addTab('terminal', 'Terminal 2')
    render(<TabBar />)
    expect(screen.getByText('Terminal 1')).toBeInTheDocument()
    expect(screen.getByText('Terminal 2')).toBeInTheDocument()
  })

  it('renders tab icons', () => {
    addTab('terminal', 'T')
    addTab('editor', 'E')
    addTab('git', 'G')
    render(<TabBar />)
    expect(screen.getByText('⬛')).toBeInTheDocument()
    expect(screen.getByText('📝')).toBeInTheDocument()
    expect(screen.getByText('⎇')).toBeInTheDocument()
  })

  it('adds terminal tab on add click', () => {
    render(<TabBar />)
    fireEvent.click(screen.getByTestId('add-tab'))
    const { tabs } = useTabs.getState()
    expect(tabs).toHaveLength(1)
    expect(tabs[0].kind).toBe('terminal')
  })

  it('increments terminal label on add click', () => {
    addTab('terminal', 'Terminal 1')
    render(<TabBar />)
    fireEvent.click(screen.getByTestId('add-tab'))
    const { tabs } = useTabs.getState()
    expect(tabs).toHaveLength(2)
    expect(tabs[1].label).toBe('Terminal 2')
  })

  it('sets active tab on click', () => {
    const id1 = addTab('terminal', 'T1')
    const id2 = addTab('terminal', 'T2')
    useTabs.getState().setActiveTab(id1)
    render(<TabBar />)
    fireEvent.click(screen.getByText('T2'))
    expect(useTabs.getState().activeTabId).toBe(id2)
  })

  it('removes tab on close button click', () => {
    addTab('terminal', 'T1')
    addTab('terminal', 'T2')
    render(<TabBar />)
    const closeButtons = screen.getAllByTestId('close-tab')
    fireEvent.click(closeButtons[0])
    expect(useTabs.getState().tabs).toHaveLength(1)
    expect(useTabs.getState().tabs[0].label).toBe('T2')
  })

  it('shows context menu on right-click', () => {
    addTab('terminal', 'T1')
    render(<TabBar />)
    const tab = screen.getByText('T1')
    fireEvent.contextMenu(tab)
    expect(screen.getByText('Duplikat')).toBeInTheDocument()
    expect(screen.getByText('Tutup Lainnya')).toBeInTheDocument()
    expect(screen.getByText('Tutup ke Kanan')).toBeInTheDocument()
    expect(screen.getByText('Tutup')).toBeInTheDocument()
  })

  it('duplicates tab via context menu', () => {
    addTab('editor', 'My File')
    render(<TabBar />)
    fireEvent.contextMenu(screen.getByText('My File'))
    fireEvent.click(screen.getByText('Duplikat'))
    const { tabs } = useTabs.getState()
    expect(tabs).toHaveLength(2)
    expect(tabs[1].label).toBe('My File (copy)')
  })

  it('closes other tabs via context menu', () => {
    const id = addTab('terminal', 'Keep')
    addTab('terminal', 'Remove1')
    addTab('terminal', 'Remove2')
    render(<TabBar />)
    fireEvent.contextMenu(screen.getByText('Keep'))
    fireEvent.click(screen.getByText('Tutup Lainnya'))
    const { tabs } = useTabs.getState()
    expect(tabs).toHaveLength(1)
    expect(tabs[0].id).toBe(id)
  })

  it('closes tab via context menu Close option', () => {
    addTab('terminal', 'ToClose')
    addTab('terminal', 'Remain')
    render(<TabBar />)
    fireEvent.contextMenu(screen.getByText('ToClose'))
    fireEvent.click(screen.getByText('Tutup'))
    const { tabs } = useTabs.getState()
    expect(tabs).toHaveLength(1)
    expect(tabs[0].label).toBe('Remain')
  })

  it('closes context menu on outside click', () => {
    addTab('terminal', 'T1')
    render(<TabBar />)
    fireEvent.contextMenu(screen.getByText('T1'))
    expect(screen.getByText('Duplikat')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('Duplikat')).not.toBeInTheDocument()
  })
})

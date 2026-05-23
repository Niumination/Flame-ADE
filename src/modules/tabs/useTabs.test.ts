import { describe, it, expect, beforeEach } from 'vitest'
import { useTabs } from './useTabs'

function resetStore() {
  useTabs.setState({ tabs: [], activeTabId: '' })
}

describe('useTabs store', () => {
  beforeEach(() => {
    resetStore()
  })

  it('starts with no tabs', () => {
    const { tabs, activeTabId } = useTabs.getState()
    expect(tabs).toHaveLength(0)
    expect(activeTabId).toBe('')
  })

  it('adds a terminal tab', () => {
    const id = useTabs.getState().addTab({ kind: 'terminal', label: 'Terminal 1' })
    const { tabs, activeTabId } = useTabs.getState()
    expect(tabs).toHaveLength(1)
    expect(tabs[0].kind).toBe('terminal')
    expect(tabs[0].label).toBe('Terminal 1')
    expect(tabs[0].id).toBeTruthy()
    expect(activeTabId).toBe(id)
  })

  it('generates sequential IDs', () => {
    const id1 = useTabs.getState().addTab({ kind: 'terminal', label: 'T1' })
    const id2 = useTabs.getState().addTab({ kind: 'editor', label: 'E1' })
    expect(id1).toBeTruthy()
    expect(id2).toBeTruthy()
    expect(id1).not.toBe(id2)
    // IDs are sequential (tab-1, tab-2, ...)
    expect(Number(id1.split('-')[1])).toBeLessThan(Number(id2.split('-')[1]))
  })

  it('adds multiple kinds', () => {
    useTabs.getState().addTab({ kind: 'terminal', label: 'T' })
    useTabs.getState().addTab({ kind: 'editor', label: 'E' })
    useTabs.getState().addTab({ kind: 'preview', label: 'P' })
    useTabs.getState().addTab({ kind: 'ai-diff', label: 'D' })
    useTabs.getState().addTab({ kind: 'git', label: 'G' })
    expect(useTabs.getState().tabs).toHaveLength(5)
  })

  it('sets active tab on add', () => {
    useTabs.getState().addTab({ kind: 'terminal', label: 'T1' })
    const id2 = useTabs.getState().addTab({ kind: 'terminal', label: 'T2' })
    expect(useTabs.getState().activeTabId).toBe(id2)
  })

  it('removes a tab', () => {
    const id = useTabs.getState().addTab({ kind: 'terminal', label: 'T' })
    useTabs.getState().removeTab(id)
    expect(useTabs.getState().tabs).toHaveLength(0)
    expect(useTabs.getState().activeTabId).toBe('')
  })

  it('switches to nearest tab on remove (last)', () => {
    const id1 = useTabs.getState().addTab({ kind: 'terminal', label: 'T1' })
    const id2 = useTabs.getState().addTab({ kind: 'terminal', label: 'T2' })
    useTabs.getState().removeTab(id2)
    expect(useTabs.getState().activeTabId).toBe(id1)
  })

  it('switches to nearest tab on remove (first)', () => {
    const id1 = useTabs.getState().addTab({ kind: 'terminal', label: 'T1' })
    const id2 = useTabs.getState().addTab({ kind: 'terminal', label: 'T2' })
    useTabs.getState().setActiveTab(id1)
    useTabs.getState().removeTab(id1)
    expect(useTabs.getState().activeTabId).toBe(id2)
    expect(useTabs.getState().tabs).toHaveLength(1)
  })

  it('keeps active tab if removing non-active', () => {
    const id1 = useTabs.getState().addTab({ kind: 'terminal', label: 'T1' })
    const id2 = useTabs.getState().addTab({ kind: 'terminal', label: 'T2' })
    useTabs.getState().removeTab(id1)
    expect(useTabs.getState().activeTabId).toBe(id2)
  })

  it('sets active tab', () => {
    const id1 = useTabs.getState().addTab({ kind: 'terminal', label: 'T1' })
    const id2 = useTabs.getState().addTab({ kind: 'terminal', label: 'T2' })
    useTabs.getState().setActiveTab(id1)
    expect(useTabs.getState().activeTabId).toBe(id1)
    useTabs.getState().setActiveTab(id2)
    expect(useTabs.getState().activeTabId).toBe(id2)
  })

  it('updates a tab', () => {
    const id = useTabs.getState().addTab({ kind: 'terminal', label: 'T' })
    useTabs.getState().updateTab(id, { label: 'Renamed', cwd: '/tmp' })
    const tab = useTabs.getState().tabs[0]
    expect(tab.label).toBe('Renamed')
    expect(tab.cwd).toBe('/tmp')
    expect(tab.kind).toBe('terminal')
  })

  it('moves a tab', () => {
    const id1 = useTabs.getState().addTab({ kind: 'terminal', label: 'T1' })
    const id2 = useTabs.getState().addTab({ kind: 'terminal', label: 'T2' })
    const id3 = useTabs.getState().addTab({ kind: 'terminal', label: 'T3' })
    useTabs.getState().moveTab(2, 0)
    const tabs = useTabs.getState().tabs
    expect(tabs[0].id).toBe(id3)
    expect(tabs[1].id).toBe(id1)
    expect(tabs[2].id).toBe(id2)
  })

  it('duplicates a tab', () => {
    const id = useTabs.getState().addTab({ kind: 'editor', label: 'Editor', cwd: '/home' })
    useTabs.getState().duplicateTab(id)
    const tabs = useTabs.getState().tabs
    expect(tabs).toHaveLength(2)
    expect(tabs[1].label).toBe('Editor (copy)')
    expect(tabs[1].cwd).toBe('/home')
    expect(tabs[1].kind).toBe('editor')
  })

  it('closes other tabs', () => {
    const id1 = useTabs.getState().addTab({ kind: 'terminal', label: 'T1' })
    useTabs.getState().addTab({ kind: 'terminal', label: 'T2' })
    useTabs.getState().addTab({ kind: 'terminal', label: 'T3' })
    useTabs.getState().closeOtherTabs(id1)
    expect(useTabs.getState().tabs).toHaveLength(1)
    expect(useTabs.getState().tabs[0].id).toBe(id1)
    expect(useTabs.getState().activeTabId).toBe(id1)
  })

  it('closes tabs to the right', () => {
    const id1 = useTabs.getState().addTab({ kind: 'terminal', label: 'T1' })
    const id2 = useTabs.getState().addTab({ kind: 'terminal', label: 'T2' })
    useTabs.getState().addTab({ kind: 'terminal', label: 'T3' })
    useTabs.getState().setActiveTab(id2)
    useTabs.getState().closeTabsToRight(id2)
    expect(useTabs.getState().tabs).toHaveLength(2)
    expect(useTabs.getState().tabs.map((t) => t.id)).toEqual([id1, id2])
  })

  it('ignores closeTabsToRight for last tab', () => {
    useTabs.getState().addTab({ kind: 'terminal', label: 'T1' })
    const id2 = useTabs.getState().addTab({ kind: 'terminal', label: 'T2' })
    useTabs.getState().closeTabsToRight(id2)
    expect(useTabs.getState().tabs).toHaveLength(2)
  })

  it('returns correct icons via getTabIcon', () => {
    const { getTabIcon } = useTabs.getState()
    expect(getTabIcon('terminal')).toBe('⬛')
    expect(getTabIcon('editor')).toBe('📝')
    expect(getTabIcon('preview')).toBe('🌐')
    expect(getTabIcon('ai-diff')).toBe('📊')
    expect(getTabIcon('git')).toBe('⎇')
  })

  it('handles remove on empty store gracefully', () => {
    expect(() => useTabs.getState().removeTab('nonexistent')).not.toThrow()
  })

  it('handles duplicate on nonexistent tab gracefully', () => {
    expect(() => useTabs.getState().duplicateTab('nonexistent')).not.toThrow()
  })

  it('handles moveTab with same index', () => {
    const id = useTabs.getState().addTab({ kind: 'terminal', label: 'T' })
    useTabs.getState().moveTab(0, 0)
    expect(useTabs.getState().tabs).toHaveLength(1)
    expect(useTabs.getState().tabs[0].id).toBe(id)
  })
})

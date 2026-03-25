import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ensureAppInitialized, refreshAppCache } from '@/lib/appInitialization'
import { teamMemberCache } from '@/lib/teamMemberCache'

vi.mock('@/lib/teamMemberCache')
vi.mock('@/lib/apiInitializer')

describe('App Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize team member cache and outlier detection', async () => {
    const mockInit = vi.fn().mockResolvedValue(undefined)
    vi.mocked(teamMemberCache.init).mockImplementation(mockInit)

    await ensureAppInitialized()

    expect(mockInit).toHaveBeenCalled()
  })

  it('should refresh cache on request', async () => {
    const mockReset = vi.fn()
    const mockInit = vi.fn().mockResolvedValue(undefined)
    vi.mocked(teamMemberCache.reset).mockImplementation(mockReset)
    vi.mocked(teamMemberCache.init).mockImplementation(mockInit)

    await refreshAppCache()

    expect(mockReset).toHaveBeenCalled()
    expect(mockInit).toHaveBeenCalled()
  })
})

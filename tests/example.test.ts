import { describe, it, expect } from 'vitest'
import { version } from '../src/index'

describe('SDK Initialization', () => {
  it('should export version', () => {
    expect(version).toBe('0.1.0')
  })
})

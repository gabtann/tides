import { describe, expect, it } from 'vitest'
import { formatRelativeTime } from './relativeTime'

const now = new Date('2026-09-24T12:00:00.000Z')
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString()
const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('formatRelativeTime', () => {
  it.each([
    [0, 'just now'],
    [59 * SECOND, 'just now'],
    [1 * MINUTE, '1m ago'],
    [12 * MINUTE, '12m ago'],
    [59 * MINUTE + 59 * SECOND, '59m ago'],
    [1 * HOUR, '1h ago'],
    [2 * HOUR + 30 * MINUTE, '2h ago'],
    [23 * HOUR + 59 * MINUTE, '23h ago'],
    [1 * DAY, '1d ago'],
    [3 * DAY, '3d ago'],
  ])('formats %i ms ago as %s', (ms, expected) => {
    expect(formatRelativeTime(ago(ms), now)).toBe(expected)
  })

  it('treats timestamps slightly in the future (clock skew) as just now', () => {
    expect(formatRelativeTime(new Date(now.getTime() + 5 * MINUTE).toISOString(), now)).toBe('just now')
  })

  it('returns an empty string for an invalid timestamp', () => {
    expect(formatRelativeTime('not a date', now)).toBe('')
  })
})

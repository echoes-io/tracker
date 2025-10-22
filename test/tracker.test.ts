import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Tracker } from '../index.js'

describe('Tracker', () => {
  let tracker: Tracker

  beforeEach(async () => {
    tracker = new Tracker(':memory:')
    await tracker.init()
  })

  afterEach(async () => {
    await tracker.close()
  })

  describe('Timeline operations', () => {
    it('should create and retrieve timeline', async () => {
      const timeline = await tracker.createTimeline({
        name: 'test-timeline',
        title: 'Test Timeline'
      })

      expect(timeline.name).toBe('test-timeline')
      expect(timeline.title).toBe('Test Timeline')
      expect(timeline.id).toBeDefined()

      const retrieved = await tracker.getTimeline('test-timeline')
      expect(retrieved).toEqual(timeline)
    })
  })
})

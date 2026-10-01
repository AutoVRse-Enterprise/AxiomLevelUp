import type { ImageRegion } from '@/content/schema/primitives'

export function regionCenter(region: ImageRegion): { x: number; y: number } {
  switch (region.shape) {
    case 'circle':
      return { x: region.x, y: region.y }
    case 'rect':
      return { x: region.x + region.width / 2, y: region.y + region.height / 2 }
    case 'polygon':
      return {
        x: region.points.reduce((sum, point) => sum + point.x, 0) / region.points.length,
        y: region.points.reduce((sum, point) => sum + point.y, 0) / region.points.length,
      }
  }
}

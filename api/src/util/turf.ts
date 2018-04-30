import lineIntersect from '@turf/line-intersect'
import lineOverlap from '@turf/line-overlap'
import { lineString } from '@turf/helpers'

export const intersection = (startA, endA, startB, endB) => {
  const line1 = lineString([[startA.lat, startA.lng], [endA.lat, endA.lng]])
  const line2 = lineString([[startB.lat, startB.lng], [endB.lat, endB.lng]])

  const intersection = lineIntersect(line1, line2)

  if (!intersection.features.length) return null
  const lat = intersection.features[0].geometry.coordinates[0]
  const lng = intersection.features[0].geometry.coordinates[1]

  // if (lat === startA.lat && lng === startA.lng) return null
  // if (lat === endA.lat && lng === endA.lng) return null
  // if (lat === startB.lat && lng === startB.lng) return null
  // if (lat === endB.lat && lng === endB.lng) return null

  return { lat, lng }
}

// export const overlaps = (start, end, point, point2) => {
//   const line = lineString([[start.lat, start.lng], [end.lat, end.lng]])
//   const pt = lineString([[point.lat, point.lng], [point2.lat, point2.lng]])
//   return !!lineOverlap(line, pt).features.length
// }

export const overlaps = (start, end, point, tolerance = 6e-5) => {
  if (start.lat > end.lat) {
    const temp = { ...start }
    start = { ...end }
    end = { ...temp }
  }
  const f = x =>
    (end.lng - start.lng) / (end.lat - start.lat) * (x - start.lat) + start.lng

  return (
    Math.abs(f(point.lat) - point.lng) < tolerance &&
    point.lat >= start.lat &&
    point.lat <= end.lat
  )
}

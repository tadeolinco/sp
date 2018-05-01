import toRadians from './toRadians'

const computeDistance = (from, to): number => {
  const R = 6371e3 // metres
  const φ1 = toRadians(from.lat)
  const φ2 = toRadians(to.lat)
  const Δφ = toRadians(to.lat - from.lat)
  const Δλ = toRadians(to.lng - from.lng)

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export default computeDistance

const manhattanDistance = (a, b) =>
  Math.sqrt(Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2))

export default manhattanDistance

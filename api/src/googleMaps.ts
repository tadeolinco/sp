import { createClient } from '@google/maps'

const googleMaps = createClient({
  key: 'AIzaSyCsmniogYj-rg23fhKjRH21QkUz3VoyP-o',
  Promise: Promise,
})

export const snapToRoads = async path => {
  const response = await googleMaps
    .snapToRoads({
      path,
      interpolate: true,
    })
    .asPromise()

  if (!response.json.snappedPoints) {
    return null
  }

  const points = response.json.snappedPoints.map(({ location }) => ({
    lat: location.latitude,
    lng: location.longitude,
  }))

  const pointsMap = {}
  const distinctPoints = points.filter(point => {
    if (!pointsMap[`${point.lat},${point.lng}`]) {
      pointsMap[`${point.lat},${point.lng}`] = true
      return true
    }
    return false
  })

  return distinctPoints
}

export const getDistance = async (origin, destination, mode = 'walking') => {
  const response = await googleMaps
    .distanceMatrix({
      origins: [origin],
      destinations: [destination],
      mode,
    })
    .asPromise()

  return response.json.rows[0].elements[0].distance.value
}

export const getDirections = async (origin, destination) => {
  const response = await googleMaps
    .directions({
      origin,
      destination,
      mode: 'walking',
    })
    .asPromise()

  return response.json.routes[0].overview_polyline.points
}

export const placesAutocomplete = async input => {
  const response = await googleMaps
    .placesAutoComplete({ input, components: { country: 'ph' } })
    .asPromise()

  return Promise.all(
    response.json.predictions.map((x: any) => getPlaceById(x.place_id))
  )
}

export const getPlace = async latlng => {
  const response = await googleMaps.reverseGeocode({ latlng }).asPromise()
  const { formatted_address, place_id, geometry } = response.json.results[0]
  const place = {
    name: formatted_address,
    place_id,
    location: geometry.location,
  }

  const map = { [place.name]: place.place_id }
  let options: any = await placesAutocomplete(place.name)
  for (const option of options) {
    if (map[option.name]) continue
    map[option.name] = map[option.place_id]
  }
  options = Object.keys(map).map(name => ({ name, place_id: map[name] }))

  return { place, options }
}

export const getPlaceById = async placeid => {
  const response = await googleMaps.place({ placeid }).asPromise()
  const { formatted_address, geometry, place_id } = response.json.result
  return {
    name: formatted_address,
    location: geometry.location,
    place_id,
  }
}

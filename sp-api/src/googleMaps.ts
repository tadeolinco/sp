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
  return response.json.predictions.map(({ description, place_id }) => ({
    name: description,
    place_id,
  }))
}

export const getPlace = async latlng => {
  const response = await googleMaps.reverseGeocode({ latlng }).asPromise()
  const {
    formatted_address,
    place_id,
  } = response.json.results[0].formatted_address
  const place = {
    name: formatted_address,
    place_id,
  }
  const options = await placesAutocomplete(place)
  if (!options.find(option => option.name == place)) {
    options.push(place)
  }
  return { place, options }
}

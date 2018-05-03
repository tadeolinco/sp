import React from 'react'
import { Marker } from 'react-google-maps'

import jeepIcon from './assets/jeep.svg'
import busIcon from './assets/bus.svg'
import truckIcon from './assets/truck.svg'
import trainIcon from './assets/train.svg'
import taxiIcon from './assets/taxi.svg'

const VehicleMarker = ({ path, handleClick }) => {
  const { mode } = path
  let icon = ''
  if (mode === 'Jeepney') icon = jeepIcon
  if (mode === 'Bus') icon = busIcon
  if (mode === 'Train') icon = trainIcon
  if (mode === 'Shuttle Service') icon = truckIcon
  if (mode === 'UV Express') icon = taxiIcon

  return (
    <Marker
      position={{
        lat: path.nodes[0].lat,
        lng: path.nodes[0].lng,
      }}
      onClick={handleClick}
      icon={icon}
    />
  )
}

export default VehicleMarker

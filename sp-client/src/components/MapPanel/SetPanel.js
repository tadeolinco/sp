import { Button } from 'semantic-ui-react'
import { InfoWindow } from 'react-google-maps'
import React from 'react'

const SetPanel = ({
  position,
  onCloseClick,
  setPlace,
  origin,
  destination,
}) => {
  return (
    <InfoWindow position={position} onCloseClick={onCloseClick}>
      <div style={{ marginLeft: 25 }}>
        <br />
        <Button
          fluid
          loading={origin.loadingPlace}
          color="blue"
          onClick={() => {
            setPlace('origin')
          }}
        >
          Origin
        </Button>
        <br />
        <Button
          color="red"
          fluid
          loading={destination.loadingPlace}
          onClick={() => {
            setPlace('destination')
          }}
        >
          Destination
        </Button>
      </div>
    </InfoWindow>
  )
}

export default SetPanel

import React from 'react'
import { InfoWindow } from 'react-google-maps'
import { Button } from 'semantic-ui-react'

const SetPanel = ({
  position,
  onCloseClick,
  handleSetPlace,
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
            handleSetPlace('origin')
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
            handleSetPlace('destination')
          }}
        >
          Destination
        </Button>
      </div>
    </InfoWindow>
  )
}

export default SetPanel

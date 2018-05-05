import React from 'react'
import { InfoWindow } from 'react-google-maps'
import { Icon, Button } from 'semantic-ui-react'
import { withSession } from '../../providers/SessionProvider'
import EditRouteFormModal from './EditRouteFormModal'
import DeleteRouteModal from './DeleteRouteModal'

const RouteMarker = ({
  selectedRoute,
  path,
  onCloseClick,
  handleToggleReport,
  session,
  mapPanel,
}) => {
  if (!selectedRoute) return null

  return (
    <InfoWindow
      position={{
        lat: selectedRoute.nodes[0].lat,
        lng: selectedRoute.nodes[0].lng,
      }}
      onCloseClick={onCloseClick}
    >
      <div style={{ color: '#1b1c1d', width: 146 }}>
        <div style={{ fontWeight: 'bold' }}>Mode of Transportation</div>
        <div>{selectedRoute.mode}</div>
        <div style={{ fontWeight: 'bold', paddingTop: 4 }}>Description</div>
        <div>{selectedRoute.description || 'None'}</div>
        <div style={{ paddingTop: 4, width: '100%' }}>
          {!session.user || session.user.id !== selectedRoute.ownerId ? (
            <div style={{ float: 'right' }}>
              <span>{selectedRoute.reporterIds.length}</span>{' '}
              <Icon
                onClick={handleToggleReport}
                style={{ cursor: 'pointer' }}
                size="large"
                name="thumbs outline down"
                disabled={!session.user}
                color={
                  !selectedRoute.reporterIds.find(
                    id => session.user && session.user.id === id
                  )
                    ? 'black'
                    : 'red'
                }
              />
            </div>
          ) : (
            <div style={{ display: 'flex' }}>
              <EditRouteFormModal
                mapPanel={mapPanel}
                trigger={
                  <Button style={{ flex: 1 }} color="blue" compact size="tiny">
                    Update
                  </Button>
                }
              />
              <DeleteRouteModal
                mapPanel={mapPanel}
                trigger={
                  <Button style={{ flex: 1 }} color="red" compact size="tiny">
                    Remove
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </InfoWindow>
  )
}

export default withSession(RouteMarker)

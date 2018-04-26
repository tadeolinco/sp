import { ADD_ROUTE, DEBOUNCE_ACTIONS, MAP_MODE } from '../../constants'
import { Button, Icon } from 'semantic-ui-react'
import {
  GoogleMap,
  Marker,
  Polyline,
  withGoogleMap,
  withScriptjs,
} from 'react-google-maps'
import React, { Component, Fragment } from 'react'
import { compose, withProps } from 'recompose'

import Axios from 'axios'
import RouteFormModal from './RouteFormModal'
import SearchPanel from './SearchPanel'
import SetPanel from './SetPanel'
import debounce from '../../util/debounce'
import destinationLogo from './assets/destination.svg'
import mapStyles from './style.json'
import originLogo from './assets/origin.svg'
import qs from 'qs'
import { withNotifications } from '../../providers/NotificationsProvider'
import { withPlatform } from '../../providers/PlatformProvider'

class MapPanel extends Component {
  initialState = {
    visibleSetPanel: false,
    addingRoute: null,
    newPath: [],
    tentativePath: [],
    undos: [],
    destinationDropped: false,
    loadingPath: false,
    setPanelPosition: { lat: 0, lng: 0 },
    origin: {
      place_id: null,
      lat: 0,
      lng: 0,
      options: [],
      loadingPlace: false,
      loadingOptions: false,
    },
    destination: {
      place_id: null,
      lat: 0,
      lng: 0,
      options: [],
      loadingPlace: false,
      loadingOptions: false,
    },
  }
  state = { ...this.initialState }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.mapMode !== this.props.mapMode) {
      this.setState({ ...this.initialState })
      if (this.props.mapMode === MAP_MODE.ADD_ROUTE) {
        this.setState({
          origin: {
            ...this.initialState.origin,
            lat: this.mapRef.getCenter().lat(),
            lng: this.mapRef.getCenter().lng(),
          },
          addingRoute: ADD_ROUTE.SETTING_ORIGIN,
        })
        this.props.toggleSearchPanel(false)
      }
    }
  }

  handleManually = (event, ...args) => {
    this.mapRef.context.__SECRET_MAP_DO_NOT_USE_OR_YOU_WILL_BE_FIRED[event](
      ...args
    )
  }

  handleMapClick = async e => {
    const { mapMode } = this.props
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    if (mapMode === MAP_MODE.VIEW)
      this.setState({
        visibleSetPanel: true,
        setPanelPosition: { lat, lng },
      })
    if (mapMode === MAP_MODE.ADD_ROUTE) {
      if (this.state.addingRoute === ADD_ROUTE.SETTING_ORIGIN) {
        this.setState({ origin: { ...this.state.origin, lat, lng } })
        this.handleManually('setCenter', { lat, lng })
      } else if (this.state.addingRoute === ADD_ROUTE.ADDING_POINTS) {
        this.setState({
          destination: { ...this.state.destination, lat, lng },
          loadingPath: true,
        })
        const lastNode = this.state.newPath[this.state.newPath.length - 1]
        const {
          data: { path },
        } = await Axios.get(
          '/api/snapToRoad?' + qs.stringify({ path: [lastNode, { lat, lng }] })
        )
        this.setState({ tentativePath: path, loadingPath: false })
        this.handleApplyTentativePath()
      }
    }
  }

  handleCloseSetPanel = () => {
    this.setState({ visibleSetPanel: false })
  }

  handleFitMarkers = () => {
    const { LatLng, LatLngBounds } = window.google.maps

    const originLocation = new LatLng(
      this.state.origin.lat,
      this.state.origin.lng
    )
    const destinationLocation = new LatLng(
      this.state.destination.lat,
      this.state.destination.lng
    )
    if (this.state.origin.place_id && this.state.destination.place_id) {
      const bounds = new LatLngBounds()

      if (this.state.origin.place_id) {
        bounds.extend(originLocation)
      }
      if (this.state.destination.place_id) {
        bounds.extend(destinationLocation)
      }
      this.mapRef.fitBounds(bounds)
    } else if (this.state.origin.place_id) {
      this.mapRef.panTo(originLocation)
    } else if (this.state.destination.place_id) {
      this.mapRef.panTo(destinationLocation)
    }
  }

  handleSetPlace = async place => {
    try {
      this.setState({
        [place]: {
          ...this.state[place],
          loadingPlace: true,
        },
      })

      let { data } = await Axios.get(
        '/api/place?' +
          qs.stringify({
            lat: this.state.setPanelPosition.lat,
            lng: this.state.setPanelPosition.lng,
          })
      )
      if (this.props.mapMode !== MAP_MODE.VIEW) return

      this.setState(
        {
          [place]: {
            ...this.state[place],
            place_id: data.place.place_id,
            lat: this.state.setPanelPosition.lat,
            lng: this.state.setPanelPosition.lng,
            options: data.options.map((place, index) => ({
              text: place.name,
              value: place.place_id,
              key: index,
            })),
          },
          visibleSetPanel: false,
        },
        () => {
          this.handleFitMarkers()
          this.props.toggleSearchPanel(true)
        }
      )
    } catch ({ response }) {
      this.props.notifications.addMessage(response.data.message, 'error')
    } finally {
      this.setState({
        [place]: {
          ...this.state[place],
          loadingPlace: false,
        },
      })
    }
  }

  handleSearch = (place, value) => {
    if (value) {
      this.setState({
        [place]: {
          ...this.state[place],
          loadingOptions: true,
        },
      })
      debounce(DEBOUNCE_ACTIONS.GET_PLACES, 1000, async () => {
        try {
          const { data } = await Axios.get(
            '/api/places?' + qs.stringify({ input: value })
          )
          this.setState({
            [place]: {
              ...this.state[place],
              options: data.places.map((place, index) => ({
                text: place.name,
                value: place.place_id,
                key: index,
              })),
            },
          })
        } catch ({ response }) {
          this.props.notifications.addMessage(response.data.message, 'error')
        } finally {
          this.setState({
            [place]: {
              ...this.state[place],
              loadingOptions: false,
            },
          })
        }
      })
    }
  }

  handleSearchPanelChange = async (place, value) => {
    this.setState({
      [place]: {
        ...this.state[place],
        loadingOptions: true,
      },
    })
    try {
      const { data } = await Axios.get(`/api/place/${value}`)
      this.setState(
        {
          [place]: {
            ...this.state[place],
            place_id: data.place_id,
            lat: data.location.lat,
            lng: data.location.lng,
          },
        },
        this.handleFitMarkers
      )
    } catch ({ response }) {
      this.props.notifications.addMessage(response.data.message, 'error')
    } finally {
      this.setState({
        [place]: {
          ...this.state[place],
          loadingOptions: false,
        },
      })
    }
  }

  handleGetPath = e => {
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    this.setState({ destination: { ...this.state.destination, lat, lng } })
    debounce(DEBOUNCE_ACTIONS.GET_PATH, 200, async () => {
      const lastNode = this.state.newPath[this.state.newPath.length - 1]
      this.setState({ loadingPath: true })
      const {
        data: { path },
      } = await Axios.get(
        '/api/snapToRoad?' + qs.stringify({ path: [lastNode, { lat, lng }] })
      )

      if (!this.state.destinationDropped) {
        this.setState({ tentativePath: path })
      }
      this.setState({ loadingPath: false })
    })
  }

  handleUndo = e => {
    if (this.state.newPath.length === 1) {
      this.setState({
        addingRoute: ADD_ROUTE.SETTING_ORIGIN,
        newPath: [],
        tentativePath: [],
        undos: [],
      })
      this.handleManually('setCenter', {
        lat: this.state.origin.lat,
        lng: this.state.origin.lng,
      })
    } else {
      const undos = this.state.undos
      const last = undos.pop()
      this.setState({
        undos,
        newPath: this.state.newPath.slice(
          0,
          this.state.newPath.length - last.length
        ),
        destination: {
          ...this.state.destination,
          lat: last.lat,
          lng: last.lng,
        },
        tentativePath: [],
      })

      this.handleManually('setCenter', { lat: last.lat, lng: last.lng })
    }
  }

  handleSetOrigin = () => {
    const { lat, lng } = this.state.origin
    this.setState({
      addingRoute: ADD_ROUTE.ADDING_POINTS,
      destination: { ...this.state.destination, lat, lng },
      newPath: [{ lat, lng }],
    })
  }

  handleApplyTentativePath = () => {
    this.setState({ destinationDropped: true })
    const lastNode = this.state.tentativePath[
      this.state.tentativePath.length - 1
    ]

    if (!lastNode) {
      return this.setState({
        destination: {
          ...this.state.destination,
          lat: this.state.newPath[this.state.newPath.length - 1].lat,
          lng: this.state.newPath[this.state.newPath.length - 1].lng,
        },
      })
    }
    this.setState({
      newPath: this.state.newPath.concat(this.state.tentativePath),
      undos: this.state.undos.concat({
        length: this.state.tentativePath.length,
        lat: this.state.newPath[this.state.newPath.length - 1].lat,
        lng: this.state.newPath[this.state.newPath.length - 1].lng,
      }),
      tentativePath: [],
      destination: {
        ...this.state.destination,
        lat: lastNode.lat,
        lng: lastNode.lng,
      },
    })
    this.handleManually('setCenter', { lat: lastNode.lat, lng: lastNode.lng })
  }

  render() {
    const options = {
      styles: mapStyles,
      disableDefaultUI: true,
    }
    return (
      <Fragment>
        {this.props.visibleSearchPanel && (
          <SearchPanel
            handleSearchPanelChange={this.handleSearchPanelChange}
            handleSearch={this.handleSearch}
            origin={this.state.origin}
            destination={this.state.destination}
          />
        )}
        {this.state.addingRoute === ADD_ROUTE.SETTING_ORIGIN && (
          <div
            style={{
              position: 'absolute',
              top: this.props.topHeight,
              width: '100%',
            }}
          >
            <Button
              color="blue"
              fluid
              style={{ borderRadius: 0 }}
              onClick={this.handleSetOrigin}
            >
              Set Origin
            </Button>
          </div>
        )}
        {this.state.addingRoute === ADD_ROUTE.SETTING_ORIGIN && (
          <div style={{ position: 'absolute', bottom: 0, width: '100%' }}>
            <Button
              color="red"
              fluid
              style={{ borderRadius: 0 }}
              onClick={() => this.props.changeMapMode(MAP_MODE.VIEW)}
            >
              <Icon name="undo" />
              Back
            </Button>
          </div>
        )}
        {this.state.addingRoute === ADD_ROUTE.ADDING_POINTS && (
          <div style={{ position: 'absolute', bottom: 0, width: '100%' }}>
            <Button
              loading={this.state.loadingPath}
              color="red"
              fluid
              style={{ borderRadius: 0 }}
              onClick={this.handleUndo}
            >
              <Icon name="undo" />
              Undo
            </Button>
          </div>
        )}
        {this.state.addingRoute === ADD_ROUTE.ADDING_POINTS &&
          this.state.newPath.length > 1 && (
            <div
              style={{
                position: 'absolute',
                top: this.props.topHeight,
                width: '100%',
              }}
            >
              <RouteFormModal
                mapPanel={this}
                trigger={
                  <Button
                    color="blue"
                    fluid
                    style={{ borderRadius: 0 }}
                    onClick={this.undo}
                  >
                    <Icon name="check" />
                    Done
                  </Button>
                }
              />
            </div>
          )}
        <GoogleMap
          ref={mapRef => (this.mapRef = mapRef)}
          clickableIcons={false}
          defaultCenter={{ lat: 14.1686279, lng: 121.2424038 }}
          defaultZoom={14}
          options={options}
          onClick={this.handleMapClick}
        >
          {this.props.mapMode === MAP_MODE.VIEW && (
            <Fragment>
              {this.state.visibleSetPanel && (
                <SetPanel
                  origin={this.state.origin}
                  destination={this.state.destination}
                  handleSetPlace={this.handleSetPlace}
                  position={this.state.setPanelPosition}
                  onCloseClick={this.handleCloseSetPanel}
                />
              )}
              {this.state.origin.place_id && (
                <Marker
                  icon={originLogo}
                  position={{
                    lat: this.state.origin.lat,
                    lng: this.state.origin.lng,
                  }}
                />
              )}
              {this.state.destination.place_id && (
                <Marker
                  icon={destinationLogo}
                  position={{
                    lat: this.state.destination.lat,
                    lng: this.state.destination.lng,
                  }}
                />
              )}
            </Fragment>
          )}
          {this.props.mapMode === MAP_MODE.ADD_ROUTE && (
            <Fragment>
              {this.state.addingRoute === ADD_ROUTE.ADDING_POINTS && (
                <Fragment>
                  <Marker
                    draggable
                    icon={destinationLogo}
                    onDrag={this.handleGetPath}
                    onDragStart={() => {
                      this.setState({ destinationDropped: false })
                    }}
                    onDragEnd={this.handleApplyTentativePath}
                    position={{
                      lat: this.state.destination.lat,
                      lng: this.state.destination.lng,
                    }}
                  />
                  <Polyline
                    options={{
                      strokeColor: '#db2828',
                      strokeWeight: 5,
                    }}
                    path={[
                      this.state.newPath[this.state.newPath.length - 1],
                    ].concat(this.state.tentativePath)}
                  />
                  <Polyline
                    options={{
                      strokeColor: '#2185d0',
                      strokeWeight: 5,
                    }}
                    path={this.state.newPath}
                  />
                </Fragment>
              )}
              <Marker
                draggable={this.state.addingRoute === ADD_ROUTE.SETTING_ORIGIN}
                onDragEnd={this.handleMapClick}
                icon={originLogo}
                position={{
                  lat: this.state.origin.lat,
                  lng: this.state.origin.lng,
                }}
              />
            </Fragment>
          )}
        </GoogleMap>
      </Fragment>
    )
  }
}

export default withPlatform(
  withNotifications(
    compose(
      withProps({
        googleMapURL:
          'https://maps.googleapis.com/maps/api/js?key=AIzaSyCsmniogYj-rg23fhKjRH21QkUz3VoyP-o&v=3.exp&libraries=geometry,drawing,places',
        loadingElement: <div id="loadingelement" style={{ height: `100%` }} />,
        mapElement: <div id="mapelement" style={{ height: `100%` }} />,
      }),
      withScriptjs,
      withGoogleMap
    )(MapPanel)
  )
)

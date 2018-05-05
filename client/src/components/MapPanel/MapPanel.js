import Axios from 'axios'
import qs from 'qs'
import React, { Component, Fragment } from 'react'
import {
  GoogleMap,
  Marker,
  Polyline,
  InfoWindow,
  withGoogleMap,
  withScriptjs,
} from 'react-google-maps'
import { compose, withProps } from 'recompose'
import { Button, Icon, Divider } from 'semantic-ui-react'
import { ADD_ROUTE, DEBOUNCE_ACTIONS, MAP_MODE } from '../../constants'
import { withNotifications } from '../../providers/NotificationsProvider'
import { withPlatform } from '../../providers/PlatformProvider'
import { withSession } from '../../providers/SessionProvider'
import debounce from '../../util/debounce'
import RouteFormModal from './RouteFormModal'
import SearchPanel from './SearchPanel'
import SetPanel from './SetPanel'
import destinationLogo from './assets/destination.svg'
import originLogo from './assets/origin.svg'
import mapStyles from './style.json'
import VehicleMarker from './VehicleMarker'
import { withMapSize } from '../../providers/MapSizeProvider'
import RouteMarker from './RouteMarker'

const assortedColors = [
  '#db2828',
  '#f2711c',
  '#fbbd08',
  '#b5cc18',
  '#21ba45',
  '#00b5ad',
  '#2185d0',
  '#6435c9',
  '#a333c8',
  '#e03997',
]

class MapPanel extends Component {
  initialState = {
    selectedRoute: null,
    settingOrigin: false,
    visibleSearchPanel: true,
    routes: [],
    visibleSetPanel: false,
    addingRoute: null,
    path: [],
    gettingPath: false,
    visiblePath: false,
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

  toggleSearchPanel = visibleSearchPanel => {
    this.setState({
      visibleSearchPanel:
        typeof visibleSearchPanel === 'boolean'
          ? visibleSearchPanel
          : !this.state.visibleSearchPanel,
    })
  }

  async componentDidMount() {
    this.props.mapSize.updatePaddingTop(76)
    try {
      const {
        data: { routes },
      } = await Axios.get('/api/routes')
      this.setState({ routes })
    } catch ({ response }) {
      this.props.notifications.clear(() => {
        this.props.notifications.enqueue(response.data.message, 'error')
      })
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.visiblePath !== this.state.visiblePath) {
      if (this.state.visiblePath) this.props.mapSize.updatePaddingBottom(36)
      else this.props.mapSize.updatePaddingBottom(0)
    }

    if (prevState.visibleSearchPanel !== this.state.visibleSearchPanel) {
      if (this.state.visibleSearchPanel) {
        this.props.mapSize.updatePaddingTop(76)
        this.props.changeMapMode(MAP_MODE.VIEW)
      } else {
        this.props.mapSize.updatePaddingTop(0)
      }
    }

    if (prevState.addingRoute !== this.state.addingRoute) {
      if (!this.state.addingRoute) {
        this.props.mapSize.updatePaddingBottom(0)
        this.props.mapSize.updatePaddingTop(76)
      } else {
        this.props.mapSize.updatePaddingBottom(36)
        if (this.state.addingRoute === ADD_ROUTE.SETTING_ORIGIN) {
          this.props.mapSize.updatePaddingTop(36)
        } else {
          this.props.mapSize.updatePaddingTop(0)
        }
      }
    }

    if (this.state.addingRoute === ADD_ROUTE.ADDING_POINTS) {
      if (prevState.newPath.length === 1 && this.state.newPath.length > 1) {
        this.props.mapSize.updatePaddingTop(36)
      } else if (
        prevState.newPath.length > 1 &&
        this.state.newPath.length === 1
      ) {
        this.props.mapSize.updatePaddingTop(0)
      }
    }

    if (prevProps.mapMode !== this.props.mapMode) {
      this.props.mapSize.updatePaddingBottom(0)
      this.setState({ ...this.initialState, routes: this.state.routes })
      if (this.props.mapMode === MAP_MODE.ADD_ROUTE) {
        this.setState({
          origin: {
            ...this.initialState.origin,
            lat: this.mapRef.getCenter().lat(),
            lng: this.mapRef.getCenter().lng(),
          },
          addingRoute: ADD_ROUTE.SETTING_ORIGIN,
        })
        if (!this.props.session.user.hasCreatedRoute) {
          this.props.notifications.clear(() => {
            this.props.notifications.enqueue(
              'Set the origin of the route by clicking on the map.',
              'info',
              3000
            )
            this.props.notifications.enqueue(
              'You can also drag the blue marker around on the map to set the origin.',
              'info',
              3000
            )
            this.props.notifications.enqueue(
              'Click on the "Set Origin" button once you\'re done, or if you want to cancel, just go back.',
              'info',
              5000
            )
          })
        }
        this.toggleSearchPanel(false)
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
    if (this.state.selectedRoute) {
      this.setState({ selectedRoute: null })
    }
    if (mapMode === MAP_MODE.VIEW)
      this.setState({
        visibleSetPanel: true,
        setPanelPosition: { lat, lng },
      })
    if (mapMode === MAP_MODE.ADD_ROUTE) {
      if (this.state.addingRoute === ADD_ROUTE.SETTING_ORIGIN) {
        this.setState({
          origin: { ...this.state.origin, lat, lng },
          settingOrigin: true,
        })
        try {
          const {
            data: { path },
          } = await Axios.get(
            '/api/snapToRoad?' + qs.stringify({ path: [{ lat, lng }] })
          )
          this.setState({ settingOrigin: false })

          if (path.length) {
            const { lat, lng } = path[0]
            this.setState({ origin: { ...this.state.origin, lat, lng } })
          }
          this.handleManually('setCenter', { lat, lng })
        } catch ({ response }) {
          this.props.notifications.clear(() => {
            this.props.notifications.enqueue(response.data.message, 'error')
          })
        }
      } else if (this.state.addingRoute === ADD_ROUTE.ADDING_POINTS) {
        this.setState({
          destination: { ...this.state.destination, lat, lng },
          loadingPath: true,
        })
        const lastNode = this.state.newPath[this.state.newPath.length - 1]
        try {
          const {
            data: { path },
          } = await Axios.get(
            '/api/snapToRoad?' +
              qs.stringify({ path: [lastNode, { lat, lng }] })
          )
          this.setState({ tentativePath: path }, () => {
            this.handleApplyTentativePath()
          })
        } catch ({ response }) {
          this.props.notifications.clear(() => {
            this.props.notifications.enqueue(response.data.message, 'error')
          })
        } finally {
          this.setState({ loadingPath: false })
        }
      }
    }
  }

  handleCloseSetPanel = () => {
    this.setState({ visibleSetPanel: false })
  }

  handleFitMarkers = ({ origin, destination }) => {
    const { LatLng, LatLngBounds } = window.google.maps

    if (origin && destination) {
      const bounds = new LatLngBounds()
      bounds.extend(new LatLng(origin.lat, origin.lng))
      bounds.extend(new LatLng(destination.lat, destination.lng))
      this.mapRef.fitBounds(bounds)
    } else if (origin) {
      this.mapRef.panTo(new LatLng(origin.lat, origin.lng))
    } else if (destination) {
      this.mapRef.panTo(new LatLng(destination.lat, destination.lng))
    }
  }

  handleSetPath = async () => {
    const { origin, destination } = this.state
    this.toggleSearchPanel(true)
    if (origin.place_id && destination.place_id) {
      this.setState({ gettingPath: true, visiblePath: true })

      const {
        data: { path },
      } = await Axios.get(
        '/api/path?' +
          qs.stringify({
            origin: {
              lat: origin.lat,
              lng: origin.lng,
            },
            destination: {
              lat: destination.lat,
              lng: destination.lng,
            },
          })
      )

      let upperBound = { lat: -Infinity, lng: -Infinity }
      let lowerBound = { lat: Infinity, lng: Infinity }

      for (const route of path) {
        for (const node of route.nodes) {
          if (node.lat < lowerBound.lat) lowerBound.lat = node.lat
          if (node.lng < lowerBound.lng) lowerBound.lng = node.lng
          if (node.lat > upperBound.lat) upperBound.lat = node.lat
          if (node.lng > upperBound.lng) upperBound.lng = node.lng
        }
      }
      if (origin.lat < lowerBound.lat) lowerBound.lat = origin.lat
      if (origin.lng < lowerBound.lng) lowerBound.lng = origin.lng
      if (origin.lat > upperBound.lat) upperBound.lat = origin.lat
      if (origin.lng > upperBound.lng) upperBound.lng = origin.lng

      if (destination.lat < lowerBound.lat) lowerBound.lat = destination.lat
      if (destination.lng < lowerBound.lng) lowerBound.lng = destination.lng
      if (destination.lat > upperBound.lat) upperBound.lat = destination.lat
      if (destination.lng > upperBound.lng) upperBound.lng = destination.lng

      this.setState(
        {
          path,
          gettingPath: false,
        },
        () => {
          if (!path.length) {
            this.props.notifications.enqueue('No path was found.', 'warning')
            this.handleFitMarkers({ origin, destination })
          } else {
            this.handleFitMarkers({
              origin: upperBound,
              destination: lowerBound,
            })
          }
        }
      )
    } else if (origin.place_id) {
      this.handleFitMarkers({ origin })
    } else if (destination.place_id) {
      this.handleFitMarkers({ destination })
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
        this.handleSetPath
      )
    } catch ({ response }) {
      this.props.notifications.clear(() => {
        this.props.notifications.enqueue(response.data.message, 'error')
      })
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
          options: [],
        },
      })
      debounce(DEBOUNCE_ACTIONS.GET_PLACES, 500, async () => {
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
          this.props.notifications.clear(() => {
            this.props.notifications.enqueue(response.data.message, 'error')
          })
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
        this.handleSetPath
      )
    } catch ({ response }) {
      this.props.notifications.clear(() => {
        this.props.notifications.enqueue(response.data.message, 'error')
      })
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
      try {
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
      } catch ({ response }) {
        this.props.notifications.clear(() => {
          this.props.notifications.enqueue(response.data.message, 'error')
        })
      }
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
    const { notifications } = this.props
    const { lat, lng } = this.state.origin
    this.setState({
      addingRoute: ADD_ROUTE.ADDING_POINTS,
      destination: { ...this.state.destination, lat, lng },
      newPath: [{ lat, lng }],
    })

    if (!this.props.session.user.hasCreatedRoute) {
      notifications.clear(() => {
        notifications.enqueue(
          'Click on the map to trace your route. Using smaller gaps between points to help us trace your route better.',
          'info',
          5000
        )
        notifications.enqueue(
          'Big gaps or sharp turns tend to make our traces a bit wonky, if that happens you can always undo the last point then try again.',
          'info',
          5000
        )

        notifications.enqueue(
          'Dragging the marker around the map lets you see what the predicted trace will be. Release to save that trace.',
          'info',
          5000
        )

        notifications.enqueue(
          `Once you're satisfied with your route, click on "Add Route".`,
          'info',
          3000
        )
      })
    }
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

  handleToggleReport = async () => {
    try {
      const {
        data: { route },
      } = await Axios.post(`/api/routes/${this.state.selectedRoute.id}/reports`)
      this.setState({
        path: this.state.path.map(path => {
          if (path.id === route.id) {
            path.reporterIds = route.reporters.map(reporter => reporter.id)
          }
          return path
        }),
        selectedRoute: {
          ...this.state.selectedRoute,
          reporterIds: route.reporters.map(reporter => reporter.id),
        },
      })
    } catch (err) {
      console.log(err)
      // this.props.notifications.clear(() => {
      //   this.props.notifications.enqueue(err.response.message, 'error')
      // })
    }
  }

  render() {
    const options = {
      styles: mapStyles,
      disableDefaultUI: true,
      gestureHandling: 'greedy',
    }

    const commutePath = this.state.path.map((path, index) => (
      <Fragment key={`${path.id}-${index}`}>
        <Polyline
          path={path.nodes}
          options={{
            strokeColor: assortedColors[index % assortedColors.length],
            strokeWeight: 5,
          }}
          onClick={this.handleMapClick}
        />
        <VehicleMarker
          path={path}
          handleClick={() => {
            this.setState({
              selectedRoute: { ...path },
              visibleSetPanel: false,
            })
          }}
        />
      </Fragment>
    ))

    const allRoutes =
      !this.state.path.length &&
      this.state.routes.map(route => (
        <Polyline
          key={route.id}
          path={route.nodes}
          options={{
            strokeColor: '#1b1c1d', // semantic black
            strokeWeight: 5,
          }}
          onClick={this.handleMapClick}
        />
      ))

    const setOriginButton = this.state.addingRoute ===
      ADD_ROUTE.SETTING_ORIGIN && (
      <Button
        loading={this.state.settingOrigin}
        color="blue"
        fluid
        style={{ borderRadius: 0 }}
        onClick={this.handleSetOrigin}
      >
        Set Origin
      </Button>
    )

    const backButton = this.state.addingRoute === ADD_ROUTE.SETTING_ORIGIN && (
      <Button
        color="red"
        fluid
        style={{ borderRadius: 0 }}
        onClick={() => this.props.changeMapMode(MAP_MODE.VIEW)}
      >
        <Icon name="undo" />
        Back
      </Button>
    )

    const resetButton = this.state.visiblePath && (
      <Button
        loading={this.state.gettingPath}
        color="red"
        fluid
        style={{ borderRadius: 0 }}
        onClick={() => {
          this.setState({
            path: [],
            visiblePath: false,
            origin: { ...this.initialState.origin },
            destination: { ...this.initialState.destination },
          })
        }}
      >
        <Icon name="undo" />
        Back
      </Button>
    )

    const undoButton = this.state.addingRoute === ADD_ROUTE.ADDING_POINTS && (
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
    )

    const doneButton = this.state.addingRoute === ADD_ROUTE.ADDING_POINTS &&
      this.state.newPath.length > 1 && (
        <RouteFormModal
          mapPanel={this}
          trigger={
            <Button
              color="blue"
              fluid
              style={{ borderRadius: 0 }}
              onClick={() => {
                this.props.notifications.clear(() => {})
              }}
            >
              <Icon name="check" />
              Done
            </Button>
          }
        />
      )

    const originMarker = this.state.origin.place_id ? (
      <Marker
        icon={originLogo}
        position={{
          lat: this.state.origin.lat,
          lng: this.state.origin.lng,
        }}
      />
    ) : null

    const destinationMarker = this.state.destination.place_id ? (
      <Marker
        icon={destinationLogo}
        position={{
          lat: this.state.destination.lat,
          lng: this.state.destination.lng,
        }}
      />
    ) : null

    const routeOriginMarker = (
      <Marker
        draggable={this.state.addingRoute === ADD_ROUTE.SETTING_ORIGIN}
        onDragEnd={this.handleMapClick}
        icon={originLogo}
        position={{
          lat: this.state.origin.lat,
          lng: this.state.origin.lng,
        }}
      />
    )

    const routeDestinationMarker = (
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
    )

    const newPathPolyline = (
      <Polyline
        options={{
          strokeColor: '#db2828',
          strokeWeight: 5,
        }}
        path={[this.state.newPath[this.state.newPath.length - 1]].concat(
          this.state.tentativePath
        )}
      />
    )

    const tentativePathPolyline = (
      <Polyline
        options={{
          strokeColor: '#2185d0',
          strokeWeight: 5,
        }}
        path={this.state.newPath}
      />
    )

    return (
      <Fragment>
        <div
          style={{
            position: 'absolute',
            width: '100%',
            top: this.props.topHeight,
          }}
        >
          {this.state.visibleSearchPanel && (
            <SearchPanel
              handleSearchPanelChange={this.handleSearchPanelChange}
              handleSearch={this.handleSearch}
              origin={this.state.origin}
              destination={this.state.destination}
            />
          )}
          {setOriginButton}
          {doneButton}
        </div>

        <div style={{ position: 'absolute', width: '100%', bottom: 0 }}>
          {backButton}
          {undoButton}
          {resetButton}
        </div>
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
              {allRoutes}
              {commutePath}
              {originMarker}
              {destinationMarker}
            </Fragment>
          )}
          {this.props.mapMode === MAP_MODE.ADD_ROUTE && (
            <Fragment>
              {this.state.addingRoute === ADD_ROUTE.ADDING_POINTS && (
                <Fragment>
                  {routeDestinationMarker}
                  {newPathPolyline}
                </Fragment>
              )}
              {routeOriginMarker}
            </Fragment>
          )}
          {tentativePathPolyline}
          {/* {this.state.routes.map(route => (
            <Fragment key={route.id}>
              {route.nodes.map(node => (
                <Marker
                  key={node.id}
                  position={{ lat: node.lat, lng: node.lng }}
                  onClick={() => console.log(node.id, node.lat, node.lng)}
                />
              ))}
            </Fragment>
          ))} */}
          {this.state.selectedRoute && (
            <RouteMarker
              mapPanel={this}
              selectedRoute={this.state.selectedRoute}
              path={this.state.path}
              handleToggleReport={this.handleToggleReport}
              onCloseClick={() => {
                this.setState({ selectedRoute: null })
              }}
            />
          )}
        </GoogleMap>
      </Fragment>
    )
  }
}
export default withPlatform(
  withSession(
    withMapSize(
      withNotifications(
        compose(
          withProps({
            googleMapURL:
              'https://maps.googleapis.com/maps/api/js?key=AIzaSyCsmniogYj-rg23fhKjRH21QkUz3VoyP-o&v=3.exp&libraries=geometry,drawing,places',
            loadingElement: (
              <div id="loadingelement" style={{ height: `100%` }} />
            ),
            mapElement: <div id="mapelement" style={{ height: `100%` }} />,
          }),
          withScriptjs,
          withGoogleMap
        )(MapPanel)
      )
    )
  )
)

import {
  GoogleMap,
  Marker,
  withGoogleMap,
  withScriptjs,
} from 'react-google-maps'
import React, { Component, Fragment } from 'react'
import { compose, withProps } from 'recompose'

import Axios from 'axios'
import SearchPanel from './SearchPanel'
import SetPanel from './SetPanel'
import debounce from '../../util/debounce'
import destinationLogo from './assets/destination.svg'
import mapStyles from './style.json'
import originLogo from './assets/origin.svg'
import qs from 'qs'
import { withNotifications } from '../../providers/NotificationsProvider'
import { withPlatform } from '../../providers/PlatformProvider'
import { DEBOUNCE_ACTIONS, MAP_MODE } from '../../constants'

class MapPanel extends Component {
  state = {
    zoom: 14,
    visibleSetPanel: false,
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

  handleClick = e => {
    this.setState({
      visibleSetPanel: true,
      setPanelPosition: {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      },
    })
  }

  handleCloseSetPanel = () => {
    this.setState({ visibleSetPanel: false })
  }

  fitMarkers = () => {
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

  setPlace = async place => {
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
          this.fitMarkers()
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
        this.fitMarkers
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

  render() {
    const { mapMode } = this.props
    const options = {
      styles: mapStyles,
      disableDefaultUI: true,
      minZoom: mapMode === MAP_MODE.VIEW ? 6 : 16,
    }
    console.log(mapMode)
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
        <GoogleMap
          ref={mapRef => (this.mapRef = mapRef)}
          clickableIcons={false}
          defaultCenter={{ lat: 14.1686279, lng: 121.2424038 }}
          options={options}
          zoom={this.state.zoom}
          onClick={this.handleClick}
          onZoomChanged={() => {
            if (this.mapRef.getZoom() < options.minZoom) {
              this.setState({ zoom: options.minZoom })
            } else {
              this.setState({ zoom: this.mapRef.getZoom() })
            }
          }}
        >
          {this.state.visibleSetPanel && (
            <SetPanel
              origin={this.state.origin}
              destination={this.state.destination}
              setPlace={this.setPlace}
              position={this.state.setPanelPosition}
              onCloseClick={this.handleCloseSetPanel}
            />
          )}
          <Marker
            icon={originLogo}
            position={{
              lat: this.state.origin.lat,
              lng: this.state.origin.lng,
            }}
          />
          <Marker
            icon={destinationLogo}
            position={{
              lat: this.state.destination.lat,
              lng: this.state.destination.lng,
            }}
          />
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

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
import mapStyles from './style.json'
import qs from 'qs'
import { withNotifications } from '../../providers/NotificationsProvider'
import { withPlatform } from '../../providers/PlatformProvider'

class MapPanel extends Component {
  state = {
    visibleSetPanel: false,
    setPanelPosition: { lat: 0, lng: 0 },
    origin: {
      place_id: null,
      name: '',
      lat: 0,
      lng: 0,
      options: [],
      loadingPlace: false,
      loadingOptions: false,
    },
    destination: {
      place_id: null,
      name: '',
      lat: 0,
      lng: 0,
      options: [],
      loadingPlace: false,
      loadingOptions: false,
    },
  }

  handleClick = e => {
    if (this.props.platform.isMobile) {
      this.setState({
        visibleSetPanel: true,
        setPanelPosition: {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        },
      })
    }
  }

  handleCloseSetPanel = () => {
    this.setState({ visibleSetPanel: false })
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

      this.setState({
        [place]: {
          ...this.state[place],
          place_id: data.place.place_id,
          lat: this.state.setPanelPosition.lat,
          lng: this.state.setPanelPosition.lng,
          name: data.place.name,
          options: data.options.map((place, index) => ({
            text: place,
            value: place,
            key: index,
          })),
        },
        visibleSetPanel: false,
      })
      this.props.toggleSearchPanel(true)
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
      debounce('GET_PLACES', 1000, async () => {
        const { data } = await Axios.get(
          '/api/places?' + qs.stringify({ input: value })
        )
        this.setState({
          [place]: {
            ...this.state[place],
            loadingOptions: false,
            options: data.places.map((place, index) => ({
              text: place.name,
              value: place.place_id,
              key: index,
            })),
          },
        })
      })
    }
  }

  handleSearchPanelChange = async (place, value) => {}

  render() {
    const options = { styles: mapStyles, disableDefaultUI: true, minZoom: 6 }
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
          defaultOptions={options}
          defaultZoom={16}
          onClick={this.handleClick}
          onRightClick={this.handleRightClick}
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
            position={{
              lat: this.state.origin.lat,
              lng: this.state.origin.lng,
            }}
          />
          <Marker
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

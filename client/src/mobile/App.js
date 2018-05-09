import React, { Component, Fragment } from 'react'
import MapPanel from '../components/MapPanel/MapPanel'
import { MAP_MODE } from '../constants'
import { withSession } from '../providers/SessionProvider'
import Nav from './Nav'
import { withMapSize } from '../providers/MapSizeProvider'

class App extends Component {
  state = {
    mapMode: MAP_MODE.VIEW,
  }

  changeMapMode = (mapMode, callback = () => {}) =>
    this.setState({ mapMode }, callback)

  render() {
    return (
      <Fragment>
        <div ref={divElement => (this.divElement = divElement)}>
          <Nav
            mapMode={this.state.mapMode}
            toggleVisible={this.toggleVisible}
            changeMapMode={this.changeMapMode}
          />
        </div>
        {this.divElement && (
          <MapPanel
            topHeight={this.divElement.clientHeight}
            mapMode={this.state.mapMode}
            changeMapMode={this.changeMapMode}
            containerElement={
              <div
                style={{
                  paddingTop: this.props.mapSize.paddingTop,
                  height: `calc(100vh - ${this.divElement.clientHeight +
                    this.props.mapSize.paddingBottom}px)`,
                }}
              />
            }
          />
        )}
      </Fragment>
    )
  }
}

export default withSession(withMapSize(App))

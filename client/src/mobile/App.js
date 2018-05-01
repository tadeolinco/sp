import React, { Component, Fragment } from 'react'
import MapPanel from '../components/MapPanel/MapPanel'
import { MAP_MODE } from '../constants'
import { withSession } from '../providers/SessionProvider'
import Nav from './Nav'

class App extends Component {
  state = {
    mapMode: MAP_MODE.VIEW,
  }

  changeMapMode = mapMode => this.setState({ mapMode })

  render() {
    return (
      <Fragment>
        <div ref={divElement => (this.divElement = divElement)}>
          <Nav
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
                  paddingTop: this.state.visible ? 76 : 0,
                  height: `calc(100vh - ${this.divElement.clientHeight}px)`,
                }}
              />
            }
          />
        )}
      </Fragment>
    )
  }
}

export default withSession(App)

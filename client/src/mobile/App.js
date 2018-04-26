import React, { Component, Fragment } from 'react'

import MapPanel from '../components/MapPanel/MapPanel'
import Nav from './Nav'
import { withSession } from '../providers/SessionProvider'
import { MAP_MODE } from '../constants'

class App extends Component {
  state = {
    visible: true,
    mapMode: MAP_MODE.VIEW,
  }

  changeMapMode = mapMode => this.setState({ mapMode })

  toggleVisible = visible => {
    this.setState(
      {
        visible: typeof visible === 'boolean' ? visible : !this.state.visible,
      },
      () => {
        if (this.state.visible) {
          this.changeMapMode(MAP_MODE.VIEW)
        }
      }
    )
  }

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
            visibleSearchPanel={this.state.visible}
            toggleSearchPanel={this.toggleVisible}
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

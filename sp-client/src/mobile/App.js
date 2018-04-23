import React, { Component, Fragment } from 'react'

import MapPanel from '../components/MapPanel/MapPanel'
import Nav from './Nav'
import { withSession } from '../providers/SessionProvider'

class App extends Component {
  state = { visible: false }

  toggleVisible = visible => {
    this.setState({
      visible: typeof visible === 'boolean' ? visible : !this.state.visible,
    })
  }

  render() {
    return (
      <Fragment>
        <div ref={divElement => (this.divElement = divElement)}>
          <Nav toggleVisible={this.toggleVisible} />
        </div>
        <MapPanel
          visibleSearchPanel={this.state.visible}
          toggleSearchPanel={this.toggleVisible}
          containerElement={
            <div
              style={{
                paddingTop: this.state.visible ? 76 : 0,
                height: `calc(100vh - 49px)`,
              }}
            />
          }
        />
      </Fragment>
    )
  }
}

export default withSession(App)

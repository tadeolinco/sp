import React, { Component } from 'react'

import DesktopApp from './desktop/App'
import MobileApp from './mobile/App'
import { withPlatform } from './providers/PlatformProvider'

class App extends Component {
  render() {
    const { platform } = this.props
    return platform.isMobile ? <MobileApp /> : <DesktopApp />
  }
}

export default withPlatform(App)

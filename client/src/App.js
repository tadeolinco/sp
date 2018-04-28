import React, { Component } from 'react'

import DesktopApp from './desktop/App'
import MobileApp from './mobile/App'
import { withPlatform } from './providers/PlatformProvider'
import { withSession } from './providers/SessionProvider'
import { withNotifications } from './providers/NotificationsProvider'
import Axios from 'axios'

class App extends Component {
  state = { loading: true }

  async componentDidMount() {
    const { session, notifications } = this.props
    try {
      const {
        data: { user },
      } = await Axios.post('/api/session')
      session.changeUser(user)
      if (user) {
        notifications.addMessage(`Welcome, ${user.username}!`, 'success')
      }
    } catch ({ response }) {
      notifications.clear(() => {
        notifications.addMessage(response.data.message, 'error')
      })
    } finally {
      this.setState({ loading: false })
    }
  }

  render() {
    const { platform } = this.props
    return platform.isMobile ? <MobileApp /> : <DesktopApp />
  }
}

export default withNotifications(withSession(withPlatform(App)))

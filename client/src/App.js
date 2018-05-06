import Axios from 'axios'
import React, { Component } from 'react'
import MobileApp from './mobile/App'
import { withNotifications } from './providers/NotificationsProvider'
import { withPlatform } from './providers/PlatformProvider'
import { withSession } from './providers/SessionProvider'

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
        notifications.enqueue(`Welcome, ${user.username}!`, 'success')
      }
    } catch ({ response }) {
      notifications.clear(() => {
        notifications.enqueue(response.data.message, 'error')
      })
    } finally {
      this.setState({ loading: false })
    }
  }

  render() {
    // const { platform } = this.props
    return <MobileApp />
    // return platform.isMobile ? <MobileApp /> : <DesktopApp />
  }
}

export default withNotifications(withSession(withPlatform(App)))

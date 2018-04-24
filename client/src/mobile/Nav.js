import { Dropdown, Icon, Menu } from 'semantic-ui-react'
import React, { Component } from 'react'

import Axios from 'axios'
import LoginModal from '../components/LoginModal'
import SignupModal from '../components/SignupModal'
import { withNotifications } from '../providers/NotificationsProvider'
import { withSession } from '../providers/SessionProvider'

class Nav extends Component {
  logout = async () => {
    const { session } = this.props
    try {
      await Axios.post('/api/logout')

      session.changeUser(null)

      this.props.notifications.addMessage(`Bye!`, 'success')
    } catch ({ response }) {
      this.props.notifications.addMessage(response.data.message, 'error')
    }
  }

  render() {
    const { session } = this.props

    const title = 'Commute Community'

    const withSessionMenu = (
      <Dropdown.Menu>
        <Dropdown.Item>Add Route</Dropdown.Item>
        <Dropdown.Item onClick={this.logout}>Logout</Dropdown.Item>
      </Dropdown.Menu>
    )

    const withoutSessionMenu = (
      <Dropdown.Menu>
        <LoginModal trigger={<Dropdown.Item>Login</Dropdown.Item>} />
        <SignupModal trigger={<Dropdown.Item>Sign Up</Dropdown.Item>} />
      </Dropdown.Menu>
    )

    return (
      <Menu
        fluid
        inverted
        borderless
        size="huge"
        attached="top"
        style={{
          margin: 0,
          borderTop: 0,
          borderRight: 0,
          borderLeft: 0,
          borderRadius: 0,
        }}
      >
        <Dropdown
          item
          icon={<Icon name="vertical ellipsis" style={{ margin: 0 }} />}
          style={{ paddingRight: 10, paddingLeft: 10 }}
        >
          {session.user ? withSessionMenu : withoutSessionMenu}
        </Dropdown>
        <Menu.Item header style={{ padding: '15px 10px' }}>
          {title}
        </Menu.Item>
        <Menu.Item
          position="right"
          style={{ paddingRight: 10 }}
          onClick={this.props.toggleVisible}
        >
          <Icon name="search" />
        </Menu.Item>
      </Menu>
    )
  }
}

export default withSession(withNotifications(Nav))

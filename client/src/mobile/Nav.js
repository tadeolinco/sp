import Axios from 'axios'
import React, { Component } from 'react'
import { Dropdown, Icon, Menu } from 'semantic-ui-react'
import LoginModal from '../components/LoginModal'
import SignupModal from '../components/SignupModal'
import { MAP_MODE } from '../constants'
import { withNotifications } from '../providers/NotificationsProvider'
import { withSession } from '../providers/SessionProvider'
import SurveyModal from './SurveyModal'

class Nav extends Component {
  logout = async () => {
    const { session } = this.props
    try {
      await Axios.post('/api/logout')

      session.changeUser(null)
      if (this.props.mapMode === MAP_MODE.ADD_ROUTE) {
        this.props.changeMapMode(MAP_MODE.VIEW)
      }
      this.props.notifications.enqueue(`Bye!`, 'success')
    } catch ({ response }) {
      this.props.notifications.enqueue(response.data.message, 'error')
    }
  }

  render() {
    const { session } = this.props

    const title = 'PADAAN'

    const withSessionMenu = (
      <Dropdown.Menu>
        {session.user &&
          !session.user.survey && (
            <SurveyModal
              trigger={<Dropdown.Item>Help Graduate</Dropdown.Item>}
            />
          )}
        <Dropdown.Item
          onClick={() => {
            this.props.changeMapMode(MAP_MODE.ADD_ROUTE)
          }}
        >
          Add Route
        </Dropdown.Item>
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
          height: 49,
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
      </Menu>
    )
  }
}

export default withSession(withNotifications(Nav))

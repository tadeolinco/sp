import { Dropdown, Icon, Menu } from 'semantic-ui-react'
import React, { Component } from 'react'

import LoginModal from '../components/LoginModal'

class Nav extends Component {
  render() {
    const title = 'Commute Community'

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
          <Dropdown.Menu>
            <LoginModal trigger={<Dropdown.Item>Login</Dropdown.Item>} />
          </Dropdown.Menu>
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

export default Nav

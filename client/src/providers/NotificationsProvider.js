import React, { Component } from 'react'
import { Transition, Message } from 'semantic-ui-react'

const NotificationsContext = React.createContext()

export const withNotifications = Component => props => (
  <NotificationsContext.Consumer>
    {notifications => <Component {...props} notifications={notifications} />}
  </NotificationsContext.Consumer>
)

export class NotificationsProvider extends Component {
  state = {
    messages: [],
    visible: false,
    duration: 1000,
    addMessage: (message, type = '') => {
      const airTime = 2000
      const { duration } = this.state
      this.setState(
        { messages: this.state.messages.concat({ message, type }) },
        () => {
          setTimeout(() => {
            this.setState({ visible: true })
            setTimeout(() => {
              this.setState({
                messages: this.state.messages.slice(1),
                visible: false,
              })
            }, airTime)
          }, (this.state.messages.length - 1) * (airTime + duration))
        }
      )
    },
  }

  render() {
    return (
      <NotificationsContext.Provider value={this.state}>
        <Transition.Group animation="fly left" duration={this.state.duration}>
          {this.state.visible && (
            <Message
              content={this.state.messages[0].message}
              style={{ position: 'absolute', right: 10, top: 10, zIndex: 1000 }}
              info={this.state.messages[0].type === 'info'}
              warning={this.state.messages[0].type === 'warning'}
              success={this.state.messages[0].type === 'success'}
              error={this.state.messages[0].type === 'error'}
            />
          )}
        </Transition.Group>
        {this.props.children}
      </NotificationsContext.Provider>
    )
  }
}

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
    timerId: null,
    addMessage: (content, type = '', airTime = 2000, callback) => {
      setTimeout(() => {
        this.setState(
          {
            messages: this.state.messages.concat({ content, type, airTime }),
          },
          () => {
            if (this.state.messages.length === 1) {
              this.transition()
            }
          }
        )
      }, 0)
    },

    clear: callback => {
      if (this.state.timerId) {
        clearTimeout(this.state.timerId)
      }
      this.setState({
        timerId: null,
        visible: false,
      })
      setTimeout(() => {
        this.setState({ messages: [] }, callback)
      }, this.state.duration)
    },

    pop: () => {
      if (this.state.timerId) {
        clearTimeout(this.state.timerId)
      }
      this.setState({
        timerId: null,
        visible: false,
      })
      setTimeout(() => {
        this.setState({ messages: this.state.messages.slice(1) }, () => {
          if (this.state.messages.length) {
            this.transition()
          }
        })
      }, this.state.duration)
    },
  }

  transition = () => {
    setTimeout(() => {
      const { duration } = this.state
      this.setState({
        visible: true,
        timerId: setTimeout(() => {
          this.setState({ visible: false })
          setTimeout(() => {
            this.setState({ messages: this.state.messages.slice(1) }, () => {
              if (this.state.messages.length) {
                this.transition()
              }
            })
          }, duration)
        }, this.state.messages[0].airTime + duration),
      })
    }, 0)
  }

  render() {
    return (
      <NotificationsContext.Provider value={this.state}>
        <Transition.Group animation="fly down" duration={this.state.duration}>
          {this.state.visible &&
            !!this.state.messages.length && (
              <Message
                onClick={this.state.pop}
                style={{
                  position: 'absolute',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  left: '10%',
                  right: '10%',
                  top: 10,
                  zIndex: 2000,
                }}
                info={this.state.messages[0].type === 'info'}
                warning={this.state.messages[0].type === 'warning'}
                success={this.state.messages[0].type === 'success'}
                error={this.state.messages[0].type === 'error'}
              >
                <div
                  style={{
                    textAlign: 'center',
                  }}
                >
                  {this.state.messages[0].content}
                </div>
              </Message>
            )}
        </Transition.Group>
        {this.props.children}
      </NotificationsContext.Provider>
    )
  }
}

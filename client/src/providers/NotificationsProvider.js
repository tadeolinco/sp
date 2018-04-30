import React, { Component } from 'react'
import { Transition, Message } from 'semantic-ui-react'

const ANIMATION_DURATION = 1000

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
    timerId: null,
    enqueue: (content, type = '', airTime = 2000) => {
      setTimeout(() => {
        this.setState(
          {
            messages: [...this.state.messages, { content, type, airTime }],
          },
          () => {
            if (this.state.messages.length === 1) this.transition()
          }
        )
      }, 0)
    },

    clear: callback => {
      if (this.state.timerId) {
        clearTimeout(this.state.timerId)
      }
      setTimeout(() => {
        this.setState({ visible: false, timerId: null }, () => {
          setTimeout(() => {
            this.setState({ messages: [] }, () => {
              if (callback) callback()
            })
          }, ANIMATION_DURATION)
        })
      }, 0)
    },

    dequeue: () => {
      if (this.state.timerId) {
        clearTimeout(this.state.timerId)
      }
      setTimeout(() => {
        this.setState({ visible: false, timerId: null }, () => {
          setTimeout(() => {
            this.setState({ messages: this.state.messages.slice(1) }, () => {
              if (this.state.messages.length) {
                this.transition()
              }
            })
          }, ANIMATION_DURATION)
        })
      }, 0)
    },
  }

  transition = () => {
    const message = this.state.messages[0]
    setTimeout(() => {
      this.setState({
        visible: true,
        timerId: setTimeout(() => {
          this.setState({ visible: false, timerId: null }, () => {
            setTimeout(() => {
              this.setState({ messages: this.state.messages.slice(1) }, () => {
                if (this.state.messages.length) {
                  this.transition()
                }
              })
            }, ANIMATION_DURATION)
          })
        }, message.airTime + ANIMATION_DURATION),
      })
    }, 0)
  }

  render() {
    return (
      <NotificationsContext.Provider value={this.state}>
        <Transition.Group animation="fly down" duration={ANIMATION_DURATION}>
          {this.state.visible &&
            !!this.state.messages.length && (
              <Message
                onClick={this.state.dequeue}
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

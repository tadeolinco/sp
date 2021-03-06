import React, { Component } from 'react'
import { Message, Transition } from 'semantic-ui-react'
import { withPlatform } from './PlatformProvider'

const ANIMATION_DURATION = 1000

const { Provider, Consumer } = React.createContext()

export const withNotifications = Component => props => (
  <Consumer>
    {notifications => <Component {...props} notifications={notifications} />}
  </Consumer>
)

class InnerNotificationsProvider extends Component {
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
    const style = {
      position: 'absolute',
      marginLeft: 'auto',
      marginRight: 'auto',
      left: '10%',
      right: '10%',
      top: 10,
      zIndex: 2000,
    }
    if (!this.props.platform.isMobile) {
      style.left = '40%'
      style.right = '40%'
    }

    return (
      <Provider value={this.state}>
        <Transition.Group animation="fly down" duration={ANIMATION_DURATION}>
          {this.state.visible &&
            !!this.state.messages.length && (
              <Message
                onClick={this.state.dequeue}
                style={style}
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
      </Provider>
    )
  }
}

export const NotificationsProvider = withPlatform(InnerNotificationsProvider)

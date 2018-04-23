import React, { Component } from 'react'

const { Provider, Consumer } = React.createContext()

export class SessionProvider extends Component {
  state = { user: null, loading: true, getState: () => {} }

  render() {
    return <Provider value={this.state}>{this.props.children}</Provider>
  }
}

export const withSession = Component => props => (
  <Consumer>{session => <Component {...props} session={session} />}</Consumer>
)

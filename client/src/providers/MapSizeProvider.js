import React, { Component } from 'react'

const { Provider, Consumer } = React.createContext()

export class MapSizeProvider extends Component {
  state = {
    paddingTop: 0,
    paddingBottom: 0,
    updatePaddingTop: paddingTop => this.setState({ paddingTop }),
    updatePaddingBottom: paddingBottom => this.setState({ paddingBottom }),
  }

  render() {
    return <Provider value={this.state}>{this.props.children}</Provider>
  }
}

export const withMapSize = Component => props => (
  <Consumer>{mapSize => <Component {...props} mapSize={mapSize} />}</Consumer>
)

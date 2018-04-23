import React, { Component } from 'react'

const { Provider, Consumer } = React.createContext()

export class PlatformProvider extends Component {
  state = { isMobile: window.innerWidth <= 425 }

  updateDimensions = () => {
    this.setState({ isMobile: window.innerWidth <= 425 })
  }

  componentWillMount() {
    this.updateDimensions()
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions)
  }

  render() {
    return <Provider value={this.state}>{this.props.children}</Provider>
  }
}

export const withPlatform = Component => props => (
  <Consumer>
    {platform => <Component {...props} platform={platform} />}
  </Consumer>
)

import React, { Component } from 'react'

import LoginModal from '../components/LoginModal'

class App extends Component {
  render() {
    return (
      <div>
        <h1>desktop</h1>
        <LoginModal trigger={<button>asd</button>} />
      </div>
    )
  }
}

export default App

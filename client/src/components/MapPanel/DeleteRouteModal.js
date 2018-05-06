import Axios from 'axios'
import React, { Component } from 'react'
import { Button, Modal } from 'semantic-ui-react'
import { withNotifications } from '../../providers/NotificationsProvider'
import { withPlatform } from '../../providers/PlatformProvider'

class DeleteRouteModal extends Component {
  state = {
    loading: false,
  }

  handleDelete = async () => {
    const { mapPanel, notifications } = this.props
    try {
      this.setState({ loading: true })
      await Axios.delete(`/api/routes/${mapPanel.state.selectedRoute.id}`)

      notifications.enqueue('Successfully delete route.', 'success')
      mapPanel.setState({
        path: [],
        routes: mapPanel.state.routes.filter(
          route => mapPanel.state.selectedRoute.id !== route.id
        ),
        selectedRoute: null,
        visiblePath: false,
        origin: { ...mapPanel.initialState.origin },
        destination: { ...mapPanel.initialState.destination },
      })
    } catch (err) {
      notifications.clear(() => {
        notifications.enqueue(err.response.data.message, 'error')

        this.setState({ loading: false })
      })
    }
  }

  handleOnOpen = () => {
    this.setState({ loading: false })
  }

  render() {
    const { trigger } = this.props
    const style = {
      marginTop: 0,
      width: '100%',
      marginLeft: 'auto',
      marginRight: 'auto',
    }

    if (!this.props.platform.isMobile) {
      style.maxWidth = '425px'
    }

    return (
      <Modal
        closeIcon={this.props.platform.isMobile}
        style={style}
        trigger={trigger}
        onOpen={this.handleOnOpen}
        ref={modalRef => (this.modalRef = modalRef)}
        closeOnDocumentClick={!this.state.loading}
      >
        <Modal.Header>Delete Route</Modal.Header>

        <Modal.Content>
          <p>Are you sure you want to delete this route?</p>
        </Modal.Content>
        <Modal.Actions>
          <Button
            onClick={() => {
              this.modalRef.handleClose()
            }}
          >
            Cancel
          </Button>
          <Button onClick={this.handleDelete} loading={this.state.loading}>
            Delete
          </Button>
        </Modal.Actions>
      </Modal>
    )
  }
}

export default withPlatform(withNotifications(DeleteRouteModal))

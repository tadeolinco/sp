import Axios from 'axios'
import React, { Component } from 'react'
import { Button, Form, Message, Modal } from 'semantic-ui-react'
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
      const {
        data: { route },
      } = await Axios.delete(`/api/routes/${mapPanel.state.selectedRoute.id}`)

      this.modalRef.handleClose()
    } catch (err) {
      notifications.clear(() => {
        notifications.enqueue(err.response.data.message, 'error')

        this.setState({ loading: false })
      })
    }
  }

  handleOnClose = () => {
    this.setState({ loading: false })
  }

  render() {
    const { trigger, form } = this.props
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
        onClose={this.handleOnClose}
        ref={modalRef => (this.modalRef = modalRef)}
      >
        <Modal.Header>Delete Route</Modal.Header>

        <Modal.Content>
          <h1>hi</h1>
        </Modal.Content>
        <Modal.Actions>
          <Button
            onClick={() => {
              this.modalRef.handleClose()
            }}
          >
            Cancel
          </Button>
          <Button onClick={this.handleDelete}>Delete</Button>
        </Modal.Actions>
      </Modal>
    )
  }
}

export default withPlatform(withNotifications(DeleteRouteModal))

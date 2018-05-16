import Axios from 'axios'
import React, { Component } from 'react'
import { Button, Form, Message, Modal } from 'semantic-ui-react'
import { MAP_MODE } from '../../constants'
import { withNotifications } from '../../providers/NotificationsProvider'
import { withSession } from '../../providers/SessionProvider'
import withForm from '../../util/withForm'
import { withPlatform } from '../../providers/PlatformProvider'

const modes = ['Jeepney', 'Bus', 'Train', 'Shuttle Service', 'UV Express'].map(
  mode => ({ text: mode, value: mode })
)

class RouteFormModal extends Component {
  handleSubmit = async e => {
    e.preventDefault()
    const { mapPanel, notifications, form, session } = this.props
    try {
      notifications.clear(() => {
        notifications.enqueue(
          'Creating route... This might take a while.',
          'info'
        )
      })

      mapPanel.props.changeMapMode(MAP_MODE.VIEW, () => {
        mapPanel.setState({ isCreatingRoute: true })
      })

      this.modalRef.handleClose()

      const {
        data: { route },
      } = await Axios.post('/api/routes', {
        path: mapPanel.state.newPath,
        mode: form.values.modeOfTransportation,
        description: form.values.description,
      })

      const upperBound = { lat: -Infinity, lng: -Infinity }
      const lowerBound = { lat: Infinity, lng: Infinity }
      for (const node of route.nodes) {
        if (node.lat < lowerBound.lat) lowerBound.lat = node.lat
        if (node.lng < lowerBound.lng) lowerBound.lng = node.lng
        if (node.lat > upperBound.lat) upperBound.lat = node.lat
        if (node.lng > upperBound.lng) upperBound.lng = node.lng
      }

      if (!session.user.hasCreatedRoute) {
        session.changeUser({ ...session.user, hasCreatedRoute: true })
      }

      notifications.clear(() => {
        notifications.enqueue('Successfully added route!', 'success')
      })
      mapPanel.setState({
        routes: [...mapPanel.state.routes, route],
        isCreatingRoute: false,
      })
    } catch (err) {
      notifications.clear(() => {
        notifications.enqueue(err.response.data.message, 'error')

        mapPanel.setState({ isCreatingRoute: false })
      })
    }
  }

  handleOnOpen = () => {
    this.props.form.resetForm()
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
        onOpen={this.handleOnOpen}
        ref={modalRef => (this.modalRef = modalRef)}
      >
        <Modal.Header>Add Route</Modal.Header>

        <Modal.Content>
          {!!form.errors.length && <Message error list={form.errors} />}
          <Form onSubmit={this.handleSubmit}>
            <Form.Select
              label="Mode of Transportation"
              options={modes}
              value={form.values.modeOfTransportation}
              onChange={form.set.modeOfTransportation}
            />
            <Form.TextArea
              label="Description"
              placeholder="Optional description of the route."
              value={form.values.description}
              onChange={form.set.description}
            />
            <Button type="submit" color="black" fluid>
              Add Route
            </Button>
          </Form>
        </Modal.Content>
      </Modal>
    )
  }
}

export default withPlatform(
  withNotifications(
    withSession(
      withForm(RouteFormModal, {
        modeOfTransportation: {
          initialValue: modes[0].value,
        },
        description: {},
      })
    )
  )
)

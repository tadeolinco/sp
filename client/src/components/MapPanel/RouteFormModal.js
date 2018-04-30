import { Button, Form, Message, Modal } from 'semantic-ui-react'
import React, { Component } from 'react'

import Axios from 'axios'
import withForm from '../../util/withForm'
import { withNotifications } from '../../providers/NotificationsProvider'
import { withSession } from '../../providers/SessionProvider'
import { MAP_MODE } from '../../constants'

const modes = ['Jeepney', 'Bus', 'Train', 'Shuttle Service', 'UV Express'].map(
  mode => ({ text: mode, value: mode })
)

class RouteFormModal extends Component {
  state = {
    loading: false,
  }

  handleSubmit = async e => {
    e.preventDefault()
    const { mapPanel, notifications, form, session } = this.props
    try {
      notifications.clear(() => {
        notifications.enqueue('This might take some time...', 'info')
      })
      mapPanel.props.changeMapMode(MAP_MODE.VIEW)
      const {
        data: { route },
      } = await Axios.post('/api/routes', {
        path: mapPanel.state.newPath,
        mode: form.values.modeOfTransportation,
        description: form.values.description,
      })
      session.changeUser({ ...session.user, hasCreatedRoute: true })
      notifications.clear(() => {
        notifications.enqueue('Successfully added route!', 'success')
      })
      mapPanel.setState({
        routes: [...mapPanel.state.routes, route].filter(
          route => route.nodes.length
        ),
      })
    } catch ({ response }) {
      notifications.clear(() => {
        notifications.enqueue(response.data.message, 'error')
      })
    }
  }

  handleOnClose = () => {
    this.setState({ ...this.initialState })
    this.props.form.resetForm()
  }

  render() {
    const { trigger, form } = this.props
    const style = { marginTop: 0, width: '100%' }
    return (
      <Modal
        closeIcon
        style={style}
        trigger={trigger}
        onClose={this.handleOnClose}
        ref={modalRef => (this.modalRef = modalRef)}
      >
        <Modal.Header>Add Route</Modal.Header>

        <Modal.Content>
          {!!form.errors.length && <Message error list={form.errors} />}
          <Form onSubmit={this.handleSubmit} loading={this.state.loading}>
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

export default withNotifications(
  withSession(
    withForm(RouteFormModal, {
      modeOfTransportation: {
        initialValue: modes[0].value,
      },
      description: {},
    })
  )
)

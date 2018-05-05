import Axios from 'axios'
import React, { Component } from 'react'
import { Button, Form, Message, Modal } from 'semantic-ui-react'
import { withNotifications } from '../../providers/NotificationsProvider'
import withForm from '../../util/withForm'
import { withPlatform } from '../../providers/PlatformProvider'

const modes = ['Jeepney', 'Bus', 'Train', 'Shuttle Service', 'UV Express'].map(
  mode => ({ text: mode, value: mode })
)

class RouteFormModal extends Component {
  state = {
    loading: false,
  }

  handleSubmit = async e => {
    e.preventDefault()
    const { mapPanel, notifications, form } = this.props
    try {
      this.setState({ loading: true })
      const {
        data: { route },
      } = await Axios.put(`/api/routes/${mapPanel.state.selectedRoute.id}`, {
        mode: form.values.mode,
        description: form.values.description,
      })

      notifications.clear(() => {
        notifications.enqueue('Successfully edited route!', 'success')
      })

      mapPanel.setState({
        routes: mapPanel.state.routes.map(path => {
          if (path.id === route.id)
            return { ...path, mode: route.mode, description: route.description }
          return path
        }),
        path: mapPanel.state.path.map(path => {
          if (path.id === route.id)
            return { ...path, mode: route.mode, description: route.description }
          return path
        }),
        selectedRoute: {
          ...mapPanel.state.selectedRoute,
          mode: route.mode,
          description: route.description,
        },
      })
      this.modalRef.handleClose()
    } catch (err) {
      notifications.clear(() => {
        notifications.enqueue(err.response.data.message, 'error')

        this.setState({ loading: false })
      })
    }
  }

  handleOnOpen = () => {
    this.props.form.set.mode(null, {
      value: this.props.mapPanel.state.selectedRoute.mode,
    })
    this.props.form.set.description(null, {
      value: this.props.mapPanel.state.selectedRoute.description,
    })
  }

  handleOnClose = () => {
    this.setState({ loading: false })
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
        onClose={this.handleOnClose}
        onOpen={this.handleOnOpen}
        ref={modalRef => (this.modalRef = modalRef)}
      >
        <Modal.Header>Edit Route</Modal.Header>

        <Modal.Content>
          {!!form.errors.length && <Message error list={form.errors} />}
          <Form onSubmit={this.handleSubmit} loading={this.state.loading}>
            <Form.Select
              label="Mode of Transportation"
              options={modes}
              value={form.values.mode}
              onChange={form.set.mode}
            />
            <Form.TextArea
              label="Description"
              placeholder="Optional description of the route."
              value={form.values.description}
              onChange={form.set.description}
            />
            <Button type="submit" color="black" fluid>
              Edit Route
            </Button>
          </Form>
        </Modal.Content>
      </Modal>
    )
  }
}

export default withPlatform(
  withNotifications(
    withForm(RouteFormModal, {
      mode: {
        initialValue: modes[0].value,
      },
      description: {},
    })
  )
)

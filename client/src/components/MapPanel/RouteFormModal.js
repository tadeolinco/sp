import { Button, Form, Message, Modal } from 'semantic-ui-react'
import React, { Component } from 'react'

import Axios from 'axios'
import withForm from '../../util/withForm'

const modes = ['Jeepney', 'Bus', 'Train', 'Shuttle Service', 'UV Express'].map(
  mode => ({ text: mode, value: mode })
)

class RouteFormModal extends Component {
  initialState = {
    loading: false,
    originName: 'Loading...',
    destinationName: 'Loading...',
  }

  state = { ...this.initialState }

  handleSubmit = e => {
    e.preventDefault()
  }

  handleOnClose = () => {
    this.setState({ ...this.initialState })
    this.props.form.resetForm()
  }

  render() {
    const { trigger, form, mapPanel } = this.props
    const style = { marginTop: 0, width: '100%' }
    return (
      <Modal
        closeIcon
        style={style}
        trigger={trigger}
        onClose={this.handleOnClose}
        ref={modalRef => (this.modalRef = modalRef)}
      >
        <Modal.Header>Add Form</Modal.Header>

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

export default withForm(RouteFormModal, {
  modeOfTransportation: {
    initialValue: modes[0].value,
  },
  description: {},
})
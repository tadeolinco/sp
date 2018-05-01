import Axios from 'axios'
import qs from 'qs'
import React, { Component } from 'react'
import { Button, Form, FormInput, Message, Modal } from 'semantic-ui-react'
import { withNotifications } from '../providers/NotificationsProvider'
import withForm from '../util/withForm'

class SignupModal extends Component {
  state = { loading: false }

  signup = async e => {
    e.preventDefault()
    this.setState({ loading: true })
    const { form } = this.props
    try {
      await Axios.post('/api/users', {
        username: form.values.username,
        password: form.values.password,
      })

      this.modalRef.handleClose()
      this.props.notifications.enqueue('Successfully signed up!', 'success')
    } catch ({ response }) {
      this.props.notifications.clear(() => {
        this.props.notifications.enqueue(response.data.message, 'error')
      })
    } finally {
      this.setState({ loading: false })
    }
  }

  onClose = () => {
    this.props.form.resetForm()
  }

  render() {
    const { form, trigger } = this.props

    const style = { marginTop: 0, width: '100%' }
    return (
      <Modal
        closeIcon
        trigger={trigger}
        onClose={this.onClose}
        style={style}
        ref={modalRef => (this.modalRef = modalRef)}
      >
        <Modal.Header>Sign Up</Modal.Header>
        <Modal.Content>
          {!!form.errors.length && <Message error list={form.errors} />}
          <Form onSubmit={this.signup} loading={this.state.loading}>
            <FormInput
              value={form.values.username}
              onChange={form.set.username}
              placeholder="Username"
            />

            <FormInput
              value={form.values.password}
              onChange={form.set.password}
              placeholder="Password"
              type="password"
            />

            <Button type="submit" color="black" fluid disabled={!form.valid}>
              Sign Up
            </Button>
          </Form>
        </Modal.Content>
      </Modal>
    )
  }
}

export default withNotifications(
  withForm(SignupModal, {
    username: {
      validator: async (value, form) => {
        if (!value) {
          return 'Username is required.'
        }

        if (value.length < 4) {
          return 'Username must at least 4 characters.'
        }

        const {
          data: { users },
        } = await Axios.get('/api/users?' + qs.stringify({ username: value }))
        if (users.length) {
          return 'Username already taken.'
        }
      },
    },

    password: {
      validator: value => {
        if (!value) {
          return 'Password is required.'
        }
        if (value.length < 4) {
          return 'Password must at least 4 characters.'
        }
      },
    },
  })
)

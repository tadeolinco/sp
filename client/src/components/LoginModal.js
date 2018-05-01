import Axios from 'axios'
import React, { Component } from 'react'
import { Button, Form, FormInput, Message, Modal } from 'semantic-ui-react'
import { withNotifications } from '../providers/NotificationsProvider'
import { withSession } from '../providers/SessionProvider'
import withForm from '../util/withForm'

class LoginModal extends Component {
  state = { loading: false }

  login = async e => {
    e.preventDefault()
    this.setState({ loading: true })
    const { form, session, notifications } = this.props
    try {
      const {
        data: { user },
      } = await Axios.post('/api/login', {
        username: form.values.username,
        password: form.values.password,
      })

      this.modalRef.handleClose()
      notifications.enqueue(`Hi ${user.username}!`, 'success')
      session.changeUser(user)
    } catch ({ response }) {
      notifications.clear(() => {
        notifications.enqueue(response.data.message, 'error')
        this.setState({ loading: false })
      })
    }
  }

  onClose = () => {
    this.setState({ loading: false })
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
        <Modal.Header>Login</Modal.Header>
        <Modal.Content>
          {!!form.errors.length && <Message error list={form.errors} />}
          <Form onSubmit={this.login} loading={this.state.loading}>
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
              Login
            </Button>
          </Form>
        </Modal.Content>
      </Modal>
    )
  }
}

export default withNotifications(
  withSession(
    withForm(LoginModal, {
      username: {
        validator: value => {
          if (!value) {
            return 'Username is required.'
          }
        },
      },

      password: {
        validator: value => {
          if (!value) {
            return 'Password is required.'
          }
        },
      },
    })
  )
)

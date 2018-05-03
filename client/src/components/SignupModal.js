import Axios from 'axios'
import qs from 'qs'
import React, { Component } from 'react'
import { Button, Form, FormInput, Message, Modal } from 'semantic-ui-react'
import { withNotifications } from '../providers/NotificationsProvider'
import withForm from '../util/withForm'
import { withPlatform } from '../providers/PlatformProvider'
import { withSession } from '../providers/SessionProvider'

class SignupModal extends Component {
  state = { loading: false }

  signup = async e => {
    e.preventDefault()
    this.setState({ loading: true })
    const { form, session, notifications } = this.props
    try {
      const {
        data: { user },
      } = await Axios.post('/api/users', {
        username: form.values.username,
        password: form.values.password,
      })

      this.modalRef.handleClose()
      session.changeUser(user)
      notifications.enqueue(`Welcome, ${user.username}!`, 'success')
    } catch ({ response }) {
      notifications.clear(() => {
        notifications.enqueue(response.data.message, 'error')
      })
    } finally {
      this.setState({ loading: false })
    }
  }

  onClose = () => {
    this.props.form.resetForm()
  }

  render() {
    const { form, trigger, platform } = this.props
    const style = {
      marginTop: 0,
      width: '100%',
      marginLeft: 'auto',
      marginRight: 'auto',
    }
    if (!platform.isMobile) {
      style.maxWidth = '425px'
    }
    return (
      <Modal
        closeIcon={platform.isMobile}
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

export default withPlatform(
  withSession(
    withNotifications(
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
            } = await Axios.get(
              '/api/users?' + qs.stringify({ username: value })
            )
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
  )
)

import { Button, Message, Modal, Form, FormInput } from 'semantic-ui-react'
import React, { Component } from 'react'

import withForm from '../util/withForm'

class LoginModal extends Component {
  login = e => {
    e.preventDefault()
  }

  onClose = () => {
    this.props.form.resetForm()
  }

  render() {
    const { form, trigger } = this.props

    const style = { marginTop: 0, width: '100%' }
    return (
      <Modal closeIcon trigger={trigger} onClose={this.onClose} style={style}>
        <Modal.Header>Login</Modal.Header>
        <Modal.Content>
          <Form onSubmit={this.login}>
            {!!form.errors.length && <Message error list={form.errors} />}
            <FormInput
              value={form.values.email}
              onChange={form.set.email}
              placeholder="Email"
            />

            <FormInput
              value={form.values.password}
              onChange={form.set.password}
              placeholder="Password"
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

export default withForm(LoginModal, {
  email: {
    validator: value => {
      if (!value) {
        return 'Email is required.'
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

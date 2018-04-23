import React, { Component } from 'react'

class FormWrapper extends Component {
  constructor(props) {
    super(props)

    const { fields } = props

    this.state = {
      validators: {},
      errors: {},
      set: {},
      values: {},
      initialValues: {},
      reset: {},
    }

    for (const field in fields) {
      this.state.initialValues[field] =
        fields[field].initialValue === undefined
          ? ''
          : fields[field].initialValue

      this.state.values[field] = this.state.initialValues[field]

      this.state.errors[field] = null

      this.state.validators[field] = fields[field].validator || null

      this.state.set[field] = (event, data) => {
        const { value } = data
        const state = { ...this.state }
        state.values[field] = value
        this.setState(state, async () => {
          if (this.state.validators[field]) {
            const error =
              (await this.state.validators[field](value, this)) || null
            if (error !== this.state.errors[field]) {
              this.setState({
                errors: { ...this.state.errors, [field]: error },
              })
            }
          }
        })
      }

      this.state.reset[field] = () => {
        const state = { ...this.state }
        state.values[field] = state.initialValues[field]
        state.errors[field] = null
        this.setState(state)
      }
    }

    this.state.resetForm = () => {
      const state = { ...this.state }
      for (const field in fields) {
        state.values[field] = state.initialValues[field]
        state.errors[field] = null
      }
      this.setState(state)
    }
  }
  render() {
    const form = { ...this.state }

    let valid = true
    for (const field in this.props.fields) {
      if (typeof this.state.values[field] === 'boolean') continue
      if (
        (Array.isArray(this.state.values[field])
          ? !this.state.values[field].length
          : !this.state.values[field]) ||
        this.state.errors[field]
      ) {
        valid = false
        break
      }
    }
    form.valid = valid

    form.errors = [
      ...new Set(
        Object.keys(form.errors)
          .map(key => form.errors[key])
          .filter(err => err)
      ),
    ]

    delete form.validators
    return this.props.render(form)
  }
}

const withForm = (Component, fields) => props => (
  <FormWrapper
    fields={fields}
    render={form => <Component {...props} form={form} />}
  />
)

export default withForm

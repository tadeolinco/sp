import Axios from 'axios'
import React, { Component, Fragment } from 'react'
import { Button, Form, Modal, Radio } from 'semantic-ui-react'
import { withNotifications } from '../providers/NotificationsProvider'
import { withSession } from '../providers/SessionProvider'
import { withPlatform } from '../providers/PlatformProvider'

class SurveyModal extends Component {
  initialState = {
    questions: [
      'I think that I would like to use this system frequently.',
      'I found the system unnecessarily complex.',
      'I thought the system was easy to use.',
      'I think that I would need the support of a technical person to be able to use this system.',
      'I found the various functions in this system were well integrated.',
      'I thought there was too much inconsistency in this system.',
      'I would imagine that most people would learn to use this system very quickly.',
      'I found the system very cumbersome to use.',
      'I felt very confident using the system.',
      'I needed to learn a lot of things before I could get going with this system.',
    ],
    answers: [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    loading: false,
  }

  state = { ...this.initialState }

  onClose = () => {
    this.setState({ ...this.initialState })
  }

  handleSubmit = async e => {
    e.preventDefault()
    const { notifications, session } = this.props
    this.setState({ loading: true })
    try {
      const {
        data: { user },
      } = await Axios.post('/api/survey', {
        answers: this.state.answers,
      })

      notifications.clear(() => {
        notifications.enqueue('Thank you for helping me graduate!', 'success')
      })

      this.modalRef.handleClose()
      session.changeUser(user)
    } catch ({ response }) {
      notifications.clear(() => {
        notifications.enqueue(response.data.message, 'error')
        this.setState({ loading: false })
      })
    }
  }
  render() {
    const { trigger, platform } = this.props

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
        <Modal.Header>System Usability Survey</Modal.Header>
        <Modal.Content>
          <Form onSubmit={this.handleSubmit} loading={this.state.loading}>
            {this.state.questions.map((question, index) => {
              return (
                <Fragment key={index}>
                  <Form.Field>
                    {index + 1}. {question}
                  </Form.Field>
                  <Form.Field style={{ display: 'flex', textAlign: 'center' }}>
                    <span style={{ flex: 4, fontWeight: 'bold' }}>
                      Strongly Agree
                    </span>
                    {[1, 2, 3, 4, 5].map(num => (
                      <Radio
                        key={num}
                        style={{ flex: 1 }}
                        value={num}
                        name={question}
                        checked={this.state.answers[index] === num}
                        onChange={(e, { value }) => {
                          this.setState({
                            answers: this.state.answers.map(
                              (answer, answerIndex) => {
                                if (answerIndex === index) {
                                  return value
                                }
                                return answer
                              }
                            ),
                          })
                        }}
                      />
                    ))}
                    <span style={{ flex: 4, fontWeight: 'bold' }}>
                      Strongly Disagree
                    </span>
                  </Form.Field>
                  <br />
                </Fragment>
              )
            })}
            <Button
              type="submit"
              color="black"
              fluid
              disabled={!!this.state.answers.find(answer => answer === -1)}
            >
              Submit
            </Button>
          </Form>
        </Modal.Content>
      </Modal>
    )
  }
}

export default withPlatform(withNotifications(withSession(SurveyModal)))

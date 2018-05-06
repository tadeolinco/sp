import React, { Component } from 'react'
import { Button, Modal, Divider } from 'semantic-ui-react'
import { withPlatform } from '../providers/PlatformProvider'

class HelpModal extends Component {
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
        <Modal.Header>Help</Modal.Header>
        <Modal.Content style={{ textAlign: 'justify' }}>
          <h3>Finding Routes</h3>
          <p>
            To find routes, you have to specify where the origin and destination
            will be. You can do this by typing in the search bar or by clicking
            on the map. Once both origin and destination are set, we will try to
            find the best route for you to take.
          </p>
          <p>
            However, keep in mind that we might not find a route for you. The
            data that we have is what the community gives us. Existing routes
            are indicated by the black lines on the map.
          </p>
          <p>
            You can also click on the vehicle markers for more information on
            the route.
          </p>
          <Divider />

          <h3>Adding Routes</h3>
          <p>
            To add routes, you must be logged in. Once logged in, the menu will
            now have an 'Add route' option.
          </p>
          <p>
            After clicking the 'Add route' option, we will ask you where you'd
            like your route to start. It's best to put it on the road. Once
            you've decided, click 'Set Origin'.
          </p>
          <p>
            Next, you'll have to trace your route to your destination. Don't
            worry, we'll help you out! By clicking on the map, we'll try to
            trace your route along the road. If we make a mistake, just click
            'Undo', then we can try again. Shorter distances help us out a lot.
          </p>
          <p>
            Once you've reached your destination, click on 'Done'. You can now
            specify which vehicle should be taken, and an optional description
            of your route.
          </p>
          <Divider />
          <h3>Updating and Deleting Routes</h3>
          <p>Only the owner can edit their routes.</p>
          <p>
            You can do this by clicking on the route's vehicle marker then
            clicking update. You can update the vehicle used and it's
            description, but not the path that you made. We suggest you delete
            it, then make a new one with a new path.
          </p>
          <Divider />
          <h3>Reporting Routes</h3>
          <p>
            See a wrong route by another user? Or a route with a wonky path that
            doesn't match the road? You can report it by clicking on the thumbs
            down button on it's vehicle marker. Routes that have been reported
            numerous times will be less preferred by our system.
          </p>
          <Button
            color="black"
            fluid
            onClick={() => {
              this.modalRef.handleClose()
            }}
          >
            Thanks!
          </Button>
        </Modal.Content>
      </Modal>
    )
  }
}

export default withPlatform(HelpModal)

import { placesAutocomplete, getPlace, getPlaceById } from '../../googleMaps'

const controller = {
  getPlaces: {
    method: 'get',
    path: '/places',
    middlewares: [],
    handler: async (req, res) => {
      try {
        const places = await placesAutocomplete(req.query.input)
        res.status(200).json({ places })
      } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal server error.' })
      }
    },
  },

  getPlace: {
    method: 'get',
    path: '/place',
    middlewares: [],
    handler: async (req, res) => {
      try {
        const response = await getPlace({
          lat: +req.query.lat,
          lng: +req.query.lng,
        })

        res.status(200).json(response)
      } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal server error.' })
      }
    },
  },

  getPlaceById: {
    method: 'get',
    path: '/place/:place_id',
    middlewares: [],
    handler: async (req, res) => {
      try {
        const response = await getPlaceById(req.params.place_id)

        res.status(200).json(response)
      } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal server error.' })
      }
    },
  },
}

export default Object.keys(controller).map(key => controller[key])

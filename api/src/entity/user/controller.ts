import * as bcrypt from 'bcrypt'
import { getRepository } from 'typeorm'
import { isLoggedIn } from '../auth/middlware'
import User from './entity'
import Survey from '../survey/entity'

const controller = {
  getAll: {
    method: 'get',
    path: '/users',
    middlewares: [],
    handler: async (req, res) => {
      try {
        const userRepository = getRepository(User)
        const users = await userRepository.find(req.query)
        res.status(200).json({ users })
      } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal server error.' })
      }
    },
  },

  add: {
    method: 'post',
    path: '/users',
    middlewares: [],
    handler: async (req, res) => {
      try {
        const userRepository = getRepository(User)

        if (req.body.password) {
          const saltRounds = 10
          req.body.password = await bcrypt.hash(req.body.password, 10)
        }

        const user = await userRepository.save(req.body)
        user.survey = null
        req.session.user = user
        res.status(200).json({ user })
      } catch (err) {
        console.log(err.message)
        res.status(500).json({ message: 'Internal server error.' })
      }
    },
  },

  update: {
    method: 'put',
    path: '/users/:id',
    middlewares: [isLoggedIn],
    handler: async (req, res) => {
      try {
        const userRepository = getRepository(User)

        if (req.body.password) {
          const saltRounds = 10
          req.body.password = await bcrypt.hash(req.body.password, 10)
        }

        await userRepository.update(req.params.id, req.body)
        const user = await userRepository.findOneById(req.params.id)
        res.status(200).json({ data: user })
      } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal server error.' })
      }
    },
  },

  answerSurvey: {
    method: 'post',
    path: '/survey',
    middlewares: [isLoggedIn],
    handler: async (req, res) => {
      try {
        if (req.session.user.survey) {
          return res
            .status(400)
            .json({ message: 'User has already answered the survey' })
        }
        const surveryRepository = getRepository(Survey)
        const userRepository = getRepository(User)
        const { answers } = req.body
        const body = answers.reduce((body, answer, index) => {
          body[`question${index + 1}`] = +answer
          return body
        }, {})
        const survey = await surveryRepository.save(body)
        const user = await userRepository.findOneById(req.session.user.id)

        user.survey = survey
        await userRepository.save(user)
        req.session.user = user

        res.status(200).json({ user })
      } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal server error.' })
      }
    },
  },
}

export default Object.keys(controller).map(key => controller[key])

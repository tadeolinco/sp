import * as bcrypt from 'bcrypt'
import { getRepository } from 'typeorm'
import User from '../user/entity'
import { isLoggedIn } from './middlware'

const controller = {
  login: {
    method: 'post',
    path: '/login',
    middlewares: [],
    handler: async (req, res) => {
      try {
        const { username, password } = req.body
        const userRepository = getRepository(User)

        const user = await userRepository.findOne({ username })
        if (!user) {
          return res
            .status(404)
            .json({ message: 'User with that username does not exist.' })
        }

        if (!(await bcrypt.compare(password, user.password))) {
          return res.status(400).json({ message: 'Wrong credentials.' })
        }
        delete user.password
        req.session.user = user
        res.status(200).json({ user })
      } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal server error.' })
      }
    },
  },

  logout: {
    method: 'post',
    path: '/logout',
    middlewares: [isLoggedIn],
    handler: async (req, res) => {
      try {
        await req.session.destroy()
        res.status(200).json({})
      } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal server error.' })
      }
    },
  },

  session: {
    method: 'post',
    path: '/session',
    middlewares: [],
    handler: async (req, res) => {
      try {
        res.status(200).json({ user: req.session.user || null })
      } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal server error.' })
      }
    },
  },
}

export default Object.keys(controller).map(key => controller[key])

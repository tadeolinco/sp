import { getRepository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as emailRegex from 'email-regex';

import { isLoggedIn } from '../auth/middlware';
import User from './entity';

const controller = {
  getAll: {
    method: 'get',
    path: '/users',
    middlewares: [],
    handler: async (req, res) => {
      try {
        const userRepository = getRepository(User);
        const users = await userRepository.find();
        res.status(200).json({ data: users });
      } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal server error.' });
      }
    },
  },

  add: {
    method: 'post',
    path: '/users',
    middlewares: [],
    handler: async (req, res) => {
      try {
        const userRepository = getRepository(User);

        if (!emailRegex({ exact: true }).test(req.body.email)) {
          return res
            .status(404)
            .json({ message: 'Email provided is not an email.' });
        }

        if (req.body.password) {
          const saltRounds = 10;
          req.body.password = await bcrypt.hash(req.body.password, 10);
        }

        const user = await userRepository.save(req.body);
        res.status(200).json({ data: user });
      } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: 'Internal server error.' });
      }
    },
  },

  update: {
    method: 'put',
    path: '/users/:id',
    middlewares: [isLoggedIn],
    handler: async (req, res) => {
      try {
        const userRepository = getRepository(User);

        if (
          req.body.email &&
          !emailRegex({ exact: true }).test(req.body.email)
        ) {
          return res
            .status(404)
            .json({ message: 'Email provided is not an email.' });
        }

        if (req.body.password) {
          const saltRounds = 10;
          req.body.password = await bcrypt.hash(req.body.password, 10);
        }

        await userRepository.update(req.params.id, req.body);
        const user = await userRepository.findOneById(req.params.id);
        res.status(200).json({ data: user });
      } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal server error.' });
      }
    },
  },
};

export default Object.keys(controller).map(key => controller[key]);

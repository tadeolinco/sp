import Node from '../node/entity'
import Route from './entity'
import computeDistance from '../../util/computeDistance'
import fillPath from '../../util/fillPath'
import getPath from '../../util/getPath'
import { getRepository } from 'typeorm'
import { isLoggedIn } from '../auth/middlware'
import { snapToRoads } from '../../googleMaps'

const controller = {
  get: {
    method: 'get',
    path: '/routes',
    middlewares: [],
    handler: async (req, res) => {
      try {
        const path = await getPath(req.query.start, req.query.goal)

        res.status(200).json({ data: path })
      } catch (err) {
        console.log(err.message)
        res.status(500).json({ message: 'Internal server error.' })
      }
    },
  },

  add: {
    method: 'post',
    path: '/routes',
    middlewares: [isLoggedIn],
    handler: async (req, res) => {
      try {
        // fill in the gaps for each node
        const nodes = req.body.path.reduce((nodes, node, index, path) => {
          if (index === req.body.path.length - 1) return [...nodes, node]
          return [...nodes, node, ...fillPath(node, path[index + 1])]
        }, [])

        const routeRepository = getRepository(Route)
        const nodeRepository = getRepository(Node)

        const route = await routeRepository.save({
          owner: req.session.user,
          mode: req.body.mode,
        })

        const allNodes = await nodeRepository.find({ relations: ['paths'] })
        let latestNode = null

        const minimumDistance = 25 // in meters
        for (const node of nodes) {
          const paths = []

          // find all intersections using the threshold above
          for (const node2 of allNodes) {
            if (computeDistance(node, node2) < minimumDistance) {
              paths.push(node2)
            }
          }

          // connect this node with the latest new node
          if (latestNode && !req.body.isOneWay) {
            paths.push(latestNode)
          }
          const newNode = await nodeRepository.save({ ...node, paths, route })

          // connect all the nodes in the path with the new node
          for (const node of paths) {
            node.paths.push(newNode)
            await nodeRepository.save(node)
          }
          latestNode = newNode
        }

        res.status(200).json({ data: route })
      } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal server error.' })
      }
    },
  },

  update: {
    method: 'put',
    path: '/routes/:id',
    middlewares: [isLoggedIn],
    handler: async (req, res) => {
      try {
        const routeRepository = getRepository(Route)

        let route = await routeRepository.findOneById(req.params.id, {
          relations: ['owner'],
        })

        if (route.owner.id !== req.session.user.id) {
          return res
            .status(403)
            .json({ message: 'Only the owner can delete this route.' })
        }

        await routeRepository.save({ ...route, ...req.body })

        res.status(200).json({ data: route })
      } catch (err) {
        console.log(err.message)
        res.status(500).json({ message: 'Internal server error.' })
      }
    },
  },

  remove: {
    method: 'delete',
    path: '/routes/:id',
    middlewares: [],
    handler: async (req, res) => {
      try {
        const routeRepository = getRepository(Route)
        const nodeRepository = getRepository(Node)

        const route = await routeRepository.findOneById(req.params.id, {
          relations: ['owner', 'nodes'],
        })

        // if (route.owner.id !== req.session.user.id) {
        //   return res
        //     .status(403)
        //     .json({ message: 'Only the owner can delete this route.' });
        // }

        await nodeRepository.remove(route.nodes)
        await routeRepository.remove(route)
        res.status(200).json({})
      } catch (err) {
        console.log(err.message)
        res.status(500).json({ message: 'Internal server error.' })
      }
    },
  },

  addReport: {
    method: 'post',
    path: '/routes/:id/reports',
    middlewares: [isLoggedIn],
    handler: async (req, res) => {
      try {
        const routeRepository = getRepository(Route)

        const { user } = req.session

        const route = await routeRepository.findOneById(req.params.id, {
          relations: ['reporters'],
        })
        if (!route) {
          return res.status(404).json({ message: 'Route does not exist.' })
        }

        const found = route.reporters.find(reporter => reporter.id === user.id)
        if (found) {
          return res
            .status(400)
            .json({ message: 'User has already reported the route.' })
        }

        const reportThreshold = 10

        if (route.reporters.length >= reportThreshold - 1) {
          await routeRepository.remove(route)
          return res.status(200).json({ data: null })
        }

        route.reporters.push(user)
        await routeRepository.save(route)
        return res.status(200).json({ data: route })
      } catch (err) {
        console.log(err.message)
        res.status(500).json({ message: 'Internal server error.' })
      }
    },
  },

  removeReport: {
    method: 'delete',
    path: '/routes/:id/reports',
    middlewares: [isLoggedIn],
    handler: async (req, res) => {
      try {
        const routeRepository = getRepository(Route)

        const { user } = req.session

        const route = await routeRepository.findOneById(req.params.id, {
          relations: ['reporters'],
        })

        if (!route) {
          return res.status(404).json({ message: 'Route does not exist.' })
        }

        const reporter = route.reporters.find(
          reporter => reporter.id === user.id
        )

        if (!reporter) {
          return res
            .status(400)
            .json({ message: 'User has not reported this route.' })
        }

        route.reporters = route.reporters.filter(
          reporter => reporter.id !== req.params.userId
        )

        await routeRepository.save(route)

        res.status(200).json({ data: route })
      } catch (err) {
        console.log(err.message)
        res.status(500).json({ message: 'Internal server error.' })
      }
    },
  },
}

export default Object.keys(controller).map(key => controller[key])

import { getConnection, getRepository } from 'typeorm'

import Node from '../node/entity'
import Route from './entity'
import User from '../user/entity'
import computeDistance from '../../util/computeDistance'
import fillPath from '../../util/fillPath'
import getPath from '../../util/getPath'
import { intersection } from '../../util/turf'
import { isLoggedIn } from '../auth/middlware'
import { snapToRoads } from '../../googleMaps'

const controller = {
  snapToRoad: {
    method: 'get',
    path: '/snapToRoad',
    middlewares: [],
    handler: async (req, res) => {
      try {
        const path = await snapToRoads(req.query.path)
        if (!path) {
          res
            .status(400)
            .json({ message: 'Cannot trace route from these points.' })
        }
        res.status(200).json({ path })
      } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal server error.' })
      }
    },
  },

  path: {
    method: 'get',
    path: '/path',
    middlewares: [],

    handler: async (req, res) => {
      try {
        const path = await getPath(req.query.origin, req.query.destination)

        res.status(200).json({ path })
      } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal server error.' })
      }
    },
  },

  get: {
    method: 'get',
    path: '/routes',
    middlewares: [],
    handler: async (req, res) => {
      try {
        const routes = (await getRepository(Route).find({
          relations: ['nodes', 'nodes.paths', 'nodes.paths.route'],
        })).map((route: any) => {
          let firstNodeId = Number.POSITIVE_INFINITY
          const allNodes = route.nodes.reduce((map, node) => {
            if (node.id < firstNodeId) firstNodeId = node.id
            map[node.id] = node
            return map
          }, {})

          let path = []
          const keys = {}
          let node = allNodes[firstNodeId]

          keys[node.id] = 1
          path.push(node)

          while (Object.keys(keys).length !== route.nodes.length) {
            let found = false
            for (const pathNode of node.paths) {
              if (!keys[pathNode.id] && pathNode.route.id === route.id) {
                node = allNodes[pathNode.id]
                keys[node.id] = 1
                path.push(node)
                found = true
                break
              }
            }
            if (!found) break
          }

          route.nodes = path.map(p => ({ lat: p.lat, lng: p.lng, id: p.id }))

          return route
        })

        res.status(200).json({ routes })
      } catch (err) {
        console.log(err)
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
        const exp = 10000000000000
        req.body.path = req.body.path.filter((pathNode, index, path) => {
          if (index === 0) return true
          const pathNode2 = path[index - 1]
          if (
            Math.round(pathNode.lat * exp) / exp ===
              Math.round(pathNode2.lat * exp) / exp &&
            Math.round(pathNode.lng * exp) / exp ===
              Math.round(pathNode2.lng * exp) / exp
          )
            return false

          return true
        })

        const updatePath = async (nodeId, addIds, removeIds) => {
          return getConnection()
            .createQueryBuilder()
            .relation(Node, 'paths')
            .of(nodeId)
            .addAndRemove(addIds, removeIds)
        }

        /// Create route
        const { mode, description } = req.body
        const routeRepository = getRepository(Route)
        const route: any = await routeRepository.save({
          mode,
          description,
          owner: req.session.user,
          fare: 8,
        })

        /// Get all nodes along with their paths and routes
        const nodeRepository = getRepository(Node)
        const nodes = await nodeRepository.find({
          relations: ['paths', 'route'],
        })

        /// Create nodes from the provided path (we need the ids later)
        await getConnection()
          .createQueryBuilder()
          .insert()
          .into(Node)
          .values(req.body.path.map((p: any) => ({ ...p, route })))
          .execute()

        /// Refetch the path nodes (to get the ids)
        const path = await nodeRepository.find({ route })

        /// Create initial paths for the new nodes
        await Promise.all(
          path.map((p, index) => {
            const paths = []
            if (index === 0) {
              paths.push(path[1].id)
            } else if (index === path.length - 1) {
              paths.push(path[path.length - 2].id)
            } else {
              paths.push(path[index - 1].id, path[index + 1].id)
            }
            return updatePath(p.id, paths, [])
          })
        )

        const keys = {}
        const pathKeys = {}
        /// Loop over all nodes and their paths
        for (const node1 of nodes) {
          for (const node2 of node1.paths) {
            /// Cross check with all new nodes
            for (let i = 1; i < path.length; ++i) {
              const pathNode1 = path[i - 1]
              const pathNode2 = path[i]

              /// Check if this pairing has already been visited
              if (
                keys[
                  `${node1.id}@${node2.id}@${pathNode1.id}@${pathNode2.id}`
                ] ||
                keys[`${node2.id}@${node1.id}@${pathNode1.id}@${pathNode2.id}`]
              )
                continue

              keys[
                `${node1.id}@${node2.id}@${pathNode1.id}@${pathNode2.id}`
              ] = 1

              let sameNode1 = null
              let sameNode2 = null
              if (node2.lat === pathNode2.lat && node2.lng === pathNode2.lng) {
                sameNode1 = node2
                sameNode2 = pathNode2
              } else if (
                node1.lat === pathNode2.lat &&
                node1.lng === pathNode2.lng
              ) {
                sameNode1 = node1
                sameNode2 = pathNode2
              } else if (
                node1.lat === pathNode1.lat &&
                node1.lng === pathNode1.lng
              ) {
                sameNode1 = node1
                sameNode2 = pathNode1
              } else if (
                node2.lat === pathNode1.lat &&
                node2.lng === pathNode1.lng
              ) {
                sameNode1 = node2
                sameNode2 = pathNode1
              }

              if (sameNode1 && sameNode2) {
                if (
                  !pathKeys[`${sameNode1.id}@${sameNode2.id}`] &&
                  !pathKeys[`${sameNode2.id}@${sameNode1.id}`]
                ) {
                  await Promise.all([
                    updatePath(sameNode1, [sameNode2], []),
                    updatePath(sameNode2, [sameNode1], []),
                  ])
                }
                pathKeys[`${sameNode1.id}@${sameNode2.id}`] = true
              } else {
                const intersectingNode = intersection(
                  node1,
                  node2,
                  pathNode1,
                  pathNode2
                )

                if (intersectingNode) {
                  const responses = await Promise.all([
                    nodeRepository.save({
                      ...intersectingNode,
                      route,
                    }),
                    nodeRepository.save({
                      ...intersectingNode,
                      route: node1.route,
                    }),
                  ])
                  const newPathNode: any = responses[0]
                  const newNode: any = responses[1]
                  await Promise.all([
                    updatePath(
                      newNode,
                      [node1, node2, pathNode1, pathNode2],
                      []
                    ),
                    updatePath(
                      newPathNode,
                      [node1, node2, pathNode1, pathNode2],
                      []
                    ),
                    updatePath(node1, [newNode, newPathNode], [node2]),
                    updatePath(node2, [newNode, newPathNode], [node1]),
                    updatePath(pathNode1, [newNode, newPathNode], [pathNode2]),
                    updatePath(pathNode2, [newNode, newPathNode], [pathNode1]),
                  ])
                }
                // @TODO: handle over laps if ever necessary
                // else {
                //   let pathNode = null
                //   if (overlaps(node1, node2, pathNode1)) pathNode = { ...pathNode1 }
                //   else if (overlaps(node1, node2, pathNode2))
                //     pathNode = { ...pathNode2 }
                //   if (!pathNode) {
                //   }
                // }
              }
            }
          }
        }

        if (!req.session.user.hasCreatedRoute) {
          await getConnection()
            .createQueryBuilder()
            .update(User)
            .set({ hasCreatedRoute: true })
            .where('id = :id', { id: req.session.user.id })
            .execute()
        }

        res.status(200).json({
          route: await getRepository(Route)
            .createQueryBuilder('route')
            .leftJoinAndSelect('route.nodes', 'node')
            .orderBy('node.lat')
            .where('route.id = :id', { id: route.id })
            .getOne(),
        })
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

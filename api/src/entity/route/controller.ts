import { getConnection, getRepository, Connection } from 'typeorm'
import { snapToRoads } from '../../googleMaps'
import getPath from '../../util/getPath'
import { intersection, overlaps } from '../../util/turf'
import { isLoggedIn } from '../auth/middlware'
import Node from '../node/entity'
import User from '../user/entity'
import Route from './entity'

const controller = {
  snapToRoad: {
    method: 'get',
    path: '/snapToRoad',
    middlewares: [],
    handler: async (req, res) => {
      try {
        const path = await snapToRoads(req.query.path)
        if (!path) {
          return res
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
        const nodeRepository = getRepository(Node)

        // Remove adjacent nodes that are too much alike
        const exp = 10000000000000
        req.body.path = req.body.path.filter((pathNode, index, path) => {
          if (index === 0) return true
          const pathNode2 = path[index - 1]
          if (
            Math.ceil(pathNode.lat * exp) / exp ===
              Math.ceil(pathNode2.lat * exp) / exp &&
            Math.ceil(pathNode.lng * exp) / exp ===
              Math.ceil(pathNode2.lng * exp) / exp
          )
            return false

          return true
        })

        const updatePath = async (nodeId, addIds, removeIds = []) => {
          return getConnection()
            .createQueryBuilder()
            .relation(Node, 'paths')
            .of(nodeId)
            .addAndRemove(addIds, removeIds)
        }

        // Create route
        const { mode, description } = req.body
        const routeRepository = getRepository(Route)
        const route: any = await routeRepository.save({
          mode,
          description,
          owner: req.session.user,
        })

        // Get all nodes along with their paths and routes
        const nodes = await nodeRepository.find({
          relations: ['paths', 'route'],
        })

        const nodesMap = nodes.reduce((map, node) => {
          map[node.id] = node
          return map
        }, {})

        // Create nodes from the provided path (we need the ids later)
        await getConnection()
          .createQueryBuilder()
          .insert()
          .into(Node)
          .values(req.body.path.map((p: any) => ({ ...p, route })))
          .execute()

        // Refetch the path nodes (to get the ids)
        let pathNodes = await nodeRepository.find({ route })

        await Promise.all(
          pathNodes.map((p, index) => {
            const paths = []
            if (index === 0) {
              paths.push(pathNodes[1].id)
            } else if (index === pathNodes.length - 1) {
              paths.push(pathNodes[pathNodes.length - 2].id)
            } else {
              paths.push(pathNodes[index - 1].id, pathNodes[index + 1].id)
            }
            return updatePath(p.id, paths, [])
          })
        )

        pathNodes = await nodeRepository
          .createQueryBuilder('node')
          .innerJoinAndSelect('node.paths', 'paths')
          .innerJoinAndSelect('node.route', 'route')
          .where('node.routeId = :routeId', { routeId: route.id })
          .getMany()

        let pathNodesMap = pathNodes.reduce((map, node) => {
          map[node.id] = node
          return map
        }, {})

        let pathKeys = []
        let promises = []

        for (let i = 1; i < pathNodes.length; ++i) {
          const pathNode1 = pathNodes[i - 1]
          const pathNode2 = pathNodes[i]
          for (let j = 0; j < pathNodes.length; ++j) {
            const middleNode = pathNodes[j]
            if (
              j !== i &&
              j !== i - 1 &&
              overlaps(pathNode1, middleNode, pathNode2)
            ) {
              if (
                pathNode1.lat === middleNode.lat &&
                pathNode1.lng === middleNode.lng &&
                !pathKeys[`${pathNode1.id}@${middleNode.id}`]
              ) {
                pathKeys[`${pathNode1.id}@${middleNode.id}`] = true
                pathKeys[`${middleNode.id}@${pathNode1.id}`] = true
                promises.push(
                  updatePath(pathNode1, [middleNode], []),
                  updatePath(middleNode, [pathNode1], [])
                )
                pathNode1.paths.push({ ...middleNode })
                middleNode.paths.push({ ...pathNode1 })
              } else if (
                pathNode2.lat === middleNode.lat &&
                pathNode2.lng === middleNode.lng &&
                !pathKeys[`${pathNode2.id}@${middleNode.id}`]
              ) {
                pathKeys[`${pathNode2.id}@${middleNode.id}`] = true
                pathKeys[`${middleNode.id}@${pathNode2.id}`] = true
                promises.push(
                  updatePath(pathNode2, [middleNode], []),
                  updatePath(middleNode, [pathNode2], [])
                )
                pathNode2.paths.push({ ...middleNode })
                middleNode.paths.push({ ...pathNode2 })
              } else if (
                !pathKeys[`${pathNode1.id}@${middleNode.id}`] &&
                !pathKeys[`${pathNode2.id}@${middleNode.id}`]
              ) {
                pathKeys[`${pathNode2.id}@${middleNode.id}`] = true
                pathKeys[`${middleNode.id}@${pathNode2.id}`] = true
                pathKeys[`${pathNode1.id}@${middleNode.id}`] = true
                pathKeys[`${middleNode.id}@${pathNode1.id}`] = true
                promises.push(
                  updatePath(pathNode1, [middleNode], [pathNode2]),
                  updatePath(middleNode, [pathNode1, pathNode2], []),
                  updatePath(pathNode2, [middleNode], [pathNode1])
                )
                pathNode1.paths = pathNode1.paths.filter(
                  node => node.id !== pathNode2.id
                )
                pathNode1.paths.push({ ...middleNode })
                middleNode.paths.push({ ...pathNode1 }, { ...pathNode2 })
                pathNode2.paths = pathNode2.paths.filter(
                  node => node.id !== pathNode1.id
                )
                pathNode2.paths.push({ ...middleNode })
              }
            }
          }
        }

        await Promise.all(promises)

        promises = []
        pathKeys = []

        const check = async (leftNode, middleNode, rightNode) => {
          const promises = []
          if (
            !pathKeys[
              `${leftNode.route.id}@${middleNode.lat}@${middleNode.lng}`
            ] &&
            overlaps(leftNode, middleNode, rightNode)
          ) {
            if (
              middleNode.lat === leftNode.lat &&
              middleNode.lng === leftNode.lng
            ) {
              pathKeys[
                `${leftNode.route.id}@${middleNode.lat}@${middleNode.lng}`
              ] = true
              pathKeys[
                `${middleNode.route.id}@${leftNode.lat}@${leftNode.lng}`
              ] = true
              promises.push(
                updatePath(middleNode, [leftNode], []),
                updatePath(leftNode, [middleNode], [])
              )
            } else if (
              middleNode.lat === rightNode.lat &&
              middleNode.lng === rightNode.lng
            ) {
              pathKeys[
                `${nodesMap[rightNode.id].route.id}@${middleNode.lat}@${
                  middleNode.lng
                }`
              ] = true
              pathKeys[
                `${middleNode.route.id}@${rightNode.lat}@${rightNode.lng}`
              ] = true
              promises.push(
                updatePath(middleNode, [rightNode], []),
                updatePath(rightNode, [middleNode], [])
              )
            } else {
              pathKeys[
                `${leftNode.route.id}@${middleNode.lat}@${middleNode.lng}`
              ] = true
              const newNode = await nodeRepository.save({
                lat: middleNode.lat,
                lng: middleNode.lng,
                route: leftNode.route,
              })
              promises.push(
                updatePath(leftNode, [newNode], [rightNode]),
                updatePath(newNode, [leftNode, rightNode, middleNode], []),
                updatePath(rightNode, [newNode], [leftNode])
              )
            }
          }
          return promises
        }

        /// Loop over all nodes and their paths
        for (const node1 of nodes) {
          for (const node2 of node1.paths) {
            for (const pathNode1 of pathNodes) {
              promises = promises.concat(await check(node1, pathNode1, node2))
              if (pathKeys[`${pathNode1.route.id}@${node1.lat}@${node1.lng}`])
                continue
            }
          }
          for (const pathNode1 of pathNodes) {
            for (const pathNode2 of pathNode1.paths) {
              promises = promises.concat(
                await check(pathNode1, node1, pathNode2)
              )
            }
          }
        }

        await Promise.all(promises)

        if (!req.session.user.hasCreatedRoute) {
          await getConnection()
            .createQueryBuilder()
            .update(User)
            .set({ hasCreatedRoute: true })
            .where('id = :id', { id: req.session.user.id })
            .execute()
          req.session.user.hasCreatedRoute = true
        }

        const newRoute: any = await getRepository(Route).findOneById(route.id, {
          relations: ['nodes', 'nodes.paths', 'nodes.paths.route'],
        })
        let firstNodeId = Number.POSITIVE_INFINITY
        const allNodes = newRoute.nodes.reduce((map, node) => {
          if (node.id < firstNodeId) firstNodeId = node.id
          map[node.id] = node
          return map
        }, {})

        const newPath = []
        const newKeys = {}
        let node = allNodes[firstNodeId]

        newKeys[node.id] = 1
        newPath.push(node)

        while (Object.keys(newKeys).length !== newRoute.nodes.length) {
          let found = false
          for (const pathNode of node.paths) {
            if (!newKeys[pathNode.id] && pathNode.route.id === newRoute.id) {
              node = allNodes[pathNode.id]
              newKeys[node.id] = 1
              newPath.push(node)
              found = true
              break
            }
          }
          if (!found) break
        }

        newRoute.nodes = newPath.map(p => ({
          lat: p.lat,
          lng: p.lng,
          id: p.id,
        }))
        res.status(200).json({
          route: newRoute,
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
            .json({ message: 'Only the owner can edit this route.' })
        }

        route = await routeRepository.save({ ...route, ...req.body })

        res.status(200).json({ route })
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

        if (route.owner.id !== req.session.user.id) {
          return res
            .status(403)
            .json({ message: 'Only the owner can delete this route.' })
        }

        let where = ''
        route.nodes.forEach((node, index) => {
          if (index) where += ' OR'
          where += ` nodeId_1 = ${node.id} OR nodeId_2 = ${node.id}`
        })

        await getConnection().query(
          `DELETE FROM node_paths_node WHERE ${where}`
        )
        await getConnection().query(
          `DELETE FROM user_reports_route WHERE routeId = ${route.id}`
        )
        await nodeRepository.removeByIds(route.nodes.map(node => node.id))
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
          route.reporters = route.reporters.filter(
            reporter => reporter.id !== user.id
          )
        } else {
          route.reporters.push(user)
        }

        await routeRepository.save(route)
        return res.status(200).json({ route })
      } catch (err) {
        console.log(err.message)
        res.status(500).json({ message: 'Internal server error.' })
      }
    },
  },
}

export default Object.keys(controller).map(key => controller[key])

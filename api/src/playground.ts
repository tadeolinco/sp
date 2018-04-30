import { intersection, overlaps } from './util/turf'

import Route from './entity/route/entity'
import { getRepository, getConnection, getTreeRepository } from 'typeorm'
import timeMe from './util/timeMe'
import Node from './entity/node/entity'
import { notDeepStrictEqual } from 'assert'
import User from './entity/user/entity'
;(async () => {
  const user = await getRepository(User).save({
    username: 'tadeolinco',
    password: 'lollipop0',
  })

  const route = await getRepository(Route).save({
    mode: 'Jeepney',
    description: '',
    owner: user,
    fare: 8,
  })

  const node1 = await getRepository(Node).save({
    lat: 14.178447656925758,
    lng: 121.24201986002572,
    route,
  })

  const node2 = await getRepository(Node).save({
    lat: 14.178480683926534,
    lng: 121.24187969047148,
    route,
  })

  await getRepository(Node).save({ ...node1, paths: [node2] })
  await getRepository(Node).save({ ...node2, paths: [node1] })

  await timeMe(async () => {
    const req = {
      body: {
        path: [
          { lat: 14.178458, lng: 121.24193 },
          { lat: 14.178569, lng: 121.241491 },
        ],
        mode: 'Jeepney',
        description: '',
      },
      session: { user },
    }

    const updatePath = async (nodeId, addIds, removeIds) => {
      return getConnection()
        .createQueryBuilder()
        .relation(Node, 'paths')
        .of(nodeId)
        .addAndRemove(addIds, removeIds)
    }

    // perpendicular

    // colinear
    // const path = [
    //   { lat: 14.17840521374148, lng: 121.24223088442722 },
    //   { lat: 14.178389, lng: 121.242222 },
    // ]

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
    const nodes = await nodeRepository.find({ relations: ['paths', 'route'] })

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
    /// Loop over all nodes and their paths
    for (const node1 of nodes) {
      for (const node2 of node1.paths) {
        /// Cross check with all new nodes
        for (let i = 1; i < path.length; ++i) {
          const pathNode1 = path[i - 1]
          const pathNode2 = path[i]

          /// Check if this pairing has already been visited
          if (
            keys[`${node1.id}@${node2.id}@${pathNode1.id}@${pathNode2.id}`] ||
            keys[`${node2.id}@${node1.id}@${pathNode1.id}@${pathNode2.id}`]
          )
            continue

          keys[`${node1.id}@${node2.id}@${pathNode1.id}@${pathNode2.id}`] = 1

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
              updatePath(newNode, [node1, node2, pathNode1, pathNode2], []),
              updatePath(newPathNode, [node1, node2, pathNode1, pathNode2], []),
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
  })
  console.log('DONE')
})()

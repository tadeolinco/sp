// https://en.wikipedia.org/wiki/A%2a_search_algorithm#Pseudocode
import { getRepository } from 'typeorm'
import * as StablePriorityQueue from 'stablepriorityqueue'

import Node from '../entity/node/entity'
import computeDistance from './computeDistance'
import { getDistance } from '../googleMaps'

const constructPath = (cameFrom, current) => {
  let path = [current]
  while (cameFrom[current.id]) {
    current = cameFrom[current.id]
    path.unshift(current)
  }

  let routes = [path[0].route]
  routes[0].nodes = []

  path.forEach(node => {
    const routeId = node.route.id
    let route = routes[routes.length - 1]
    if (node.route.id === route.id) {
      route.nodes.push({ lat: node.lat, lng: node.lng, id: node.id })
    } else {
      routes.push(node.route)
      route = routes[routes.length - 1]
      route.nodes = [{ lat: node.lat, lng: node.lng, id: node.id }]
    }
  })

  routes = routes.filter(route => route.nodes.length > 1)
  // for (const route of routes) {
  //   console.log(`Route[${route.id}] = ${route.nodes.length}`)
  // }
  return routes
}

const getPath = async (start, goal) => {
  const graph = await getRepository(Node).find({
    relations: ['paths', 'route'],
  })

  if (!graph.length) return []

  let startMinDistance = Number.POSITIVE_INFINITY
  let newStart = graph[0]
  let goalMinDistance = Number.POSITIVE_INFINITY
  let newGoal = graph[0]
  let distance = 0

  /// Get nearest actual nodes from the start and goal
  for (const node of graph) {
    distance = computeDistance(node, start)
    if (distance < startMinDistance) {
      newStart = node
      startMinDistance = distance
    }
    distance = computeDistance(node, goal)
    if (distance < goalMinDistance) {
      newGoal = node
      goalMinDistance = distance
    }
  }

  start = newStart
  goal = newGoal

  const nodeMap = graph.reduce((map, node) => {
    map[node.id] = node
    return map
  }, {})

  const compareFunction = (a, b) => fScore[a] - fScore[b]
  // const openSet = []
  const openSet = new StablePriorityQueue(compareFunction)
  const closedSet = {}
  const cameFrom = {}

  const gScore = graph.reduce((score, node) => {
    score[node.id] = Number.POSITIVE_INFINITY
    return score
  }, {})

  const fScore = { ...gScore }
  gScore[start.id] = 0
  fScore[start.id] = computeDistance(start, goal)

  // openSet.push(start.id)
  openSet.add(start.id)

  while (!openSet.isEmpty()) {
    const current: Node = nodeMap[openSet.poll()]

    if (computeDistance(current, goal) === 0) {
      return constructPath(cameFrom, current)
    }

    closedSet[current.id] = true

    for (const neighbor of current.paths) {
      if (closedSet[neighbor.id]) continue

      let tempG = gScore[current.id] + computeDistance(neighbor, current)
      if (nodeMap[neighbor.id].route.id !== current.route.id) {
        tempG += gScore[current.id]
      }
      if (tempG >= gScore[neighbor.id]) continue

      cameFrom[neighbor.id] = current
      gScore[neighbor.id] = tempG
      fScore[neighbor.id] =
        gScore[neighbor.id] + computeDistance(neighbor, goal)

      openSet.add(neighbor.id)
    }
  }

  return []
}

export default getPath

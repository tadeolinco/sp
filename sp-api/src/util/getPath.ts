// https://en.wikipedia.org/wiki/A%2a_search_algorithm#Pseudocode
import { getRepository } from 'typeorm'
import * as FastPriorityQueue from 'fastpriorityqueue'

import Node from '../entity/node/entity'
import computeDistance from './computeDistance'
import { getDistance } from '../googleMaps'

const constructPath = (cameFrom, current: Node) => {
  const path = [current]
  while (cameFrom[current.id]) {
    current = cameFrom[current.id]
    path.push(current)
  }

  return path.reverse().map(node => {
    delete node.paths
    return node
  })
}

const getPath = async (start, goal) => {
  const nodeRepository = getRepository(Node)
  const graph = await nodeRepository.find({ relations: ['paths', 'route'] })

  let startMinDistance = Number.POSITIVE_INFINITY
  let newStart = graph[0]
  let goalMinDistance = Number.POSITIVE_INFINITY
  let newGoal = graph[0]
  let distance = 0

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

  const compareFunction = (a: Node, b: Node) => fScore[a.id] - fScore[b.id]
  const openSet = new FastPriorityQueue(compareFunction)
  const closedSet = {}
  const cameFrom = {}

  const gScore = graph.reduce((score, node) => {
    score[node.id] = Number.POSITIVE_INFINITY
    return score
  }, {})

  const fScore = { ...gScore }
  gScore[start.id] = 0
  fScore[start.id] = computeDistance(start, goal)

  openSet.add(start.id)

  while (!openSet.isEmpty()) {
    const current: Node = nodeMap[openSet.poll()]
    console.log(current)

    if (computeDistance(current, goal) < 5) {
      return constructPath(cameFrom, goal)
    }

    closedSet[current.id] = true

    for (const neighbor of current.paths) {
      if (closedSet[neighbor.id]) continue

      openSet.add(neighbor.id)

      const tempG = gScore[current.id] + computeDistance(current, neighbor)
      if (tempG >= gScore[neighbor.id]) continue

      cameFrom[neighbor.id] = current
      gScore[neighbor.id] = tempG
      fScore[neighbor.id] =
        gScore[neighbor.id] + computeDistance(neighbor, goal)
    }
  }

  return []
}

export default getPath

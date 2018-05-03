import { getConnection, getRepository } from 'typeorm'
import Node from './entity/node/entity'
import Route from './entity/route/entity'
import User from './entity/user/entity'
import timeMe from './util/timeMe'
import { intersection } from './util/turf'
;(async () => {
  const exp = 10000000000000
  const pathNode = { lat: 14.163298233199749, lng: 121.24015309938301 }
  const pathNode2 = { lat: 14.163298233199745, lng: 121.24015309938301 }
  console.log(Math.ceil(pathNode.lat * exp) / exp)
  console.log(Math.ceil(pathNode2.lat * exp) / exp)
  console.log(Math.ceil(pathNode.lng * exp) / exp)
  console.log(Math.ceil(pathNode2.lng * exp) / exp)
})()

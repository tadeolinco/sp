import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinTable,
  OneToMany,
} from 'typeorm'
import Node from '../node/entity'
import User from '../user/entity'
import { DESTRUCTION } from 'dns'

@Entity()
class Route {
  @PrimaryGeneratedColumn() id: number

  @Column() fare: number

  @Column() mode: string

  @Column() description: string

  @ManyToOne(type => User, user => user.routes)
  owner: User

  @ManyToMany(type => User, user => user.reports)
  reporters: User[]

  @OneToMany(type => Node, node => node.route)
  @JoinTable()
  nodes: Node[]
}

export default Route

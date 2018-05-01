import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import Node from '../node/entity'
import User from '../user/entity'

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

  @OneToMany(type => Node, node => node.route, {
    cascadeInsert: true,
    cascadeUpdate: true,
  })
  @JoinTable()
  nodes: Node[]
}

export default Route

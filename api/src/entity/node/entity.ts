import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import Route from '../route/entity'

@Entity()
class Node {
  @PrimaryGeneratedColumn() id: number

  @Column({ type: 'double' })
  lat: number

  @Column({ type: 'double' })
  lng: number

  @ManyToOne(type => Route, route => route.nodes, { cascadeAll: true })
  route: Route

  @ManyToMany(type => Node, { cascadeInsert: true, cascadeUpdate: true })
  @JoinTable()
  paths: Node[]
}

export default Node

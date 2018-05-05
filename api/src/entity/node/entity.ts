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

  @ManyToOne(type => Route, route => route.nodes, { onDelete: 'CASCADE' })
  route: Route

  @ManyToMany(type => Node)
  @JoinTable()
  paths: Node[]
}

export default Node

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm'
import Node from '../node/entity'
import Route from '../route/entity'

@Entity()
class User {
  @PrimaryGeneratedColumn() id: number

  @Column() nickname: string

  @Column({ unique: true })
  email: string

  @Column() password: string

  @OneToMany(type => Route, route => route.owner)
  routes: Route[]

  @ManyToMany(type => Route, route => route.reporters)
  @JoinTable()
  reports: Route[]
}

export default User

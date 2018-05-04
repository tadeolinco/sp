import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import Route from '../route/entity'

@Entity()
class User {
  @PrimaryGeneratedColumn() id: number

  @Column({ unique: true })
  username: string

  @Column() password: string

  @Column({ default: false })
  hasCreatedRoute: boolean

  @OneToMany(type => Route, route => route.owner)
  routes: Route[]

  @ManyToMany(type => Route, route => route.likers)
  @JoinTable()
  likes: Route[]

  @ManyToMany(type => Route, route => route.dislikers)
  @JoinTable()
  dislikes: Route[]
}

export default User

import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm'
import Route from '../route/entity'
import Survey from '../survey/entity'

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

  @ManyToMany(type => Route, route => route.reporters)
  @JoinTable()
  reports: Route[]

  @OneToOne(type => Survey, survey => survey.user)
  @JoinColumn()
  survey: Survey
}

export default User

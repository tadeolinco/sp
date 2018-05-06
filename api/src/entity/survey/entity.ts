import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm'
import Route from '../route/entity'
import User from '../user/entity'

@Entity()
class Survey {
  @PrimaryGeneratedColumn() id: number

  @Column() question1: number
  @Column() question2: number
  @Column() question3: number
  @Column() question4: number
  @Column() question5: number
  @Column() question6: number
  @Column() question7: number
  @Column() question8: number
  @Column() question9: number
  @Column() question10: number

  @OneToOne(type => User, user => user.survey)
  user: User
}

export default Survey

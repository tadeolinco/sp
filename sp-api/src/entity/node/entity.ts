import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import User from '../user/entity';
import Route from '../route/entity';

@Entity()
class Node {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: 'double' })
  lat: number;

  @Column({ type: 'double' })
  lng: number;

  @ManyToOne(type => Route, route => route.nodes)
  route: Route;

  @ManyToMany(type => Node)
  @JoinTable()
  paths: Node[];
}

export default Node;

import * as bodyParser from 'body-parser'
import * as express from 'express'
import * as store from 'express-mysql-session'
import * as session from 'express-session'
import * as logger from 'morgan'
import * as path from 'path'
import 'reflect-metadata'
import { createConnection } from 'typeorm'
import * as dbConfig from '../ormconfig.json'
import router from './router'

createConnection()
  .then(async connection => {
    console.log('Success in connecting to database')
    // create express app
    const app = express()
    const MySQLStore = store(session)
    const sessionStore = new MySQLStore({
      user: (<any>dbConfig).username,
      database: (<any>dbConfig).database,
      password: (<any>dbConfig).password,
    })

    app.use(
      session({
        secret: 'random secret',
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
      })
    )

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))

    app.use(logger('dev'))

    app.use('/api', router)

    app.use('/', express.static(path.join(__dirname, 'build')))

    app.use('*', (req, res) => res.redirect('/'))
    const port = process.env.PORT || 3001

    // start express server
    app.listen(port, () => {
      console.log(`Server listening at port: ${port}`)
    })
  })
  .catch(error => {
    console.log('Error in connecting to database')
    console.log(error)
  })

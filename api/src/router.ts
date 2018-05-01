import { Router } from 'express'
import * as glob from 'glob'

const router = Router()

glob('src/entity/**/controller.ts', (err, filePaths) => {
  filePaths.forEach(filePath => {
    const relativePath = `.${filePath.slice(3, filePath.length)}`

    const controller = require(relativePath).default

    controller.forEach(({ method, path, middlewares, handler }) => {
      router[method](path, ...middlewares, handler)
    })
  })
})

export default router

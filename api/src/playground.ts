import timeMe from './util/timeMe'
import { getPlaceById } from './googleMaps'
;(async () => {
  await timeMe(async () => {
    await getPlaceById('as')
  })
  console.log('DONE')
})()

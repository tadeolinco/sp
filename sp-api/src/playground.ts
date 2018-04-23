import timeMe from './util/timeMe'
;(async () => {
  await timeMe(async () => {})
  console.log('DONE')
})()

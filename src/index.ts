const camera = require('./camera')
const update = require('./update')
const filter = require('./filter')
const forever = require('forever-monitor')

// TODO: read this in from settings file
const settings = {
  camera: 'dummy',
  call: [
    'php', //'alpr',
    './dummy.php', //'-c','au','-n','3','-j','/dev/video0'],
  ],
  confidence: 88,
  location: 'NodeJS testing',
  apiHost: 'http://localhost:3000',
  apiName: 'parking',
  apiTarget: 'junction',
}

// set an empty array to load results in to memory
var alpr: string[] = []

// initialise the camera from cold start
camera.init(settings.camera).catch((err: any) => {
  console.error(err)
  process.exit(1)
})

// spawn a stream of ALPR data from the camera on a watchdog with 3s idle (crash) timer
const stream = forever.start(settings.call, {
  uid: `node-forever-${settings.call[0]}`,
  silent: true,
  killTree: true,
  minUptime: 4000,
  spinSleepTime: 3000,
})

// set two counters
var counter = 0

stream.on('restart', () => {
  console.log(`Restart #${stream.times} for '${settings.call[0]}' stream`)
})

stream.on('exit:code', (code: number) => {
  console.log(`'${settings.call[0]}' exited with code ${code}`)
})

stream.on('error', (err: any) => {
  console.log(`${err}`)
})

stream.on('stdout', (json: string) => {
  //console.log(`${settings.call[0]} returned data: ${json}`)
  try {
    let data = JSON.parse(json)
    filter
      .plates(data, settings.confidence)
      .then((result: any) => {
        result.plates.forEach((plate: string) => {
          console.log(`${result.time} - Observed plate ${plate}`)
          alpr.push(plate) // push the confident plates from the camera frame in to processing array
        })
      })
      .catch((err: any) => console.log(err))
  } catch (err) {
    console.log(`Received something other than JSON data. ${err}`)
  }
})

// every 4 seconds filter the current set of plates for unique-ness based on similarity
setInterval(() => {
  console.log(`Filtering plates...`)
  filter
    .unique(alpr)
    .then((res: any) => {
      if (alpr.length == res.length) {
        console.log(`No changes to ALPR buffer`)
      } else {
        console.log(`Filtered ALPR buffer from ${alpr.length} to ${res.length}`)
        alpr = res
      }
    })
    .catch((err: any) => {
      console.log(err)
    })
    .finally(() => {
      counter++
      // every 5th rotation (20s) upload current set of filtered plates
      if (alpr.length && counter >= 5) {
        let url = [settings.apiHost, settings.apiName, settings.apiTarget].join('/')
        let json = { plates: alpr }
        update
          .api(url, json)
          .then((res: any) => {
            console.log(`Recording plates...${res.statusText} (code: ${res.status})`)
            console.log(`${JSON.stringify(json)} sent to ${url}`)
            alpr = [] // clear ALPR data
          })
          .catch((err: any) => {
            console.log(`Failed to send ${json} to ${url}:\n`, err)
          })
          counter = 0 // reset counter
      } else if(counter >= 5) {
        console.log(`No data to send`)
        counter = 0
      }
    })
    console.log(`Counter: ${counter}`)
}, 4000)
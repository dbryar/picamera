const util = require('util')
const exec = util.promisify(require('child_process').exec)

export function init(type: string) {
  let command: string
  return new Promise(function (resolve, reject) {
    if (!type) reject(Error('Failed to initialize camera; Type not set'))
    switch (type) {
      case 'internal':
        command = 'sudo modprobe bcm2835-v4l2'
        break // Enable the internal Pi Cam on /dev/video0
      case 'dummy':
        command = 'uname'
        break // the dummy is for development where no camera is available. uses PHP to fake stream pre-recored results
      case 'error':
        command = 'false'
        break // this is only for testing an exit(1) return from exec
      default:
        reject(Error('Failed to initialize camera; Invalid type set'))
    }
    // attempt to execute the command, and return promised result
    exec(command)
      .then((result: any) => {
        console.log(`executing ${command}`, result)
        if (result.stderr == '') resolve(result.stdout)
        if (result.stderr !== '') reject(Error(result.stderr))
      })
      .catch((err: any) => {
        reject(Error(`Failed to execute ${command}. ${err}`))
      })
  })
}

const moment = require('moment')
const compare = require('string-similarity')

export async function plates(data: any, min: number) {
  return new Promise((resolve, reject) => {
    let time = moment(data.epoch_time).format('HH:mm:ss.SSS DD-MM-YYYY')
    if (data.data_type !== 'alpr_results') reject('Invalid data') // if its not ALPR data, reject it
    if (!data.results.length) reject(`${time} - No plates observed`) // nothing to see here, move on
    if (data.results.length) {
      // we have a result, or result(s)
      let plates: string[] = []
      data.results.forEach((item: any) => {
        if (item.confidence > min) {
          plates.push(item.plate) // good enough result, log it to array in memory
        } else {
          if (plates.length) {
            // if some good plates exists in the array, resolve them back
            resolve({
              time: time,
              plates: plates,
            })
          } else {
            // if best result is too low reject the reading
            reject(
              `${time} - ${
                item.plate
              } below threshold (${item.confidence.toFixed(2)})`
            )
          }
        }
      })
      resolve({
        // resolve the array if all results are good
        time: time,
        plates: plates,
      })
    }
  })
}

export async function unique(data: string[]) {
  return new Promise((resolve, reject) => {
    if (!data.length || !data) {
      reject(`No data to filter`)
    } else if (data.length === 1) {
      resolve(data) // only one result, just send it back
    } else {
      // order data by number of results and store in a separate array for testing
      let test = byCount(data)
      console.log(
        `Testing from most to least frequent over ${data.length} tests`,
        test
      )

      // check backwards each plate in the array against the test array to remove similar but less frequent results.
      test.forEach((plate) => {
        for (let i = data.length - 1; i >= 0; i--) {
          let match = compare.compareTwoStrings(plate, data[i])
          console.log(
            `Testing ${plate} against ${data[i]}...(${100 * match.toFixed(2)})`
          )
          if (match > 0.75 && match !== 1) {
            console.log(
              `${data[i]} is too similar to ${plate} - removing from ALPR buffer`
            )
            // if the last item in the test array is the same as the item we just removed, delete it from the test array too
            if (test[test.length - 1] === data[i]) {
              test.pop()
              console.log(`${data[i]} removed from test patterns`)
            }
            data.splice(i, 1)
          }
          if (i == 0) resolve(byCount(data)) // last item filtered, order and resolve
        }
      })
    }
  })
}

function byCount(data: string[]) {
  let item: any,
    a: any[] = [],
    L = data.length,
    o: { [key: number]: any } = {}
  for (let i = 0; i < L; i++) {
    item = data[i]
    if (!item) continue
    if (o[item] == undefined) o[item] = 1
    else ++o[item]
  }
  for (let p in o) a[a.length] = p
  return a.sort(function (a, b) {
    return o[b] - o[a]
  })
}

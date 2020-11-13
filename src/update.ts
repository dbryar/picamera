const axios = require('axios')

export async function api(url: any, data: any) {
  return new Promise((resolve, reject) => {
    console.log(`posting to ${url}`)
    axios
      .post(url, data)
      .then(function (res: any) {
        //console.log(res);
        resolve(res)
      })
      .catch(function (err: any) {
        //console.log(err);
        reject(err)
      })
  })
}

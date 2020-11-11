import {Request, Response } from 'express'
import {handleHttpCall} from './main'
const app = require('express')()
const pretty = require('express-prettify')

app.use(pretty({ query: 'pretty' }))
const port = 3000
app.get('/', (req:Request, res:Response) => {
  res.send('Hello World!')
})
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
app.get('/gtfs', (req:Request, res:Response) => {
  handleHttpCall(req,res)
})
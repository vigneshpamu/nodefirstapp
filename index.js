import express from 'express'
import path from 'path'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

mongoose
  .connect('mongodb://127.0.0.1:27017', {
    dbName: 'backend',
  })
  .then((c) => console.log('Database is Connected'))
  .catch((e) => console.log(e))

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
})

const User = mongoose.model('User', userSchema)

const app = express()

// Using Middleware
app.use(express.static(path.join(path.resolve(), 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
// express.static(path.join(path.resolve(), 'public'))

// Setting Up View Engine
app.set('view engine', 'ejs')

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies
  if (token) {
    const decoded = jwt.verify(token, 'dfasdfbasdfahfuweo')
    req.user = await User.findById(decoded._id)

    next()
  } else {
    res.redirect('/login')
  }
}

app.get('/', isAuthenticated, (req, res, next) => {
  console.log(req.user)
  res.render('logout', { name: req.user.name })
})

app.get('/login', (req, res, next) => {
  console.log(req.user)
  res.render('login')
})

app.get('/register', (req, res, next) => {
  res.render('register')
})

app.post('/login', async (req, res) => {
  const { email, password } = req.body
  let user = await User.findOne({ email })

  if (!user) return res.redirect('/register')

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch)
    return res.render('login', { email, message: 'Incorrect Password' })

  const token = jwt.sign({ _id: user._id }, 'dfasdfbasdfahfuweo')
  res.cookie('token', token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  })
  res.redirect('/')
})

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body
  let user = await User.findOne({ email })

  if (user) {
    return res.redirect('/login')
  }
  const hashedPassword = await bcrypt.hash(password, 10)
  user = await User.create({ name, email, password: hashedPassword })

  const token = jwt.sign({ _id: user._id }, 'dfasdfbasdfahfuweo')
  res.cookie('token', token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  })
  res.redirect('/')
})

app.post('/login', async (req, res) => {
  const { name, email } = req.body
  let user = await User.findOne({ email })

  if (!user) {
    return res.redirect('/register')
  }
  user = await User.create({ name, email })
  const token = jwt.sign({ _id: user._id }, 'dfasdfbasdfahfuweo')
  res.cookie('token', token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  })
  res.redirect('/')
})

app.get('/logout', (req, res) => {
  res.cookie('token', null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  })
  res.redirect('/')
})

// app.get('/add', async (req, res) => {
//   await Message.create({ name: 'Vigi', email: 'abc@gmail.com' })
//   res.send('Nice')
// })

app.listen(5000, () => {
  console.log('Server is Working')
})

import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import { toyService } from './services/toy.service.js'
import { userService } from './services/user.service.js'
import { loggerService } from './services/logger.service.js'
import PDFDocument from 'pdfkit'

const app = express()

app.use(express.static('public'))
app.use(express.json())
app.use(cookieParser())

const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
    ],
    credentials: true,
}
app.use(cors(corsOptions))


// Retrieve toys with filtering, sorting, and pagination
app.get('/api/toy', (req, res) => {
    const { sortBy, sortDir = 1, pageIdx = 0, pageSize = 5, txt, minSeverity, labels } = req.query

    toyService.query({ sortBy, sortDir, pageIdx, pageSize, txt, minSeverity, labels })
        .then(toys => res.json(toys))
        .catch(err => {
            loggerService.error('Failed to query toys', err)
            res.status(500).send('Cannot get toys')
        })
})

// Retrieve toy by ID with limited view tracking
app.get('/api/toy/:toyId', (req, res) => {
    const { toyId } = req.params
    let visitedtoys = req.cookies.visitedtoys || []

    if (!visitedtoys.includes(toyId)) {
        visitedtoys.push(toyId)
        if (visitedtoys.length > 3) {
            loggerService.warn(`User visited more than 3 toys: ${visitedtoys}`)
            return res.status(401).send('Wait for a bit')
        }
        res.cookie('visitedtoys', visitedtoys, { maxAge: 7000 })
    }

    toyService.getById(toyId)
        .then(toy => res.json(toy))
        .catch(err => {
            loggerService.error(`toy not found with ID: ${toyId}`, err)
            res.status(404).send('toy not found')
        })
})

// Create or update a toy
app.post('/api/toy', (req, res) => {
    const toy = req.body
    toyService.save(toy)
        .then(savedtoy => res.json(savedtoy))
        .catch(err => {
            loggerService.error('Failed to save toy', err)
            res.status(500).send('Cannot save toy')
        })
})

app.put('/api/toy/:toyId', (req, res) => {
    const { toyId } = req.params
    const toy = req.body
    toyService.save({ ...toy, _id: toyId })
        .then(updatedtoy => res.json(updatedtoy))
        .catch(err => {
            loggerService.error('Failed to update toy', err)
            res.status(500).send('Cannot update toy')
        })
})

// Delete a toy
app.delete('/api/toy/:toyId', (req, res) => {
    const user = userService.validateToken(req.cookies.loginToken)
    if (!user) return res.status(401).send('Not logged in')

    const { toyId } = req.params
    toyService.getById(toyId)
        .then(toy => {
            if (toy.creator._id !== user._id) return res.status(403).send('Unauthorized')
            return toyService.remove(toyId)
        })
        .then(() => res.send('toy removed'))
        .catch(err => res.status(500).send('Cannot remove toy'))
})

// Auth API: Login, Signup, Logout
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body
    userService.checkLogin({ username, password })
        .then(user => {
            const token = userService.getLoginToken(user)
            res.cookie('loginToken', token, { httpOnly: true })
            res.json({ _id: user._id, fullname: user.fullname })
        })
        .catch(() => res.status(401).send('Invalid username or password'))
})

app.post('/api/auth/signup', (req, res) => {
    const credentials = req.body
    userService.save(credentials)
        .then(user => {
            if (user) {
                const loginToken = userService.getLoginToken(user)
                res.cookie('loginToken', loginToken)
                res.send(user)
            } else {
                res.status(400).send('Cannot signup')
            }
        })
})


app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('loginToken')
    res.send('Logged out')
})

// Download toy report as PDF
app.get('/api/toy/download', (req, res) => {
    const doc = new PDFDocument()
    let filename = 'toys_report.pdf'

    res.setHeader('Content-disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-type', 'application/pdf')

    doc.fontSize(18).text('toys Report', { align: 'center' })
    toyService.query().then(toys => {
        toys.forEach(toy => {
            doc.fontSize(12).text(`Title: ${toy.title}`)
            doc.text(`Description: ${toy.description}`)
            doc.text(`Severity: ${toy.severity}`)
            doc.text(`Created At: ${new Date(toy.createdAt).toLocaleString()}`)
            doc.moveDown()
        })
        doc.pipe(res)
        doc.end()
    })
        .catch(err => {
            loggerService.error('Failed to generate PDF report', err)
            res.status(500).send('Failed to generate PDF')
        })
})

const port = 3030
app.get('/', (req, res) => res.send('Hello there'))
app.listen(port, () =>
    console.log(`Server listening on http://127.0.0.1:${port}/`)
)

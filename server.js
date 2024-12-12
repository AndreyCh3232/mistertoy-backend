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
app.get('/api/toy', async (req, res) => {
    try {
        const { sortBy, sortDir = 1, pageIdx = 0, pageSize = 5, txt, minSeverity, labels } = req.query
        const toys = await toyService.query({ sortBy, sortDir, pageIdx, pageSize, txt, minSeverity, labels })
        res.json(toys)
    } catch (err) {
        loggerService.error('Failed to query toys', err)
        res.status(500).send('Cannot get toys')
    }
})

// Retrieve toy by ID with limited view tracking
app.get('/api/toy/:toyId', async (req, res) => {
    try {
        const { toyId } = req.params
        let visitedToys = req.cookies.visitedToys || []

        if (!visitedToys.includes(toyId)) {
            visitedToys.push(toyId)
            if (visitedToys.length > 3) {
                loggerService.warn(`User visited more than 3 toys: ${visitedToys}`)
                return res.status(401).send('Wait for a bit')
            }
            res.cookie('visitedToys', visitedToys, { maxAge: 7000 })
        }

        const toy = await toyService.getById(toyId)
        res.json(toy)
    } catch (err) {
        loggerService.error(`Toy not found with ID: ${toyId}`, err)
        res.status(404).send('Toy not found')
    }
})

// Create or update a toy
app.post('/api/toy', async (req, res) => {
    try {
        const toy = req.body
        const savedToy = await toyService.save(toy)
        res.json(savedToy)
    } catch (err) {
        loggerService.error('Failed to save toy', err)
        res.status(500).send('Cannot save toy')
    }
})

app.put('/api/toy/:toyId', async (req, res) => {
    try {
        const { toyId } = req.params
        const toy = req.body
        const updatedToy = await toyService.save({ ...toy, _id: toyId })
        res.json(updatedToy)
    } catch (err) {
        loggerService.error('Failed to update toy', err)
        res.status(500).send('Cannot update toy')
    }
})

// Delete a toy
app.delete('/api/toy/:toyId', async (req, res) => {
    try {
        const user = userService.validateToken(req.cookies.loginToken)
        if (!user) return res.status(401).send('Not logged in')

        const { toyId } = req.params
        const toy = await toyService.getById(toyId)

        if (toy.creator._id !== user._id) return res.status(403).send('Unauthorized')
        await toyService.remove(toyId)
        res.send('Toy removed')
    } catch (err) {
        res.status(500).send('Cannot remove toy')
    }
})

// Auth API: Login, Signup, Logout
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body
        const user = await userService.checkLogin({ username, password })
        const token = userService.getLoginToken(user)
        res.cookie('loginToken', token, { httpOnly: true })
        res.json({ _id: user._id, fullname: user.fullname })
    } catch {
        res.status(401).send('Invalid username or password')
    }
})

app.post('/api/auth/signup', async (req, res) => {
    try {
        const credentials = req.body
        const user = await userService.save(credentials)

        if (user) {
            const loginToken = userService.getLoginToken(user)
            res.cookie('loginToken', loginToken)
            res.send(user)
        } else {
            res.status(400).send('Cannot signup')
        }
    } catch (err) {
        loggerService.error('Signup error', err)
        res.status(500).send('Cannot signup')
    }
})


app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('loginToken')
    res.send('Logged out')
})

// Download toy report as PDF
app.get('/api/toy/download', async (req, res) => {
    try {
        const doc = new PDFDocument()
        const filename = 'toys_report.pdf'

        res.setHeader('Content-disposition', `attachment; filename="${filename}"`)
        res.setHeader('Content-type', 'application/pdf')

        doc.fontSize(18).text('Toys Report', { align: 'center' })

        const toys = await toyService.query()
        toys.forEach((toy) => {
            doc.fontSize(12).text(`Title: ${toy.title}`)
            doc.text(`Description: ${toy.description}`)
            doc.text(`Severity: ${toy.severity}`)
            doc.text(`Created At: ${new Date(toy.createdAt).toLocaleString()}`)
            doc.moveDown()
        })

        doc.pipe(res)
        doc.end()
    } catch (err) {
        loggerService.error('Failed to generate PDF report', err)
        res.status(500).send('Failed to generate PDF')
    }
})

const port = 3030
app.get('/', (req, res) => res.send('Hello there'))
app.listen(port, () =>
    console.log(`Server listening on http://127.0.0.1:${port}/`)
)

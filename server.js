import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

import { loggerService } from './services/logger.service.js'


const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const app = express()

// Express Config
app.use(cookieParser())
app.use(express.json())
app.use(express.static('public'))


if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'public')))
    console.log('__dirname: ', __dirname)
} else {

    const corsOptions = {
        origin: [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
        ],
        credentials: true,
    }
    app.use(cors(corsOptions))
}
import { authRoutes } from './api/auth/auth.routes.js'
import { reviewRoutes } from './api/review/review.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { toyRoutes } from './api/toy/toy.routes.js'
import { setupAsyncLocalStorage } from './middlewares/setupAls.middleware.js'

app.all('*', setupAsyncLocalStorage)

// routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/toy', toyRoutes)
app.use('/api/review', reviewRoutes)

// app.get('/**', (req, res) => {
//     res.sendFile(path.resolve('public/index.html'))
// })

const PORT = process.env.PORT || 3030
app.listen(PORT, () => loggerService.info(`Server listening on port http://127.0.0.1:${PORT}/`))


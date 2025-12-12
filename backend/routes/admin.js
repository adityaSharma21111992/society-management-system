// routes/admin.js
import express from 'express'
import { adminLogin } from '../controllers/adminController.js'

const router = express.Router()

// Admin-only login (env password)
router.post('/login', adminLogin)

export default router

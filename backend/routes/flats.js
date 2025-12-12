import express from 'express';
import { getAllFlats, getFlatById, addFlat, updateFlat, deleteFlat } from '../controllers/flatsController.js';


const router = express.Router();


router.get('/', getAllFlats);
router.get('/:id', getFlatById);
router.post('/', addFlat);
router.put('/:id', updateFlat);
router.delete('/:id', deleteFlat);


export default router;
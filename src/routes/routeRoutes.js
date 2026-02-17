const express = require('express');
const router = express.Router();
const {
  getRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
} = require('../controllers/routeController');
const protect = require('../middlewares/auth');

// All route endpoints require authentication
router.use(protect);

router.route('/').get(getRoutes).post(createRoute);
router.route('/:id').get(getRoute).put(updateRoute).delete(deleteRoute);

module.exports = router;

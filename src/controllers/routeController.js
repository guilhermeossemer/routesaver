const Route = require('../models/Route');

/**
 * GET /api/routes
 * List all routes for the authenticated user
 */
exports.getRoutes = async (req, res) => {
  try {
    const routes = await Route.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: routes.length, data: routes });
  } catch (error) {
    console.error('getRoutes error:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar rotas' });
  }
};

/**
 * GET /api/routes/:id
 * Get a single route
 */
exports.getRoute = async (req, res) => {
  try {
    const route = await Route.findOne({ _id: req.params.id, user: req.user._id });

    if (!route) {
      return res.status(404).json({ success: false, message: 'Rota não encontrada' });
    }

    res.json({ success: true, data: route });
  } catch (error) {
    console.error('getRoute error:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar rota' });
  }
};

/**
 * POST /api/routes
 * Create a new route
 */
exports.createRoute = async (req, res) => {
  try {
    const { name, coordinates } = req.body;

    if (!name || !coordinates || coordinates.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Nome e pelo menos 2 coordenadas são obrigatórios',
      });
    }

    const route = await Route.create({
      name,
      coordinates,
      user: req.user._id,
    });

    res.status(201).json({ success: true, data: route });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    console.error('createRoute error:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar rota' });
  }
};

/**
 * PUT /api/routes/:id
 * Update a route
 */
exports.updateRoute = async (req, res) => {
  try {
    const { name, coordinates } = req.body;

    const route = await Route.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, coordinates },
      { new: true, runValidators: true }
    );

    if (!route) {
      return res.status(404).json({ success: false, message: 'Rota não encontrada' });
    }

    res.json({ success: true, data: route });
  } catch (error) {
    console.error('updateRoute error:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar rota' });
  }
};

/**
 * DELETE /api/routes/:id
 * Delete a route
 */
exports.deleteRoute = async (req, res) => {
  try {
    const route = await Route.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!route) {
      return res.status(404).json({ success: false, message: 'Rota não encontrada' });
    }

    res.json({ success: true, message: 'Rota excluída com sucesso' });
  } catch (error) {
    console.error('deleteRoute error:', error);
    res.status(500).json({ success: false, message: 'Erro ao excluir rota' });
  }
};

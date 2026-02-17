const mongoose = require('mongoose');

const coordinateSchema = new mongoose.Schema(
  {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const routeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome da rota é obrigatório'],
      trim: true,
      maxlength: [200, 'Nome deve ter no máximo 200 caracteres'],
    },
    coordinates: {
      type: [coordinateSchema],
      validate: {
        validator: (v) => v.length >= 2,
        message: 'A rota deve ter pelo menos 2 pontos',
      },
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Route', routeSchema);

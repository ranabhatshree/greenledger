const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  console.error('Error stack:', err.stack);

  // Log the detailed structure to help debug
  console.log('Error object:', JSON.stringify(err, null, 2));

  if (err.name === 'ValidationError') {
    // Joi validation errors
    if (err.details && Array.isArray(err.details)) {
      return res.status(400).json({
        status: 'error',
        message: err.message,
        errors: err.details.map(e => e.message)
      });
    }
    
    // Mongoose validation errors
    if (err.errors && typeof err.errors === 'object') {
      return res.status(400).json({
        status: 'error',
        message: err.message,
        errors: Object.values(err.errors).map(e => e.message)
      });
    }
    
    // Handle other validation errors
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }

  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(409).json({
      status: 'error',
      message: 'Duplicate key error'
    });
  }

  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
};

module.exports = errorHandler; 
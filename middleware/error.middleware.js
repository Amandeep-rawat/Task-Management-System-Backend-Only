export const errorHandler = (err, req, res, next) => {
  console.error(err.stack)

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((error) => error.message)
    return res.status(400).json({ message: "Validation error", errors })
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      message: "Duplicate key error",
      field: Object.keys(err.keyPattern)[0],
    })
  }

  // Default error
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  })
}


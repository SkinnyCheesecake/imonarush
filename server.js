const express = require('express'); //IMPORTS THE EXPRESS.JS FRAMEWORK FROM THE NODE-MODULES FOLDER
//the same thing happens with all the lines of code below
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv'),config();
const morgan = require('morgan');
const winston = require('winston');

const app = express(); // creates the Express application instance so we can configure middleware and routes
app.use(cors()); // enables Cross-Origin Resource Sharing, allowing frontend apps on other domains/ports to request this API
app.use(express.json()); // parses incoming request bodies as JSON and makes them available on req.body
app.use(express.static('public')); // serves static files from the public folder (e.g. HTML, CSS, JS, images)



mongoose
  .connect( // starts the MongoDB connection using the environment URI or a local fallback
    process.env.MONGODB_URI || "mongodb://localhost:27017/student-management-app",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));


const logger = winston.createLogger({
    // Minimum log level to record (levels: error, warn, info, http, verbose, debug, silly)
    level: 'info',
    
    // Log format configuration
    format: winston.format.combine(
        // Add timestamp to each log entry (e.g., "2024-01-15T10:30:45.123Z")
        winston.format.timestamp(),
        // Format logs as JSON objects for structured logging
        winston.format.json()
    ),
    
    // Where to send the logs (output destinations)
    transports: [
        // Error log transport: writes only error-level messages to a file
        new winston.transports.File({ 
            filename: 'error.log', 
            level: 'error'  // Only 'error' level messages go here
        }),
        
        // Combined log transport: writes all log levels to a file
        new winston.transports.File({ 
            filename: 'combined.log' 
        }),
        
        // Console transport: displays logs in terminal with colorized, simple format
        new winston.transports.Console({ 
            format: winston.format.combine(
                // Add colors to log levels (e.g., red for error, yellow for warn)
                winston.format.colorize(),
                // Use simple format: level: message (e.g., "info: Server started")
                winston.format.simple()
            ),
        }),
    ],
});

app.use(
    morgan( ":method :url :status :responde-time ms - :res[content-length]" )
);

const apiLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
            method: req.method,
            status: req.statusCode,
            path: req.path,
            duration: `${duration}ms`,
            params: req.params,
            query: req.query,
            method: req.method !== "GET" ? req.body : undefined,
        });
    });
    next();
};

app.use(apiLogger);

app.use((err, req, res, next) => {
    logger.error({
        message: err.message,
        stack: req.stack,
        method: req.method,
        path: req.path,
        params: req.params,
        query: req.query,
        body: req.method !== "GET" ? req.body : undefined,
    });

    res.status(500).json({ message: 'Internal server error'});

});


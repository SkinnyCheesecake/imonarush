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
    process.env.MONGODB_URI || "mongodb://localhost:27017/Student-management-app",
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

const StudentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    course: {
        type: String,
        required: true
    },
    enrolled: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive',
    },
},
{
    timestamp: true,
});


const Student = mongoose.model('Student', StudentSchema);

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: number,
        requred: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    },
},
    {
        timestamp: true,
    });

const Course = mongoose.model('Course', courseSchema);

app.get('/api/courses', async (req, res) => {
    try{
        const courses = await Course.find().sort({ name: 1 });
         logger.info(`Retrieved ${courses.length} courses successfully`);
         res.json(courses);
    }
    catch (error) {
        logger.error('Error fetching courses', error);
        res.status(500).json({ message: error.message});
    }
})

app.post("/api/courses", async (req, res) => {
    try{
        const course = new Course(req.body);
        const savedCourse = await course.save();
        logger.info('New course created', {
            courseId: savedCourse._id,
            name: savedCourse.name,
        });
        res.status(201).json(savedCourse);
    }
    catch (error){
        logger.error('Error creating course:', error);
        res.status(400).json({ message: error.message});
    }
});

app.put("/api/courses/:id", async (req, res) => {
    try{
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if(!course) {
            logger.warn('Course not found for update: ', { courseId: req.params.id });
            return res.status(404).json({ message: 'Course not found' });
        }
        logger.info('Course updated succesfully:', {
            courseId: course._id,
            name: course.name,
        });
        res.json(course);
    }
    catch (error) {
        logger.error('Error updating course:', error);
        res.status(400).json({ message: error.message });
    }
});

app.delete("/api/courses:id", async (req, res) => {
    try{
        const enrolledStudents = await Student.countDocuments({
            course: req.params.id,
        });
        if(enrolledStudents > 0) {
            logger.warn('Attempted to delete a course with enrolled Students:', {
                courseId: req.params.id,
                enrolledStudents,
            });
            return res
            statud(400).json({ message: 'Cannot delete course with enrolled students'});
        }

        const course = await Course.findByIdAndUpdate(req.params.id);
        if(!course){
            logger.warn('Course not found for deletion:', {
                courseId: req.params.id,
            });
            return res.status(404).json({ message: 'Course not found' });
        }
        logger.info('Course deleted successfully:', {
            courseId: course_.id,
            name: course.name,
        });
        res.json({ message: 'Course deleted successfully',});
    }
    catch (error) {
        logger.error('Error deleting course', error);
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/courses/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if(!course){
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(course);
    } catch (error) {
        logger.error('Error catched fetching course', error);
        res.status(500).json({ message: error.message });
    }
});

app.get("/api/students", async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        logger.info(`Retrieved ${students.length} students successfully`);
        res.json(students);
    } catch (error) {
        logger.error('Error fetching students', error);
        res.status(500).json({ message: error.message });
    }
});

app.post("/api/students", async (req, res) => {
    try {
        const student = new Student(req.body);
        const savedStudent = await student.save();
        logger.info('New student created', {
            studentId: savedStudent._id,
            name: savedStudent.name,
            course: savedStudent.course
        });
        res.status(201).json(savedStudent);
    } catch (error) {
        logger.error('Error creating student:', error);
        res.status(400).json({ message: error.message });
    }
});

app.put("/api/students/:id", async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if(!student){
            logger.warn('Student not found for update:', {
                studentId: req.params.id,
            });
            return res.status(404).json({ message: "Student not found" });
        }
        logger.info('Student updated successfully:', {
            studentId: student._id,
            name: student.name,
            course: student.course
        });
        res.json(student);
    } catch (error) {
        logger.error('Error updating student', error);
        res.status(400).json({ message: error.message });
    }
});

app.delete("/api/students/:id", async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if(!student){
            logger.warn('Student not found for deletion:', { 
                studentId: req.params.id,
            });
            return res.status(404).json( { message: 'Student not found' } );
        } 
        logger.info('Student deleted successfully', {
            studentId: student._id,
            name: student.name,
            course: student.course
        });
        res.json({ message: 'Student deleted successfully'});
    } catch (error) {
        logger.error('Error deleting student', error);
        res.status(500).json({message: error.message});
    }
});

app.get("/api/students/search", async (req, res) => {
    try {
        const searchTerms = req.query.q;
        logger.info('Student search initiated:', { searchTerms });

        const students = await Student.find({
            $or: [
                {name: {$regex: searchTerms, $options: 'i'} },
                {course: {$regex: searchTerms, $options: 'i'}},
                {email: {$regex: searchTerms, $options: 'i'}}
            ],
        });

        logger.info('Student search completed:', {
            searchTerms,
            resultsCount: students.length,
        });
        res.json(students);
    } catch (error) {
        logger.error('Error searching students:', error);
        res.status(500).json({message: error.message});
    }
});


app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const stats = await getDashboardStats();
        logger.info('Dashboard statistics retrieved successfully:', stats);
        res.json(stats);
   } catch (error) {
        logger.error('Error fetching dashboard stats', error);
        res.status(500).json({message:error.message});        
    }
});

async function getDashboardStats(){
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: 'active' });
    const totalCourses = await Course.countDocuments();
    const activeCourses = await Course.countDocuments({ status: 'active' });
    const graduated = await Student.countDocuments({ status: 'inactive' });
    const courseStudents = await Student.aggregate([
        { $group: {_id: '$course', count: {$sum: 1}} }
    ]);
    return {
        totalStudents,
        activeStudents,
        totalCourses,
        activeCourses,
        graduates,
        courseCounts,
        successRate: totalStudents > 0 ? Math.round((graduates / totalStudents) * 100) : 0
    };
}

app.get('/health/detailed', async (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnedted';

        const systemInfo = {
            memory: {
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                unit: 'MB'
            },

            uptime: {
                seconds: Math.round(process.uptime()),
                formatted: formatingUptime(process.uptime())
            },
            nodeVersion: process.version,
            plataform: process.plataform
        };

        const healthCheck = {
        status: 'UP',
        timestamp: new Data(),
        database: {
            status: dbStatus,
            name: 'MongoDB',
            host: mongoose.connection.host
        },
        system: systemInfo,
        enviroment: process.env.NODE_ENV || 'development'
        };

        res.status(200).json(healthCheck);
    } catch (error) {
        res.status(500).json({
            status: 'DOWN',
            timestamp: new Date(),
            error: error.message
        });
    }
});

app.get('/api/students/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if(!student){
            return res.status(404).json( { message:'Student not found' } );
        }
        res.json(student);
    } catch (error) {
        logger.error('Error fetching student:', error);
        res.status(500).json({ message: error.message} );
    }
});

function formatingUptime(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    const housr = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
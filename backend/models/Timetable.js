const mongoose = require('mongoose');

const PeriodSchema = new mongoose.Schema({
    time: {
        type: String,
        required: [true, 'Time slot is required'],
        trim: true
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true
    },
    faculty: {
        type: String,
        required: [true, 'Faculty is required'],
        trim: true
    },
    room: {
        type: String,
        required: [true, 'Room is required'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Period type is required'],
        enum: ['Lecture', 'Lab', 'Sports', 'Library', 'Counselling', 'Leisure', 'Break', 'Project', 'Seminar', 'Tutorial']
    },
    section: {
        type: String,
        default: 'A',
        trim: true,
        uppercase: true
    }
});

const DaySchema = new mongoose.Schema({
    day: {
        type: String,
        required: [true, 'Day is required'],
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    periods: [PeriodSchema],
    totalPeriods: {
        type: Number,
        default: 0
    }
});

const TimetableSchema = new mongoose.Schema({
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true,
        uppercase: true
    },
    semester: {
        type: Number,
        required: [true, 'Semester is required'],
        min: 1,
        max: 8
    },
    section: {
        type: String,
        default: 'A',
        trim: true,
        uppercase: true
    },
    academicYear: {
        type: String,
        default: () => {
            const year = new Date().getFullYear();
            return `${year}-${year + 1}`;
        }
    },
    timetable: [DaySchema],
    generationMethod: {
        type: String,
        required: [true, 'Generation method is required'],
        enum: ['Genetic Algorithm', 'Simple', 'Manual', 'Sample', 'Optimized'],
        default: 'Genetic Algorithm'
    },
    fitnessScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 1000
    },
    conflicts: {
        type: Number,
        default: 0,
        min: 0
    },
    generatedBy: {
        type: String,
        default: 'System'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update updatedAt on save
TimetableSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    // Calculate total periods for each day
    if (this.timetable) {
        this.timetable.forEach(day => {
            day.totalPeriods = day.periods ? day.periods.length : 0;
        });
    }
    next();
});

// Indexes for faster queries
TimetableSchema.index({ department: 1, semester: 1, section: 1 });
TimetableSchema.index({ generationMethod: 1 });
TimetableSchema.index({ fitnessScore: -1 });
TimetableSchema.index({ generatedAt: -1 });

module.exports = mongoose.model('Timetable', TimetableSchema);
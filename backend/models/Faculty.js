const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Faculty name is required'],
        trim: true
    },
    employeeId: {
        type: String,
        required: [true, 'Employee ID is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true,
        uppercase: true
    },
    designation: {
        type: String,
        default: 'Assistant Professor',
        enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lab Instructor', 'Visiting Faculty', 'Guest Faculty', 'Sports Coach', 'Librarian', 'Counselor', 'Staff']
    },
    subjects: [{
        type: String,
        required: [true, 'At least one subject is required'],
        trim: true
    }],
    maxPeriodsPerWeek: {
        type: Number,
        default: 18,
        min: [5, 'Minimum 5 periods per week'],
        max: [25, 'Maximum 25 periods per week']
    },
    availability: {
        Monday: [String],
        Tuesday: [String],
        Wednesday: [String],
        Thursday: [String],
        Friday: [String],
        Saturday: [String]
    },
    isAvailableOnSaturday: {
        type: Boolean,
        default: false
    },
    teachesSemesters: [{
        type: Number,
        min: 1,
        max: 8
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update updatedAt on save
FacultySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Update updatedAt on update
FacultySchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

// Index for faster queries
FacultySchema.index({ department: 1, isActive: 1 });
FacultySchema.index({ employeeId: 1 }, { unique: true });

module.exports = mongoose.model('Faculty', FacultySchema);
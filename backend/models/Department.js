const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Subject name is required'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Subject type is required'],
        enum: ['Theory', 'Lab', 'Project', 'Seminar', 'Workshop']
    },
    hoursPerWeek: {
        type: Number,
        required: [true, 'Hours per week is required'],
        min: [1, 'Minimum 1 hour per week'],
        max: [6, 'Maximum 6 hours per week']
    },
    credits: {
        type: Number,
        default: 3
    }
});

const SemesterSchema = new mongoose.Schema({
    semester: {
        type: Number,
        required: [true, 'Semester number is required'],
        min: [1, 'Minimum semester is 1'],
        max: [8, 'Maximum semester is 8']
    },
    subjects: [SubjectSchema],
    sportsPeriods: {
        type: Number,
        default: 2,
        min: 0,
        max: 3
    },
    libraryPeriods: {
        type: Number,
        default: 1,
        min: 0,
        max: 2
    },
    counsellingPeriods: {
        type: Number,
        default: 1,
        min: 0,
        max: 2
    },
    totalPeriodsPerWeek: {
        type: Number,
        default: 30,
        min: 20,
        max: 40
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const DepartmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Department name is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    fullName: {
        type: String,
        trim: true
    },
    intake: {
        type: Number,
        required: [true, 'Intake is required'],
        min: [30, 'Minimum intake is 30'],
        max: [300, 'Maximum intake is 300']
    },
    labs: {
        type: Number,
        default: 3,
        min: 1,
        max: 10
    },
    labNames: [{
        type: String,
        trim: true
    }],
    sections: [{
        type: String,
        trim: true,
        uppercase: true
    }],
    semesters: [SemesterSchema],
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
DepartmentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Update updatedAt on update
DepartmentSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

module.exports = mongoose.model('Department', DepartmentSchema);
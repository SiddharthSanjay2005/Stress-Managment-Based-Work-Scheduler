const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const Department = require('../models/Department');
const Faculty = require('../models/Faculty');
const GeneticScheduler = require('../genetic-algorithm/scheduler');

// ==================== HEALTH CHECK ====================
router.get('/health', async (req, res) => {
    try {
        // Test database connection
        await Department.findOne();
        
        res.json({ 
            status: 'healthy', 
            service: 'Timetable Generator API - MVGR College',
            timestamp: new Date().toISOString(),
            database: 'Connected',
            version: '2.0.0'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'unhealthy', 
            service: 'Timetable Generator API',
            error: error.message,
            database: 'Connection failed'
        });
    }
});

// ==================== GET ALL TIMETABLES ====================
router.get('/', async (req, res) => {
    try {
        const { limit = 50, page = 1 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const timetables = await Timetable.find()
            .sort({ generatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
            
        const total = await Timetable.countDocuments();
        
        res.json({
            success: true,
            count: timetables.length,
            total: total,
            pages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            data: timetables
        });
    } catch (error) {
        console.error('Error fetching timetables:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching timetables',
            error: error.message
        });
    }
});

// ==================== GET TIMETABLE BY DEPT & SEM ====================
router.get('/:department/:semester', async (req, res) => {
    try {
        const { department, semester } = req.params;
        const { section = 'A' } = req.query;
        
        const timetable = await Timetable.findOne({ 
            department: department.toUpperCase(), 
            semester: parseInt(semester),
            section: section.toUpperCase()
        }).sort({ generatedAt: -1 });
        
        if (!timetable) {
            return res.status(404).json({
                success: false,
                message: `No timetable found for ${department.toUpperCase()} Semester ${semester} Section ${section.toUpperCase()}`
            });
        }
        
        res.json({
            success: true,
            data: timetable
        });
    } catch (error) {
        console.error('Error fetching timetable:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching timetable',
            error: error.message
        });
    }
});

// ==================== GENERATE WITH AI ====================
router.post('/generate-ai', async (req, res) => {
    try {
        const { department, semester, includeSaturday = false, section = 'A' } = req.body;
        
        if (!department || !semester) {
            return res.status(400).json({
                success: false,
                message: 'Department and semester are required'
            });
        }
        
        // Check if semester is even (2, 4, 6, 8)
        const sem = parseInt(semester);
        if (sem % 2 !== 0) {
            return res.status(400).json({
                success: false,
                message: 'Only even semesters (2, 4, 6, 8) are supported for AI generation'
            });
        }
        
        console.log(`🚀 Starting AI Generation for ${department.toUpperCase()} Semester ${semester} Section ${section}`);
        
        // Get faculty for this department
        let facultyList = await Faculty.find({
            $or: [
                { department: department.toUpperCase() },
                { department: 'ALL' },
                { department: 'All' }
            ],
            isActive: true
        });
        
        if (facultyList.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No faculty found for ${department}. Please initialize college data first.`
            });
        }
        
        // Check if department exists in database
        const deptExists = await Department.findOne({ name: department.toUpperCase() });
        if (!deptExists) {
            return res.status(404).json({
                success: false,
                message: `Department ${department} not found. Please initialize college data first.`
            });
        }
        
        // Initialize Genetic Algorithm
        const scheduler = new GeneticScheduler(
            department.toUpperCase(),
            sem,
            facultyList,
            { 
                includeSaturday: Boolean(includeSaturday),
                sportsNotAdjacent: true
            }
        );
        
        // Generate timetable
        const generatedTimetable = await scheduler.evolve();
        
        // Add section to generated timetable
        generatedTimetable.section = section.toUpperCase();
        
        // Check if exists
        const existing = await Timetable.findOne({
            department: department.toUpperCase(),
            semester: sem,
            section: section.toUpperCase()
        });
        
        let savedTimetable;
        
        if (existing) {
            // Update existing
            existing.timetable = generatedTimetable.timetable;
            existing.fitnessScore = generatedTimetable.fitnessScore;
            existing.conflicts = generatedTimetable.conflicts;
            existing.generationMethod = generatedTimetable.generationMethod;
            existing.generatedAt = new Date();
            savedTimetable = await existing.save();
        } else {
            // Create new
            const newTimetable = new Timetable(generatedTimetable);
            savedTimetable = await newTimetable.save();
        }
        
        console.log(`✅Generation Complete! Fitness: ${generatedTimetable.fitnessScore.toFixed(1)}`);
        
        res.status(201).json({
            success: true,
            message: 'Timetable generated successfully using AI',
            data: savedTimetable,
            stats: {
                fitness: generatedTimetable.fitnessScore||0,
                conflicts: generatedTimetable.conflicts || 0,
                generationMethod: 'Genetic Algorithm',
                facultyUsed: facultyList.length,
                subjects: generatedTimetable.stats?.uniqueSubjects || 0
            }
        });
        
    } catch (error) {
        console.error('❌ AI Generation Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating timetable with AI',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ==================== GENERATE SIMPLE TIMETABLE ====================
router.post('/generate-simple', async (req, res) => {
    try {
        const { department, semester, includeSaturday = false, section = 'A' } = req.body;
        
        if (!department || !semester) {
            return res.status(400).json({
                success: false,
                message: 'Department and semester are required'
            });
        }
        
        // Days of the week
        const days = includeSaturday 
            ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        
        // Get faculty
        const facultyList = await Faculty.find({
            $or: [
                { department: department.toUpperCase() },
                { department: 'ALL' },
                { department: 'All' }
            ],
            isActive: true
        }).limit(8);
        
        const facultyNames = facultyList.length > 0 
            ? facultyList.map(f => f.name).slice(0, 8)
            : ['Dr. Faculty 1', 'Dr. Faculty 2', 'Prof. Faculty 3'];
        
        const rooms = ['A-101', 'A-102', 'B-201', 'B-202', 'C-301', 'C-302'];
        const labRooms = ['Lab-1', 'Lab-2', 'Lab-3'];
        
        const timeSlots = ['9:00-10:00', '10:00-11:00', '11:15-12:15', '2:00-3:00', '3:00-4:00'];
        const labSlots = ['9:00-12:00', '12:15-3:15', '2:00-5:00'];
        
        const timetable = [];
        
        days.forEach(day => {
            const periods = [];
            
            // Morning lectures (3 periods)
            for (let i = 0; i < 3; i++) {
                periods.push({
                    time: timeSlots[i],
                    subject: `${department} Subject ${i+1}`,
                    faculty: facultyNames[i % facultyNames.length],
                    room: rooms[i % rooms.length],
                    type: 'Lecture',
                    section: section.toUpperCase()
                });
            }
            
            // Lunch break
            periods.push({
                time: '12:15-1:15',
                subject: 'Lunch Break',
                faculty: '-',
                room: '-',
                type: 'Break',
                section: section.toUpperCase()
            });
            
            // Afternoon schedule
            if (day === 'Monday') {
                // Lab day
                periods.push({
                    time: labSlots[0],
                    subject: `${department} Lab`,
                    faculty: facultyNames[facultyNames.length - 1],
                    room: labRooms[0],
                    type: 'Lab',
                    section: section.toUpperCase()
                });
            } else if (day === 'Tuesday') {
                // Sports
                periods.push({
                    time: '2:00-3:00',
                    subject: 'Sports',
                    faculty: 'Sports Coach',
                    room: 'Ground',
                    type: 'Sports',
                    section: section.toUpperCase()
                });
                periods.push({
                    time: '3:00-4:00',
                    subject: `${department} Subject 4`,
                    faculty: facultyNames[3 % facultyNames.length],
                    room: rooms[3 % rooms.length],
                    type: 'Lecture',
                    section: section.toUpperCase()
                });
            } else if (day === 'Wednesday') {
                // Library
                periods.push({
                    time: '2:00-3:00',
                    subject: 'Library',
                    faculty: 'Librarian',
                    room: 'Library',
                    type: 'Library',
                    section: section.toUpperCase()
                });
                periods.push({
                    time: '3:00-4:00',
                    subject: `${department} Subject 5`,
                    faculty: facultyNames[4 % facultyNames.length],
                    room: rooms[4 % rooms.length],
                    type: 'Lecture',
                    section: section.toUpperCase()
                });
            } else if (day === 'Thursday') {
                // Counselling
                periods.push({
                    time: '2:00-3:00',
                    subject: 'Counselling',
                    faculty: 'Counselor',
                    room: 'Counseling Room',
                    type: 'Counselling',
                    section: section.toUpperCase()
                });
                periods.push({
                    time: '3:00-4:00',
                    subject: `${department} Subject 6`,
                    faculty: facultyNames[5 % facultyNames.length],
                    room: rooms[5 % rooms.length],
                    type: 'Lecture',
                    section: section.toUpperCase()
                });
            } else {
                // Friday/Saturday - regular lectures
                periods.push({
                    time: '2:00-3:00',
                    subject: `${department} Subject 7`,
                    faculty: facultyNames[6 % facultyNames.length],
                    room: rooms[6 % rooms.length],
                    type: 'Lecture',
                    section: section.toUpperCase()
                });
                periods.push({
                    time: '3:00-4:00',
                    subject: `${department} Subject 8`,
                    faculty: facultyNames[7 % facultyNames.length],
                    room: rooms[7 % rooms.length],
                    type: 'Lecture',
                    section: section.toUpperCase()
                });
            }
            
            timetable.push({
                day: day,
                periods: periods,
                totalPeriods: periods.length
            });
        });
        
        // Create timetable object
        const newTimetable = new Timetable({
            department: department.toUpperCase(),
            semester: parseInt(semester),
            section: section.toUpperCase(),
            timetable: timetable,
            generationMethod: 'Simple',
            fitnessScore: 850,
            conflicts: 8,
            generatedBy: 'System'
        });
        
        const savedTimetable = await newTimetable.save();
        
        res.status(201).json({
            success: true,
            message: 'Simple timetable generated',
            data: savedTimetable
        });
        
    } catch (error) {
        console.error('Error generating simple timetable:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating simple timetable',
            error: error.message
        });
    }
});

// ==================== INITIALIZE REAL COLLEGE DATA ====================
router.post('/init-college-data', async (req, res) => {
    try {
        console.log('🔄 Initializing REAL college data...');
        
        // Send immediate response - DON'T wait for background process
        res.json({
            success: true,
            message: 'College data initialization started in background',
            note: 'Check server console for progress. This may take 1-2 minutes.',
            summary: {
                departments: '8 departments',
                faculty: '100+ professors',
                subjects: 'All real subjects',
                labs: 'All department labs'
            }
        });
        
        // Run initialization in background AFTER sending response
        setTimeout(async () => {
            try {
                // Import here to avoid circular dependency issues
                const mongoose = require('mongoose');
                const loadRealCollegeData = require('../scripts/load-real-college-data');
                
                // Run the data loader
                await loadRealCollegeData();
                
                console.log('✅ Background initialization complete');
                
            } catch (error) {
                console.error('❌ Background initialization failed:', error);
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ Error initializing college data:', error);
        res.status(500).json({
            success: false,
            message: 'Error initializing college data',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ==================== GET ALL DEPARTMENTS ====================
router.get('/departments/all', async (req, res) => {
    try {
        const departments = await Department.find().sort({ name: 1 });
        res.json({
            success: true,
            count: departments.length,
            data: departments
        });
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching departments',
            error: error.message
        });
    }
});

// ==================== GET ALL FACULTY ====================
router.get('/faculty/all', async (req, res) => {
    try {
        const faculty = await Faculty.find().sort({ department: 1, name: 1 });
        res.json({
            success: true,
            count: faculty.length,
            data: faculty
        });
    } catch (error) {
        console.error('Error fetching faculty:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching faculty',
            error: error.message
        });
    }
});

// ==================== GET STATISTICS ====================
router.get('/stats/summary', async (req, res) => {
    try {
        const timetableCount = await Timetable.countDocuments();
        const departmentCount = await Department.countDocuments();
        const facultyCount = await Faculty.countDocuments();
        
        // Get recent timetables
        const recentTimetables = await Timetable.find()
            .sort({ generatedAt: -1 })
            .limit(5)
            .select('department semester section generationMethod fitnessScore generatedAt');
        
        // Get faculty distribution
        const facultyByDept = await Faculty.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        
        // Get timetable distribution
        const timetableByDept = await Timetable.aggregate([
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        // Get average fitness score
        const avgFitness = await Timetable.aggregate([
            { 
                $group: { 
                    _id: null, 
                    avgFitness: { $avg: '$fitnessScore' },
                    maxFitness: { $max: '$fitnessScore' },
                    minFitness: { $min: '$fitnessScore' }
                } 
            }
        ]);
        
        res.json({
            success: true,
            data: {
                summary: {
                    timetables: timetableCount,
                    departments: departmentCount,
                    faculty: facultyCount,
                    avgFitness: avgFitness[0]?.avgFitness?.toFixed(2) || 0,
                    maxFitness: avgFitness[0]?.maxFitness || 0,
                    minFitness: avgFitness[0]?.minFitness || 0
                },
                recent: recentTimetables,
                facultyDistribution: facultyByDept,
                timetableDistribution: timetableByDept,
                systemInfo: {
                    version: '2.0.0',
                    college: 'MVGR College of Engineering',
                    lastUpdated: new Date(),
                    supportedSemesters: 'Even Semesters (2, 4, 6)',
                    aiAlgorithm: 'Genetic Algorithm'
                }
            }
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

// ==================== DELETE TIMETABLE ====================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const timetable = await Timetable.findByIdAndDelete(id);
        
        if (!timetable) {
            return res.status(404).json({
                success: false,
                message: 'Timetable not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Timetable deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting timetable:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting timetable',
            error: error.message
        });
    }
});

module.exports = router;
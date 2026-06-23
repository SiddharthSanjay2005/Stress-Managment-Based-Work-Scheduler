const mongoose = require('mongoose');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');

async function simpleInit() {
    console.log('🚀 Simple Data Initialization...');
    
    try {
        await mongoose.connect('mongodb://localhost:27017/timetable_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Create basic departments
        const departments = [
            { name: 'IT', intake: 120, fullName: 'Information Technology' },
            { name: 'CSIT', intake: 120, fullName: 'Computer Science & Information Technology' },
            { name: 'CSE', intake: 180, fullName: 'Computer Science & Engineering' },
            { name: 'ECE', intake: 120, fullName: 'Electronics & Communication Engineering' },
            { name: 'EEE', intake: 60, fullName: 'Electrical & Electronics Engineering' },
            { name: 'CIVIL', intake: 60, fullName: 'Civil Engineering' },
            { name: 'MECHANICAL', intake: 60, fullName: 'Mechanical Engineering' },
            { name: 'CHEMICAL', intake: 60, fullName: 'Chemical Engineering' },
            { name: 'DATA ENGINEERING', intake: 60, fullName: 'Data Engineering' }
        ];
        
        for (const dept of departments) {
            const exists = await Department.findOne({ name: dept.name });
            if (!exists) {
                await Department.create({
                    name: dept.name,
                    fullName: dept.fullName,
                    intake: dept.intake,
                    labs: 3,
                    labNames: [`${dept.name} Lab 1`, `${dept.name} Lab 2`, `${dept.name} Lab 3`],
                    sections: ['A', 'B'],
                    semesters: [
                        {
                            semester: 2,
                            subjects: [
                                { name: `${dept.name} Mathematics`, type: 'Theory', hoursPerWeek: 4 },
                                { name: `${dept.name} Fundamentals`, type: 'Theory', hoursPerWeek: 3 },
                                { name: `${dept.name} Lab 1`, type: 'Lab', hoursPerWeek: 3 }
                            ]
                        },
                        {
                            semester: 4,
                            subjects: [
                                { name: `${dept.name} Core 1`, type: 'Theory', hoursPerWeek: 3 },
                                { name: `${dept.name} Core 2`, type: 'Theory', hoursPerWeek: 3 },
                                { name: `${dept.name} Lab 2`, type: 'Lab', hoursPerWeek: 3 }
                            ]
                        },
                        {
                            semester: 6,
                            subjects: [
                                { name: `${dept.name} Advanced 1`, type: 'Theory', hoursPerWeek: 3 },
                                { name: `${dept.name} Advanced 2`, type: 'Theory', hoursPerWeek: 3 },
                                { name: `${dept.name} Lab 3`, type: 'Lab', hoursPerWeek: 3 }
                            ]
                        }
                    ]
                });
                console.log(`✅ Created department: ${dept.name}`);
            } else {
                console.log(`⚠️ Department ${dept.name} already exists`);
            }
        }
        
        // Create basic faculty
        const basicFaculty = [
            { name: 'Dr. Test Professor 1', department: 'IT', subjects: ['Mathematics', 'Programming'] },
            { name: 'Dr. Test Professor 2', department: 'CSE', subjects: ['Algorithms', 'Data Structures'] },
            { name: 'Prof. Test Professor 3', department: 'ECE', subjects: ['Electronics', 'Circuits'] },
            { name: 'Sports Coach', department: 'ALL', subjects: ['Sports'] },
            { name: 'Librarian', department: 'ALL', subjects: ['Library'] },
            { name: 'Counselor', department: 'ALL', subjects: ['Counselling'] }
        ];
        
        for (const faculty of basicFaculty) {
            const exists = await Faculty.findOne({ name: faculty.name, department: faculty.department });
            if (!exists) {
                await Faculty.create({
                    name: faculty.name,
                    employeeId: `${faculty.department}_${Date.now().toString().slice(-6)}`,
                    department: faculty.department,
                    designation: faculty.name.includes('Dr.') ? 'Professor' : 
                                faculty.name.includes('Prof.') ? 'Associate Professor' : 'Staff',
                    subjects: faculty.subjects,
                    maxPeriodsPerWeek: 18,
                    teachesSemesters: [2, 4, 6]
                });
                console.log(`✅ Created faculty: ${faculty.name}`);
            }
        }
        
        console.log('\n🎉 SIMPLE INITIALIZATION COMPLETE!');
        console.log(`📊 Departments: ${departments.length}`);
        console.log(`👨‍🏫 Faculty: ${basicFaculty.length}`);
        console.log('\n✅ You can now generate timetables!');
        
        await mongoose.connection.close();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    simpleInit();
}

module.exports = simpleInit;
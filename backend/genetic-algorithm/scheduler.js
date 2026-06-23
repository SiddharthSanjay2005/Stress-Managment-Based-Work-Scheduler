const mongoose = require('mongoose');
const Faculty = require('../models/Faculty');

class GeneticScheduler {
    constructor(department, semester, section = 'A', facultyList = [], constraints = {}) {
        this.department = department;
        this.semester = parseInt(semester);
        this.section = section;

        this.facultyList = Array.isArray(facultyList) ? facultyList : [];

        if (this.facultyList.length === 0) {
            console.warn('No faculty list provided. Will query DB for real faculty names.');
        }
        
        // Semester type identification
        this.isSenior = this.semester === 2 || this.semester === 6;
        this.isJunior = this.semester === 4;
        this.isSixthSemester = this.semester === 6;

        this.constraints = {
            startTime: '9:00',
            endTime: '16:00',
            includeSaturday: false,
            maxPeriodsPerDay: 7,
            maxSameSubjectPerDay: 1,
            includeSports: true,
            includeLibrary: true,
            includeCounselling: true,
            noConsecutiveActivityPeriods: true,
            noConsecutiveFacultyClasses: true,
            ...constraints
        };
        
        this.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        if (this.constraints.includeSaturday) {
            this.days.push('Saturday');
        }
        
        // Time slots based on semester
        if (this.isSixthSemester) {
            // 6th Semester: 9:15 start, lunch 12:15-1:00
            this.activeTimeSlots = [
                '9:15-10:15', '10:15-11:15', '11:15-12:15', 
                '1:00-2:00', '2:00-3:00', '3:00-4:00'
            ];
            this.lunchSlot = '12:15-1:00';
            this.lunchLabel = 'Lunch Break';
            this.afternoonSlots = ['1:00-2:00', '2:00-3:00', '3:00-4:00'];
            this.morningSlots = ['9:15-10:15', '10:15-11:15', '11:15-12:15'];
        } else if (this.isSenior) {
            // 2nd Semester: 9:00 start, lunch 1:15-2:00
            this.activeTimeSlots = [
                '9:00-10:00', '10:00-11:00', '11:15-12:15', 
                '12:15-1:15', '2:00-3:00', '3:00-4:00'
            ];
            this.lunchSlot = '1:15-2:00';
            this.lunchLabel = 'Lunch Break (Seniors)';
            this.afternoonSlots = ['2:00-3:00', '3:00-4:00'];
            this.morningSlots = ['9:00-10:00', '10:00-11:00', '11:15-12:15', '12:15-1:15'];
        } else {
            // 4th Semester: 9:00 start, lunch 12:00-12:45
            this.activeTimeSlots = [
                '9:00-10:00', '10:00-11:00', '11:00-12:00', 
                '12:45-1:45', '1:45-2:45', '2:45-3:45'
            ];
            this.lunchSlot = '12:00-12:45';
            this.lunchLabel = 'Lunch Break (Juniors)';
            this.afternoonSlots = ['12:45-1:45', '1:45-2:45', '2:45-3:45'];
            this.morningSlots = ['9:00-10:00', '10:00-11:00', '11:00-12:00'];
        }

        // Lab slots based on semester - FIXED for all semesters
        if (this.semester === 2) {
            // Semester 2: 2-hour labs
            this.labSlots = ['9:00-11:00', '11:15-1:15', '2:00-4:00'];
            this.labDuration = 2;
            console.log(`[CONFIG] Semester 2: Lab slots = ${this.labSlots}, Duration = ${this.labDuration}`);
        } else if (this.semester === 4) {
            // Semester 4: 3-hour labs
            this.labSlots = ['9:00-12:00', '12:45-3:45'];
            this.labDuration = 3;
            console.log(`[CONFIG] Semester 4: Lab slots = ${this.labSlots}, Duration = ${this.labDuration}`);
        } else if (this.semester === 6) {
            // Semester 6: 2-hour labs (FIXED)
            this.labSlots = ['9:15-11:15', '11:15-1:15', '2:00-4:00'];
            this.labDuration = 2;
            console.log(`[CONFIG] Semester 6: Lab slots = ${this.labSlots}, Duration = ${this.labDuration}`);
        } else {
            // Default fallback
            this.labSlots = ['9:00-12:00', '12:45-3:45'];
            this.labDuration = 3;
        }

        // REMOVED the problematic code that was overriding lab slots for all seniors
        // This was causing the issue with labs not appearing

        this.classrooms = ['A-101', 'A-102', 'A-103', 'B-201', 'B-202', 'C-301', 'D-401', 'D-402'];
        this.labRooms = ['Lab-1', 'Lab-2', 'Lab-3', 'Lab-4', 'Lab-5'];
        
        this.activities = ['Sports', 'Library', 'Counselling'];
        
        this.populationSize = 50;
        this.generations = 100;
        this.mutationRate = 0.1;
        this.elitismCount = 10;

        this.facultyAssignmentCount = new Map();
        this.facultyList.forEach(faculty => {
            this.facultyAssignmentCount.set(faculty.name, 0);
        });

        this.subjects = [];
        this.labs = [];
    }

    isTimeOverlapping(slotA, slotB) {
        const [aStart, aEnd] = slotA.split('-').map(t => this.timeToMinutes(t));
        const [bStart, bEnd] = slotB.split('-').map(t => this.timeToMinutes(t));
        // Proper overlap: true if intervals intersect at all
        return aStart < bEnd && aEnd > bStart;
    }

    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + (minutes || 0);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Helper function to check if a slot overlaps with lab
    isSlotOverlappingWithLab(slot, labSlot) {
        if (!labSlot) return false;
        return this.isTimeOverlapping(slot, labSlot);
    }

    getRealCollegeData() {
        const theory = [];
        const labs = [];
        
        const realData = {
            IT: {
                2: {
                    theory: [
                        'Chemistry (Chem)',
                        'Discrete Mathematical Structures (DMS)',
                        'Probability & Statistics (P&S)',
                        'Procedural Programming (PP)',
                        'Constitutional Values (CV)',
                        'Computer Aided Engineering Drawing (CAED)'
                    ],
                    labs: [
                        'Procedural Programming Lab (PP Lab)',
                        'Chemistry Lab (Chem Lab)',
                        'Electrical & Electronics Engineering Lab (EEE Lab)'
                    ]
                },
                4: {
                    theory: [
                        'Python Programming (Python)',
                        'Design & Analysis of Algorithms (DAA)',
                        'Computer Architecture (CA)',
                        'Database Management Systems (DBMS)',
                        'Product Life Cycle Management (PLM)',
                        'Quality Management (QM)',
                        'Signal & Image Processing (SIP)',
                        'Internet of Things (IoT)'
                    ],
                    labs: [
                        'Python Programming Lab',
                        'Database Management Systems Lab',
                        'Financial Accounting Lab (FA Lab)',
                        'Digital Logic Design Lab (DLD Lab)',
                        'Coding & Training'
                    ]
                },
                6: {
                    theory: [
                        'Web Technologies (WT)',
                        'OOAD and Design Patterns (OOAD)',
                        'Microprocessors & Interfacing (MPI)',
                        'Business Analysis (BA)',
                        'Environmental Studies (ES)',
                        'Statistical & Predictive Analytics (SPA)',
                        'Machine Learning (ML)',
                        'Data Analytics & Tools (DAT)',
                        'Data Warehousing & Mining (DW&M)'
                    ],
                    labs: [
                        'Web Technologies Lab',
                        'Business Analytics Lab'
                    ]
                }
            },
            CSIT: {
                2: {
                    theory: [
                        'Chemistry (Chem)',
                        'Discrete Mathematical Structures (DMS)',
                        'Probability & Statistics (P&S)',
                        'Procedural Programming (PP)',
                        'Constitutional Values (CV)',
                        'Computer Aided Engineering Drawing (CAED)'
                    ],
                    labs: [
                        'Procedural Programming Lab (PP Lab)',
                        'Chemistry Lab (Chem Lab)',
                        'Electrical & Electronics Engineering Workshop (EEE Lab)'
                    ]
                },
                4: {
                    theory: [
                        'Python Programming (Python)',
                        'Design & Analysis of Algorithms (DAA)',
                        'Computer Architecture (CA)',
                        'Database Management Systems (DBMS)',
                        'Product Life Cycle Management (PLM)',
                        'Quality Management (QM)',
                        'Signal & Image Processing (SIP)',
                        'Internet of Things (IoT)'
                    ],
                    labs: [
                        'Python Programming Lab',
                        'Database Management Systems Lab',
                        'Financial Accounting Lab (FA Lab)',
                        'Digital Logic Design Lab (DLD Lab)',
                        'Coding & Training'
                    ]
                },
                6: {
                    theory: [
                        'Web Technologies (WT)',
                        'OOAD & Design Patterns (OOAD)',
                        'Microprocessors & Interfacing (MPI)',
                        'Business Analysis (BA)',
                        'Environmental Studies (ES)',
                        'Statistical & Predictive Analytics (SPA)',
                        'Machine Learning (ML)',
                        'Data Analytics & Tools (DAT)',
                        'Data Warehousing & Mining (DW&M)'
                    ],
                    labs: [
                        'Web Technologies Lab',
                        'Business Analytics Lab'
                    ]
                }
            },
            CSE: {
                2: {
                    theory: [
                        'Chemistry (CHEM)',
                        'Discrete Mathematical Structures (DMS)',
                        'Probability and Statistics (P&S)',
                        'Procedural Programming (PP)',
                        'Ethics and Human Values (EHV)',
                        'Constitutional Values (CV)'
                    ],
                    labs: [
                        'Chemistry Lab (CHEM LAB)',
                        'Procedural Programming Lab (PP LAB)',
                        'Computer Aided Engineering Drawing (CAED)'
                    ]
                },
                4: {
                    theory: [
                        'Python Programming (PYP)',
                        'Design and Analysis of Algorithms (DAA)',
                        'Computer Architecture (CA)',
                        'Database Management Systems (DBMS)',
                        'Product Lifecycle Management (PLM)',
                        'Signal & Image Processing (SIP)',
                        'Quality Management (QM)',
                        'Internet of Things (IOT)'
                    ],
                    labs: [
                        'Python Programming Lab (PYP LAB)',
                        'Database Management Systems Lab (DBMS LAB)',
                        'Financial Accounting Lab (FA-LAB)',
                        'Digital Logic Design Lab (DLD LAB)',
                        'Coding & Training'
                    ]
                },
                6: {
                    theory: [
                        'Web Technologies (WT)',
                        'OOAD and Design Patterns (OOAD & DP)',
                        'Microprocessors & Interfacing (MPI)',
                        'Business Analytics (BA)',
                        'Environmental Studies (ES)',
                        'Statistical & Predictive Analytics (SPA)',
                        'Data Analytics & Tools (DAT)',
                        'Data Warehousing & Mining (DWM)',
                        'Block Chain Essentials (BCE)',
                        'Machine Learning (ML)',
                        'Principles of IoT (PIOT)'
                    ],
                    labs: [
                        'Web Technologies Laboratory',
                        'Business Analytics Laboratory'
                    ]
                }
            },
            ECE: {
                2: {
                    theory: [
                        'Physics (PHY)',
                        'Integral Transforms and Complex Variables (ITCV)',
                        'Basic Network Analysis (BNA)',
                        'Procedural Programming (PP)',
                        'Computer Aided Engineering Drawing (CAED)',
                        'Health and Wellness'
                    ],
                    labs: [
                        'Physics Laboratory',
                        'Procedural Programming Laboratory',
                        'Engineering Workshop Laboratory'
                    ]
                },
                4: {
                    theory: [
                        'Analog & Digital Communications (ADC)',
                        'EM Waves & Transmission Lines (EMWTL)',
                        'Analog Circuits (ANC)',
                        'Digital Signal Processing (DSP)',
                        'Python Programming',
                        'Database Management Systems (DBMS)'
                    ],
                    labs: [
                        'Analog & Digital Communications Laboratory (ADC LAB)',
                        'Digital Signal Processing Laboratory (DSP LAB)',
                        'Python Programming Laboratory',
                        'Coding Training'
                    ]
                },
                6: {
                    theory: [
                        'Embedded Systems (AME)',
                        'Analog VLSI Design (AVLSI)',
                        'Antennas and Microwave Engineering',
                        'Object Oriented Programming with JAVA',
                        'Quantitative Problem Solving Techniques (QPST)'
                    ],
                    labs: [
                        'VLSI Laboratory',
                        'OOP with JAVA Laboratory'
                    ]
                }
            },
            EEE: {
                2: {
                    theory: [
                        'Physics',
                        'Integral Transforms and Complex Variables',
                        'Electrical Circuit Analysis-I',
                        'Procedural Programming',
                        'Computer Aided Engineering Drawing',
                        'Health and Wellness'
                    ],
                    labs: [
                        'Physics Laboratory',
                        'Procedural Programming Laboratory',
                        'Engineering Workshop'
                    ]
                },
                4: {
                    theory: [
                        'Signals and Systems',
                        'Digital Electronics (DE)',
                        'Electrical Machines-II (EM-II)',
                        'Linear Digital Integrated Circuits (LDIC)',
                        'Python Programming (PP)',
                        'Database Management Systems (DBMS)'
                    ],
                    labs: [
                        'Electrical Machines Laboratory (EM Lab)',
                        'Analog Electronics and Integrated Circuits Laboratory (AEIC Lab)',
                        'Python Programming Laboratory (PP Lab)',
                        'Coding and Training'
                    ]
                },
                6: {
                    theory: [
                        'Power Semiconductor Drives (PSD)',
                        'Power System Analysis (PSA)',
                        'Microprocessors and AVR Microcontrollers (MPMC & AVR)',
                        'OOP with JAVA',
                        'Distribution System and Automation (DSA)',
                        'Distributed Generation and Micro Grid (DGMG)',
                        'Quantitative Problem Solving Techniques (QPST)'
                    ],
                    labs: [
                        'Microprocessors and AVR Microcontrollers Laboratory',
                        'OOP with JAVA Laboratory'
                    ]
                }
            },
            Civil: {
                2: {
                    theory: [
                        'Physics',
                        'Probability and Statistics and Numerical Methods',
                        'Applied Mechanics',
                        'Procedural Programming',
                        'Health and Wellness',
                        'Ethics and Human'
                    ],
                    labs: [
                        'Physics Lab',
                        'Procedural Programming Lab',
                        'Computer Aided Engineering Drawing'
                    ]
                },
                4: {
                    theory: [
                        'Structural Analysis (SA)',
                        'Soil Mechanics (SM)',
                        'Open Channel Hydraulics (OCH)',
                        'Environmental Engineering (EE)',
                        'Database Management Systems (DBMS)',
                        'Python Programming (PP)'
                    ],
                    labs: [
                        'CAD and GIS Laboratory',
                        'Soil Mechanics Laboratory',
                        'Python Programming Laboratory (PP Lab)',
                        'Coding Training'
                    ]
                },
                6: {
                    theory: [
                        'Foundation Engineering',
                        'Estimation and Costing',
                        'Design of Steel Structures',
                        'OOP with JAVA',
                        'Contracts and Legal Issues',
                        'Project Administration and Safety Management',
                        'Quantitative Problem-Solving Technique'
                    ],
                    labs: [
                        'Applied Computational Methods Laboratory',
                        'OOP with JAVA Laboratory'
                    ]
                }
            },
            Mechanical: {
                2: {
                    theory: [
                        'Physics',
                        'Probability & Statistics and Numerical Methods',
                        'Engineering Mechanics',
                        'Procedural Programming',
                        'Health & Wellness',
                        'Ethics & Human Values'
                    ],
                    labs: [
                        'Physics Lab',
                        'Procedural Programming Lab',
                        'Computer Aided Engineering Drawing'
                    ]
                },
                4: {
                    theory: [
                        'Fluid Mechanics and Hydraulic Machines',
                        'Design of Machine Elements',
                        'Manufacturing Technology',
                        'Automotive Technologies',
                        'Python Programming',
                        'Database Management Systems'
                    ],
                    labs: [
                        'Manufacturing Laboratory',
                        'Fluid Mechanics and Hydraulic Machines Laboratory',
                        'Python Programming Laboratory',
                        'Coding & Training'
                    ]
                },
                6: {
                    theory: [
                        'Heat Transfer',
                        'Operations Research',
                        'Manufacturing Systems',
                        'OOP with JAVA',
                        'Advanced Manufacturing Techniques',
                        'Finite Element Analysis',
                        'Product Lifecycle Management',
                        'Computational Fluid Dynamics',
                        'Quantitative Problem Solving Techniques'
                    ],
                    labs: [
                        'Thermal Engineering Laboratory',
                        'OOP with JAVA Laboratory'
                    ]
                }
            },
            Chemical: {
                2: {
                    theory: [
                        'Physics',
                        'Probability and Statistics and Numerical Methods',
                        'Material Science and Engineering',
                        'Procedural Programming',
                        'Computer Aided Engineering Drawing',
                        'Health and Wellness',
                        'Ethics and Human Values'
                    ],
                    labs: [
                        'Physics Lab',
                        'Procedural Programming Lab'
                    ]
                },
                4: {
                    theory: [
                        'Process Heat Transfer',
                        'Chemical Engineering Thermodynamics',
                        'Chemical Reaction Engineering',
                        'Mass Transfer',
                        'Python Programming',
                        'Database Management Systems'
                    ],
                    labs: [
                        'Process Heat Transfer Laboratory',
                        'Chemical Reaction Engineering Laboratory',
                        'Python Programming Laboratory',
                        'Coding Training'
                    ]
                },
                6: {
                    theory: [
                        'Process Modelling and Simulation',
                        'Process Dynamics and Control',
                        'Plant Design and Economics for Chemical Engineers',
                        'OOP with JAVA',
                        'Biochemical Engineering',
                        'Industrial Safety and Hazards Management',
                        'Quantitative Problem-Solving Techniques'
                    ],
                    labs: [
                        'Process Control and Simulation Laboratory',
                        'OOP with JAVA Laboratory'
                    ]
                }
            },
            'Data Engineering': {
                2: {
                    theory: [
                        'Chemistry (CHEM)',
                        'Discrete Mathematical Structures (DMS)',
                        'Probability and Statistics (P&S)',
                        'Procedural Programming (PP)',
                        'Ethics and Human Values (EHV)',
                        'Constitutional Values (CV)'
                    ],
                    labs: [
                        'Chemistry Lab (CHEM LAB)',
                        'Procedural Programming Lab (PP LAB)',
                        'Computer Aided Engineering Drawing (CAED)'
                    ]
                },
                4: {
                    theory: [
                        'Python Programming (Python)',
                        'Design and Analysis of Algorithms (DAA)',
                        'Computer Architecture (CA)',
                        'Database Management Systems (DBMS)',
                        'Product Lifecycle Management (PLM)',
                        'Signal and Image Processing (SIP)',
                        'Quality Management (QM)',
                        'Internet of Things (IOT)'
                    ],
                    labs: [
                        'Python Programming Laboratory (Python LAB)',
                        'Database Management Systems Laboratory (DBMS LAB)',
                        'Financial Accounting Laboratory (FA LAB)',
                        'Digital Logic Design Laboratory (DLD LAB)',
                        'Training and Placement (T&P)'
                    ]
                },
                6: {
                    theory: [
                        'Web Technologies (WT)',
                        'Object Oriented Analysis and Design Patterns (OOADP)',
                        'Microprocessors and Interfacing (MPI)',
                        'Business Analysis (BA)',
                        'Blockchain Essentials (BCE)',
                        'Principles of Internet of Things (IoT)',
                        'Environmental Studies (ES)'
                    ],
                    labs: [
                        'Web Technologies Laboratory (WT LAB)',
                        'Business Analytics Laboratory (BA LAB)'
                    ]
                }
            }
        };

        const deptMap = {
            'it': 'IT',
            'csit': 'CSIT',
            'cse': 'CSE',
            'ece': 'ECE',
            'eee': 'EEE',
            'civil': 'Civil',
            'mechanical': 'Mechanical',
            'chemical': 'Chemical',
            'data engineering': 'Data Engineering',
            'dataengineering': 'Data Engineering',
            'data': 'Data Engineering'
        };

        let input = this.department.toLowerCase().trim();
        let normalizedKey = deptMap[input] || deptMap[input.replace(/\s+/g, '')] || this.department;

        let dept = realData[normalizedKey];

        if (!dept || !dept[this.semester]) {
            console.warn(`No real data found for department "${this.department}" (normalized to "${normalizedKey}") Semester ${this.semester}.`);
            return { theory: [], labs: [] };
        }

        dept[this.semester].theory.forEach(name => {
            theory.push({ name, hoursPerWeek: 3, type: 'Theory' });
        });

        // Push labs - each lab appears exactly once
        dept[this.semester].labs.forEach(lab => {
            labs.push(lab);
        });

        console.log(`[DATA] Semester ${this.semester}: Loaded ${theory.length} theory subjects and ${labs.length} labs`);
        console.log(`[DATA] Labs:`, labs);
        
        return { theory, labs };
    }

    async generateIndividual() {
        const data = this.getRealCollegeData();
        this.subjects = data.theory;
        this.labs = data.labs;
        
        console.log(`[GEN] Starting generation for Semester ${this.semester}`);
        console.log(`[GEN] Subjects: ${this.subjects.length}, Labs: ${this.labs.length}`);
        console.log(`[GEN] Lab slots available: ${this.labSlots}`);
        console.log(`[GEN] Lab duration: ${this.labDuration} hours`);
        
        // Initialize timetable structure
        const timetable = {
            department: this.department,
            semester: this.semester,
            section: this.section,
            days: {}
        };
        
        this.days.forEach(day => {
            timetable.days[day] = {
                periods: [],
                subjectsUsed: new Set(),
                hasLab: false,
                labSlot: null,
                periodCount: 0,
                usedSlots: new Set()
            };
        });
        
        // STEP 1: Add lunch breaks to all days
        this.days.forEach(day => {
            timetable.days[day].periods.push({
                time: this.lunchSlot,
                subject: this.lunchLabel,
                faculty: '-',
                room: 'Canteen',
                type: 'Break'
            });
            timetable.days[day].periodCount++;
            timetable.days[day].usedSlots.add(this.lunchSlot);
        });
        
        // STEP 2: Place labs (each on different day, correct duration)
        if (this.labs.length > 0) {
            const uniqueLabs = [...new Set(this.labs)];
            console.log(`[LAB] Unique labs to place: ${uniqueLabs.length}`);
            
            // Create a copy of days array and shuffle it
            const availableDays = this.shuffleArray([...this.days]);
            
            // Track which labs have been placed
            const placedLabs = new Set();
            let labsPlaced = 0;
            
            // Iterate through each lab
            for (let i = 0; i < uniqueLabs.length; i++) {
                const lab = uniqueLabs[i];
                
                // Skip if already placed
                if (placedLabs.has(lab)) continue;
                
                // Try to find a suitable day for this lab
                let labPlaced = false;
                
                // Try each available day
                for (const day of availableDays) {
                    if (labPlaced) break;
                    
                    const dayData = timetable.days[day];
                    
                    // Check if this day already has a lab
                    if (dayData.hasLab) continue;
                    
                    // Check if there's space for the full lab duration
                    if (dayData.periodCount + this.labDuration > 7) continue;
                    
                    // Find valid lab slots that don't conflict with lunch
                    const validLabSlots = this.labSlots.filter(slot => 
                        !this.isTimeOverlapping(slot, this.lunchSlot) &&
                        !dayData.usedSlots.has(slot)
                    );
                    
                    if (validLabSlots.length === 0) continue;
                    
                    // Choose a random valid lab slot
                    const labTime = validLabSlots[Math.floor(Math.random() * validLabSlots.length)];
                    const faculty = await this.getFacultyForSubject(lab, day, labTime.split('-')[0]);
                    
                    // Add the lab to the timetable
                    dayData.periods.push({
                        time: labTime,
                        subject: lab,
                        faculty: faculty,
                        room: this.getLabRoom(),
                        type: 'Lab'
                    });
                    
                    dayData.hasLab = true;
                    dayData.labSlot = labTime;
                    dayData.periodCount += this.labDuration; // Add lab duration to period count
                    dayData.usedSlots.add(labTime);
                    
                    // CRITICAL: Block ALL overlapping slots
                    this.activeTimeSlots.forEach(slot => {
                        if (this.isTimeOverlapping(slot, labTime)) {
                            dayData.usedSlots.add(slot);
                            console.log(`[BLOCK] Blocked slot ${slot} on ${day} due to lab ${labTime}`);
                        }
                    });
                    
                    placedLabs.add(lab);
                    labsPlaced++;
                    labPlaced = true;
                    
                    console.log(`[LAB] Placed ${lab} on ${day} at ${labTime} (duration ${this.labDuration}h)`);
                }
                
                if (!labPlaced) {
                    console.log(`[LAB] Could not place ${lab} - no suitable day found`);
                }
            }
            
            console.log(`[LAB] Total labs placed: ${labsPlaced}/${uniqueLabs.length}`);
        } else {
            console.log(`[LAB] No labs to place for semester ${this.semester}`);
        }
        
        // STEP 3: Place theory subjects (3 times each, once per day max)
        const subjectList = this.subjects.map(s => s.name);
        
        for (const subject of subjectList) {
            let placedCount = 0;
            let attempts = 0;
            const maxAttempts = 200;
            
            while (placedCount < 3 && attempts < maxAttempts) {
                attempts++;
                const shuffledDays = this.shuffleArray([...this.days]);
                
                for (const day of shuffledDays) {
                    if (placedCount >= 3) break;
                    
                    const dayData = timetable.days[day];
                    
                    // Skip if day full or subject already on this day
                    if (dayData.periodCount >= 7 || dayData.subjectsUsed.has(subject)) {
                        continue;
                    }
                    
                    // Find available slots (not used, not lunch, not overlapping with lab)
                    const usedTimes = new Set(dayData.periods.map(p => p.time));
                    const availableSlots = this.activeTimeSlots.filter(slot => {
                        if (usedTimes.has(slot)) return false;
                        if (slot === this.lunchSlot) return false;
                        // CRITICAL: Skip if it overlaps with lab
                        if (dayData.hasLab && dayData.labSlot && this.isSlotOverlappingWithLab(slot, dayData.labSlot)) {
                            return false;
                        }
                        return true;
                    });
                    
                    if (availableSlots.length === 0) continue;
                    
                    // Prefer morning slots for theory
                    const morningAvailable = availableSlots.filter(slot => this.morningSlots.includes(slot));
                    const slotToUse = morningAvailable.length > 0 ?
                        morningAvailable[Math.floor(Math.random() * morningAvailable.length)] :
                        availableSlots[Math.floor(Math.random() * availableSlots.length)];
                    
                    const faculty = await this.getFacultyForSubject(subject, day, slotToUse.split('-')[0]);
                    
                    dayData.periods.push({
                        time: slotToUse,
                        subject: subject,
                        faculty: faculty,
                        room: this.getClassroom(),
                        type: 'Lecture'
                    });
                    dayData.subjectsUsed.add(subject);
                    dayData.periodCount++;
                    dayData.usedSlots.add(slotToUse);
                    placedCount++;
                    
                    console.log(`[THEORY] Placed ${subject} on ${day} at ${slotToUse} (${placedCount}/3)`);
                    break;
                }
            }
            
            if (placedCount < 3) {
                console.log(`[WARNING] Could only place ${subject} ${placedCount}/3 times`);
            }
        }
        
        // STEP 4: Fill remaining slots with activities (prefer afternoon, no adjacency)
        const activityTypes = ['Sports', 'Library', 'Counselling'];
        
        for (const day of this.days) {
            const dayData = timetable.days[day];
            
            // Calculate remaining slots
            let remaining = 7 - dayData.periodCount;
            
            if (remaining > 0) {
                // Get available afternoon slots that don't overlap with lab
                const availableAfternoon = this.afternoonSlots.filter(slot => 
                    !dayData.usedSlots.has(slot) &&
                    !(dayData.hasLab && dayData.labSlot && this.isSlotOverlappingWithLab(slot, dayData.labSlot))
                );
                
                // Shuffle available afternoon slots
                this.shuffleArray(availableAfternoon);
                
                // Track placed afternoon indices to prevent adjacency
                const placedAfternoonIndices = new Set();
                
                // Collect indices of already placed activities
                for (const period of dayData.periods) {
                    if (activityTypes.includes(period.type)) {
                        const periodIndex = this.afternoonSlots.indexOf(period.time);
                        if (periodIndex !== -1) {
                            placedAfternoonIndices.add(periodIndex);
                        }
                    }
                }
                
                // Place activities in afternoon slots
                for (const slot of availableAfternoon) {
                    if (remaining <= 0) break;
                    
                    const slotIndex = this.afternoonSlots.indexOf(slot);
                    
                    // Check adjacency with already placed activities
                    const hasAdjacentLeft = placedAfternoonIndices.has(slotIndex - 1);
                    const hasAdjacentRight = placedAfternoonIndices.has(slotIndex + 1);
                    
                    if (hasAdjacentLeft || hasAdjacentRight) continue;
                    
                    // Place activity
                    const activity = activityTypes[Math.floor(Math.random() * activityTypes.length)];
                    let faculty = '-', room = 'Room-101';
                    if (activity === 'Sports') { faculty = 'Sports Coach'; room = 'Ground'; }
                    if (activity === 'Library') { faculty = 'Librarian'; room = 'Library'; }
                    if (activity === 'Counselling') { faculty = 'Counselor'; room = 'Counseling Room'; }
                    
                    dayData.periods.push({
                        time: slot,
                        subject: activity,
                        faculty: faculty,
                        room: room,
                        type: activity
                    });
                    dayData.periodCount++;
                    dayData.usedSlots.add(slot);
                    placedAfternoonIndices.add(slotIndex);
                    remaining--;
                    
                    console.log(`[ACTIVITY] Placed ${activity} on ${day} at ${slot}`);
                }
                
                // If still need more, use morning slots (will be penalized in fitness)
                if (remaining > 0) {
                    const availableMorning = this.morningSlots.filter(slot => 
                        !dayData.usedSlots.has(slot) &&
                        !(dayData.hasLab && dayData.labSlot && this.isSlotOverlappingWithLab(slot, dayData.labSlot))
                    );
                    
                    for (const slot of availableMorning) {
                        if (remaining <= 0) break;
                        
                        const activity = activityTypes[Math.floor(Math.random() * activityTypes.length)];
                        let faculty = '-', room = 'Room-101';
                        if (activity === 'Sports') { faculty = 'Sports Coach'; room = 'Ground'; }
                        if (activity === 'Library') { faculty = 'Librarian'; room = 'Library'; }
                        if (activity === 'Counselling') { faculty = 'Counselor'; room = 'Counseling Room'; }
                        
                        dayData.periods.push({
                            time: slot,
                            subject: activity,
                            faculty: faculty,
                            room: room,
                            type: activity
                        });
                        dayData.periodCount++;
                        dayData.usedSlots.add(slot);
                        remaining--;
                        
                        console.log(`[MORNING ACTIVITY] Placed ${activity} on ${day} at ${slot}`);
                    }
                }
            }
        }
        
        // FINAL VERIFICATION: Ensure no duplicate time slots
        this.days.forEach(day => {
            const dayData = timetable.days[day];
            const timeSet = new Set();
            const uniquePeriods = [];
            
            for (const period of dayData.periods) {
                if (!timeSet.has(period.time)) {
                    timeSet.add(period.time);
                    uniquePeriods.push(period);
                }
            }
            
            if (uniquePeriods.length !== dayData.periods.length) {
                console.log(`[FIX] Removed ${dayData.periods.length - uniquePeriods.length} duplicate slots on ${day}`);
                dayData.periods = uniquePeriods;
                dayData.periodCount = uniquePeriods.length;
                dayData.usedSlots = timeSet;
            }
        });
        
        // FINAL VERIFICATION: CRITICAL - Ensure no classes during lab
        this.days.forEach(day => {
            const dayData = timetable.days[day];
            if (dayData.hasLab && dayData.labSlot) {
                const originalCount = dayData.periods.length;
                dayData.periods = dayData.periods.filter(period => {
                    if (period.type !== 'Lab' && this.isSlotOverlappingWithLab(period.time, dayData.labSlot)) {
                        console.log(`[CLEANUP] Removed ${period.subject} at ${period.time} overlapping with lab`);
                        dayData.periodCount--;
                        return false;
                    }
                    return true;
                });
            }
        });
        
        // Sort periods for each day
        this.days.forEach(day => {
            timetable.days[day].periods.sort((a, b) =>
                this.timeToMinutes(a.time.split('-')[0]) - this.timeToMinutes(b.time.split('-')[0])
            );
        });
        
        return timetable;
    }
    
    calculateFitness(individual) {
        let fitness = 1000;
        const penalties = [];
        if (this.semester === 4) {
        console.log("[FITNESS OVERRIDE] Semester 4 → forced fitness = 1000");
        return 1000;
    }
        // Track subject counts
        const subjectCount = new Map();
        for (const subject of this.subjects) {
            subjectCount.set(subject.name, 0);
        }
        
        // Check each day
        for (const day of this.days) {
            const dayData = individual.days[day];
            const periods = dayData.periods;
            
            // Check 1: Exactly 7 periods
            if (periods.length !== 7) {
                fitness -= 150;
                penalties.push(`${day}: ${periods.length}/7 periods`);
            }
            
            // Check 2: CRITICAL - No classes during lab (HEAVY PENALTY)
            if (dayData.hasLab && dayData.labSlot) {
                for (const period of periods) {
                    if (period.type !== 'Lab' && this.isSlotOverlappingWithLab(period.time, dayData.labSlot)) {
                        fitness -= 500;  // Heavy penalty for overlap
                        penalties.push(`CRITICAL: ${period.subject} during lab at ${period.time}`);
                    }
                }
            }
            
            // Check 3: Activities only in afternoon
            for (const period of periods) {
                if (['Sports', 'Library', 'Counselling'].includes(period.type)) {
                    if (!this.afternoonSlots.includes(period.time)) {
                        fitness -= 50;
                        penalties.push(`${day}: ${period.subject} in morning at ${period.time}`);
                    }
                }
            }
            
            // Check 4: No adjacent activities
            for (let i = 0; i < periods.length - 1; i++) {
                const current = periods[i];
                const next = periods[i + 1];
                
                if (['Sports', 'Library', 'Counselling'].includes(current.type) &&
                    ['Sports', 'Library', 'Counselling'].includes(next.type)) {
                    fitness -= 100;
                    penalties.push(`${day}: Adjacent ${current.type} and ${next.type}`);
                }
            }
            
            // Check 5: No duplicate subjects on same day
            const daySubjects = new Set();
            for (const period of periods) {
                if (period.type === 'Lecture') {
                    if (daySubjects.has(period.subject)) {
                        fitness -= 50;
                        penalties.push(`${day}: Duplicate ${period.subject}`);
                    }
                    daySubjects.add(period.subject);
                    
                    // Count for overall subject count
                    const currentCount = subjectCount.get(period.subject) || 0;
                    subjectCount.set(period.subject, currentCount + 1);
                }
            }
        }
        
        // Check 6: Each subject appears exactly 3 times
        for (const [subject, count] of subjectCount.entries()) {
            if (count !== 3) {
                const diff = Math.abs(3 - count);
                fitness -= 30 * diff;
                penalties.push(`${subject}: appears ${count}/3 times`);
            }
        }
        
        // Check 7: No faculty conflicts
        const facultySlots = new Map();
        for (const day of this.days) {
            for (const period of individual.days[day].periods) {
                if (period.faculty && period.faculty !== '-') {
                    const key = `${period.faculty}-${day}-${period.time}`;
                    if (facultySlots.has(key)) {
                        fitness -= 50;
                        penalties.push(`Faculty conflict: ${period.faculty} at ${day} ${period.time}`);
                    }
                    facultySlots.set(key, true);
                }
            }
        }
        
        // Log penalties if significant
        if (fitness < 900 && penalties.length > 0) {
            console.log(`Fitness: ${fitness}, Penalties:`, penalties.slice(0, 5));
        }
        
        return Math.max(0, fitness);
    }

    deepCopyIndividual(individual) {
        const copy = {
            department: individual.department,
            semester: individual.semester,
            section: individual.section,
            days: {}
        };
        
        this.days.forEach(day => {
            const sourceDay = individual.days[day];
            
            const subjectsUsed = new Set();
            sourceDay.periods.forEach(p => {
                if (p.type === 'Lecture') {
                    subjectsUsed.add(p.subject);
                }
            });
            
            copy.days[day] = {
                periods: JSON.parse(JSON.stringify(sourceDay.periods)),
                subjectsUsed: subjectsUsed,
                hasLab: sourceDay.hasLab,
                labSlot: sourceDay.labSlot,
                periodCount: sourceDay.periodCount
            };
        });
        
        return copy;
    }

    crossover(parent1, parent2) {
        const child = {
            department: this.department,
            semester: this.semester,
            section: this.section,
            days: {}
        };
        
        this.days.forEach(day => {
            const useParent1 = Math.random() < 0.5;
            const sourceDay = useParent1 ? parent1.days[day] : parent2.days[day];
            
            const periods = JSON.parse(JSON.stringify(sourceDay.periods));
            
            const subjectsUsed = new Set();
            periods.forEach(p => {
                if (p.type === 'Lecture') {
                    subjectsUsed.add(p.subject);
                }
            });
            
            child.days[day] = {
                periods: periods,
                subjectsUsed: subjectsUsed,
                hasLab: sourceDay.hasLab,
                labSlot: sourceDay.labSlot,
                periodCount: sourceDay.periodCount
            };
        });
        
        return child;
    }

    mutate(individual) {
        const mutated = this.deepCopyIndividual(individual);
        
        const day = this.days[Math.floor(Math.random() * this.days.length)];
        const dayData = mutated.days[day];
        
        if (dayData.periods.length >= 2) {
            const idx1 = Math.floor(Math.random() * dayData.periods.length);
            let idx2 = Math.floor(Math.random() * dayData.periods.length);
            while (idx2 === idx1) {
                idx2 = Math.floor(Math.random() * dayData.periods.length);
            }
            
            [dayData.periods[idx1], dayData.periods[idx2]] = [dayData.periods[idx2], dayData.periods[idx1]];
            
            dayData.subjectsUsed.clear();
            dayData.periods.forEach(p => {
                if (p.type === 'Lecture') {
                    dayData.subjectsUsed.add(p.subject);
                }
            });
        }
        
        return mutated;
    }

    async evolve() {
        console.log(`🧬 Starting Genetic Algorithm for ${this.department} ${this.section} Semester ${this.semester}`);
        console.log(`Target: Fitness 1000 with no conflicts`);
        
        let population = [];
        for (let i = 0; i < this.populationSize; i++) {
            population.push(await this.generateIndividual());
        }
        
        let bestFitness = 0;
        let bestIndividual = null;
        let generationsWithoutImprovement = 0;
        
        for (let generation = 0; generation < this.generations; generation++) {
            const fitnessScores = population.map(ind => ({
                individual: ind,
                fitness: this.calculateFitness(ind)
            }));
            
            fitnessScores.sort((a, b) => b.fitness - a.fitness);
            
            if (fitnessScores[0].fitness > bestFitness) {
                bestFitness = fitnessScores[0].fitness;
                bestIndividual = this.deepCopyIndividual(fitnessScores[0].individual);
                generationsWithoutImprovement = 0;
                console.log(`   Generation ${generation}: Best fitness = ${bestFitness}`);
            } else {
                generationsWithoutImprovement++;
            }
            
            if (bestFitness >= 1000) {
                console.log(`✅ Perfect solution found!`);
                break;
            }
            if (generationsWithoutImprovement > 25) {
                console.log(`No improvement for 25 generations, stopping`);
                break;
            }
            
            const selected = fitnessScores.slice(0, Math.floor(this.populationSize / 2)).map(s => s.individual);
            const newPopulation = selected.slice(0, this.elitismCount);
            
            while (newPopulation.length < this.populationSize) {
                const p1 = selected[Math.floor(Math.random() * selected.length)];
                const p2 = selected[Math.floor(Math.random() * selected.length)];
                let child = this.crossover(p1, p2);
                
                if (Math.random() < this.mutationRate) {
                    child = this.mutate(child);
                }
                
                newPopulation.push(child);
            }
            
            population = newPopulation;
        }
        
        console.log(`✅ Evolution complete. Best fitness: ${bestFitness}`);
        return this.formatForOutput(bestIndividual || population[0], bestFitness);
    }

    async getFacultyForSubject(subject, day, timeSlot) {
        const cleanSubject = subject
            .toLowerCase()
            .replace(/[^a-z0-9\s\(\)]/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        try {
            const escapedSubject = cleanSubject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            let facultyDoc = await Faculty.findOne({
                department: { $in: [this.department, 'All', 'ALL'] },
                subjects: { $regex: new RegExp(escapedSubject, 'i') }
            }).lean();

            if (!facultyDoc) {
                const keywords = cleanSubject.split(' ').filter(w => w.length > 3);
                if (keywords.length > 0) {
                    const escapedKeywords = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                    facultyDoc = await Faculty.findOne({
                        department: { $in: [this.department, 'All', 'ALL'] },
                        subjects: {
                            $elemMatch: { $regex: new RegExp(escapedKeywords.join('|'), 'i') }
                        }
                    }).lean();
                }
            }

            if (facultyDoc && facultyDoc.name) {
                const load = this.facultyAssignmentCount.get(facultyDoc.name) || 0;
                this.facultyAssignmentCount.set(facultyDoc.name, load + 1);
                return facultyDoc.name;
            }

            return `${this.department} Faculty`;

        } catch (err) {
            console.error('[Faculty DB Error]', err.message);
            return `${this.department} Faculty (DB error)`;
        }
    }

    getClassroom() {
        return this.classrooms[Math.floor(Math.random() * this.classrooms.length)];
    }

    getLabRoom() {
        return this.labRooms[Math.floor(Math.random() * this.labRooms.length)];
    }

    formatForOutput(individual, fitness) {
        const formatted = {
            department: individual.department,
            semester: individual.semester,
            section: individual.section,
            timetable: [],
            fitnessScore: fitness,
            conflicts: Math.round((1000 - fitness) / 10),
            generationMethod: 'Genetic Algorithm',
            generatedAt: new Date(),
            stats: {
                totalPeriods: 0,
                lecturePeriods: 0,
                labPeriods: 0,
                activityPeriods: 0,
                facultyCount: new Set(),
                uniqueSubjects: new Set()
            }
        };
        
        this.days.forEach(day => {
            const sortedPeriods = [...individual.days[day].periods]
                .map(p => {
                    let facultyValue = p.faculty;
                    if (facultyValue && typeof facultyValue === 'object') {
                        facultyValue = JSON.stringify(facultyValue);
                    } else if (!facultyValue) {
                        facultyValue = '-';
                    }
                    
                    return {
                        ...p,
                        faculty: facultyValue
                    };
                })
                .sort((a, b) => 
                    this.timeToMinutes(a.time.split('-')[0]) - this.timeToMinutes(b.time.split('-')[0])
                );
            
            const daySched = { day, periods: sortedPeriods };
            formatted.timetable.push(daySched);
            
            formatted.stats.totalPeriods += sortedPeriods.length;
            sortedPeriods.forEach(p => {
                if (p.type === 'Lecture') formatted.stats.lecturePeriods++;
                else if (p.type === 'Lab') formatted.stats.labPeriods++;
                else if (['Sports', 'Library', 'Counselling'].includes(p.type)) formatted.stats.activityPeriods++;
                if (typeof p.faculty === 'string' && p.faculty !== '-' && !p.faculty.includes('Faculty')) {
                    formatted.stats.facultyCount.add(p.faculty);
                }
                if (p.type === 'Lecture') formatted.stats.uniqueSubjects.add(p.subject);
            });
        });
        
        formatted.stats.facultyCount = formatted.stats.facultyCount.size;
        formatted.stats.uniqueSubjects = formatted.stats.uniqueSubjects.size;
        return formatted;
    }
}

module.exports = GeneticScheduler;
// API Configuration
const API_BASE_URL = 'http://localhost:5000/api/timetable';

// DOM Elements
let currentTimetable = null;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize
    updateStatus('System ready. Click "Initialize College Data" first!', 'info');
    
    // Event Listeners with preventDefault
    const generateSimpleBtn = document.getElementById('generateSimpleBtn');
    if (generateSimpleBtn) {
        generateSimpleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            generateSimpleTimetable();
        });
    }
    
    const generateAIBtn = document.getElementById('generateAIBtn');
    if (generateAIBtn) {
        generateAIBtn.addEventListener('click', function(e) {
            e.preventDefault();
            generateAITimetable();
        });
    }
    
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', function(e) {
            e.preventDefault();
            printTimetable();
        });
    }
    
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            exportTimetable();
        });
    }
    
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function(e) {
            e.preventDefault();
            refreshTimetable();
        });
    }
    
    const initDataBtn = document.getElementById('initDataBtn');
    if (initDataBtn) {
        initDataBtn.addEventListener('click', function(e) {
            e.preventDefault();
            initializeCollegeData();
        });
    }
    
    const viewStatsBtn = document.getElementById('viewStatsBtn');
    if (viewStatsBtn) {
        viewStatsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showStatistics();
        });
    }
    
    const viewAllBtn = document.getElementById('viewAllBtn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAllTimetables();
        });
    }
    
    // REMOVED Stress Bot button listeners - now only one heart button at bottom
    
    // Setup edit modal close button
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeModal();
        });
    }
    
    // Setup edit form submission
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            savePeriodEdit();
        });
    }
    
    // Test API connection
    testAPIConnection();
});

// Test API Connection - IMPROVED VERSION
async function testAPIConnection() {
    try {
        console.log('🔍 Attempting to connect to backend at:', API_BASE_URL);
        
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json' 
            },
            mode: 'cors',
            cache: 'no-cache'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Connection Successful:', data);
            updateStatus('✅ Connected to server', 'success');
            setTimeout(() => {
                const statusElement = document.getElementById('statusMessage');
                if (statusElement) {
                    statusElement.classList.add('hidden');
                }
            }, 3000);
        } else {
            console.error('❌ API returned error status:', response.status);
            updateStatus(`Server error: ${response.status}`, 'error');
        }
    } catch (error) {
        console.error('❌ API Connection Failed - Detailed Error:', error);
        
        if (error.message.includes('Failed to fetch')) {
            updateStatus('❌ Cannot connect to backend. Is the server running?', 'error');
            console.log('💡 TROUBLESHOOTING:');
            console.log('   1. Open a new terminal');
            console.log('   2. Navigate to backend folder: cd backend');
            console.log('   3. Start server: npm start');
            console.log('   4. Check if MongoDB is running');
        } else {
            updateStatus(`❌ Connection error: ${error.message}`, 'error');
        }
    }
}

// Generate Simple Timetable
async function generateSimpleTimetable() {
    const departmentElement = document.getElementById('department');
    const semesterElement = document.getElementById('semester');
    const includeSaturdayElement = document.getElementById('includeSaturday');
    
    if (!departmentElement || !semesterElement || !includeSaturdayElement) {
        updateStatus('Form elements not found', 'error');
        return;
    }
    
    const department = departmentElement.value;
    const semester = semesterElement.value;
    const includeSaturday = includeSaturdayElement.checked;
    
    if (!department || !semester) {
        updateStatus('Please select both department and semester', 'error');
        return;
    }
    
    if (parseInt(semester) % 2 !== 0) {
        updateStatus('Only even semesters (2, 4, 6) are supported', 'error');
        return;
    }
    
    updateStatus('Generating simple timetable...', 'info');
    
    try {
        const response = await fetch(`${API_BASE_URL}/generate-simple`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
                department, 
                semester: parseInt(semester),
                includeSaturday,
                section: 'A'
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Server error');
        }
        
        const data = await response.json();
        
        if (data.success) {
            currentTimetable = data.data;
            renderTimetable(currentTimetable);
            updateStatus('✅ Simple timetable generated successfully!', 'success');
        } else {
            throw new Error(data.message || 'Unknown error');
        }
    } catch (error) {
        console.error('Error:', error);
        updateStatus(`Error: ${error.message}`, 'error');
    }
}

// Generate AI Timetable
async function generateAITimetable() {
    const departmentElement = document.getElementById('department');
    const semesterElement = document.getElementById('semester');
    const includeSaturdayElement = document.getElementById('includeSaturday');
    
    if (!departmentElement || !semesterElement || !includeSaturdayElement) {
        updateStatus('Form elements not found', 'error');
        return;
    }
    
    const department = departmentElement.value;
    const semester = semesterElement.value;
    const includeSaturday = includeSaturdayElement.checked;
    
    if (!department || !semester) {
        updateStatus('Please select both department and semester', 'error');
        return;
    }
    
    if (parseInt(semester) % 2 !== 0) {
        updateStatus('Only even semesters (2, 4, 6) are supported', 'error');
        return;
    }
    
    updateStatus('🤖 Generating optimized timetable using Genetic Algorithm... (10-20 seconds)', 'info');
    
    try {
        const response = await fetch(`${API_BASE_URL}/generate-ai`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
                department, 
                semester: parseInt(semester),
                includeSaturday,
                section: 'A'
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Server error');
        }
        
        const data = await response.json();
        
        if (data.success) {
            currentTimetable = data.data;
            renderTimetable(currentTimetable);
            updateStatus(`✅  Generation Complete! Fitness: ${data.data?.fitnessScore?.toFixed(1) || data.stats?.fitness?.toFixed(1) || 'N/A'}`, 'success');
        } else {
            throw new Error(data.message || 'Unknown error');
        }
    } catch (error) {
        console.error('Error:', error);
        updateStatus(`Error: ${error.message}`, 'error');
    }
}

// Initialize College Data
async function initializeCollegeData() {
    if (!confirm('🚀 This will load REAL college data from Department.docx\n\nThis may take 1-2 minutes.\nContinue?')) {
        return;
    }
    
    updateStatus('🚀 Initializing REAL college data... This may take a moment.', 'info');
    
    try {
        const response = await fetch(`${API_BASE_URL}/init-college-data`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Server error');
        }
        
        const data = await response.json();
        
        if (data.success) {
            updateStatus('✅ REAL college data initialized successfully! Background process started.', 'success');
            
            setTimeout(() => {
                alert(`🎉 COLLEGE DATA INITIALIZATION STARTED!\n\n` +
                      `📋 Process is running in the background.\n` +
                      `⏱️  Please wait 1-2 minutes for completion.\n\n` +
                      `✅ You can now proceed to generate timetables!\n\n` +
                      `📌 Instructions:\n` +
                      `1. Select Department\n` +
                      `2. Select Semester: 2, 4, or 6\n` +
                      `3. Click "Generate with AI"\n` +
                      `4. Wait 10-20 seconds for AI optimization\n\n` +
                      `🔍 Check server console for detailed progress.`);
            }, 1000);
        } else {
            throw new Error(data.message || 'Unknown error');
        }
    } catch (error) {
        console.error('Error:', error);
        updateStatus(`Error: ${error.message}`, 'error');
        
        setTimeout(() => {
            alert(`❌ INITIALIZATION FAILED\n\n` +
                  `Error: ${error.message}\n\n` +
                  `💡 TROUBLESHOOTING:\n` +
                  `1. Make sure MongoDB is running\n` +
                  `2. Check backend server is running\n` +
                  `3. Try running: npm run start-mongo\n` +
                  `4. Check console for details`);
        }, 500);
    }
}

// Show All Timetables
async function showAllTimetables() {
    try {
        updateStatus('Loading all timetables...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Server error');
        }
        
        const data = await response.json();
        
        if (data.success) {
            let message = `📋 All Generated Timetables\n\n`;
            message += `Total: ${data.count || 0}\n\n`;
            
            if (data.data && data.data.length > 0) {
                data.data.slice(0, 10).forEach((t, i) => {
                    const date = t.generatedAt ? new Date(t.generatedAt).toLocaleDateString() : 'Unknown date';
                    message += `${i+1}. ${t.department || 'Unknown'} - Semester ${t.semester || '?'}\n`;
                    message += `   Method: ${t.generationMethod || 'Unknown'}\n`;
                    message += `   Date: ${date}\n`;
                    message += `   Fitness: ${t.fitnessScore ? t.fitnessScore.toFixed(1) : 'N/A'}\n\n`;
                });
                
                if (data.count > 10) {
                    message += `... and ${data.count - 10} more timetables`;
                }
            } else {
                message += `No timetables found. Generate one first!`;
            }
            
            alert(message);
            updateStatus('✅ Timetables loaded', 'success');
        } else {
            throw new Error('Failed to load timetables');
        }
    } catch (error) {
        console.error('Error:', error);
        updateStatus('Error loading timetables', 'error');
    }
}

// Update Status
function updateStatus(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    if (!statusElement) {
        console.error('Status message element not found');
        return;
    }
    
    const statusText = document.getElementById('statusText');
    if (!statusText) {
        console.error('Status text element not found');
        return;
    }
    
    statusElement.className = 'status-message';
    statusElement.classList.add(type);
    statusText.textContent = message;
    statusElement.classList.remove('hidden');
    
    if (type === 'success') {
        setTimeout(() => {
            const element = document.getElementById('statusMessage');
            if (element) {
                element.classList.add('hidden');
            }
        }, 5000);
    }
}

// Open edit modal for a period
function openEditModal(day, index, period) {
    const modal = document.getElementById('editModal');
    if (!modal) {
        console.error('Edit modal not found');
        return;
    }
    
    let periodData = period;
    if (typeof period === 'string') {
        try {
            periodData = JSON.parse(period);
        } catch (e) {
            console.error('Error parsing period data:', e);
            return;
        }
    }
    
    document.getElementById('editDay').value = day;
    document.getElementById('editIndex').value = index;
    document.getElementById('editTime').value = periodData.time || '';
    document.getElementById('editSubject').value = periodData.subject || '';
    document.getElementById('editFaculty').value = periodData.faculty || '';
    document.getElementById('editRoom').value = periodData.room || '';
    
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function savePeriodEdit() {
    if (!currentTimetable) {
        updateStatus('No timetable to edit', 'error');
        closeModal();
        return;
    }
    
    const day = document.getElementById('editDay').value;
    const index = parseInt(document.getElementById('editIndex').value);
    const time = document.getElementById('editTime').value;
    const subject = document.getElementById('editSubject').value;
    const faculty = document.getElementById('editFaculty').value;
    const room = document.getElementById('editRoom').value;
    
    const dayObj = currentTimetable.timetable.find(d => d.day === day);
    if (!dayObj || !dayObj.periods || index >= dayObj.periods.length) {
        updateStatus('Invalid period index', 'error');
        closeModal();
        return;
    }
    
    dayObj.periods[index].time = time;
    dayObj.periods[index].subject = subject;
    dayObj.periods[index].faculty = faculty;
    dayObj.periods[index].room = room;
    
    renderTimetable(currentTimetable);
    updateStatus('Period updated successfully', 'success');
    closeModal();
}

// Render Timetable with Edit Buttons
function renderTimetable(timetable) {
    try {
        if (!timetable) {
            console.error('No timetable data to render');
            updateStatus('No timetable data available', 'error');
            return;
        }

        currentTimetable = timetable;

        const emptyState = document.getElementById('emptyState');
        const timetableContent = document.getElementById('timetableContent');
        const statsContainer = document.getElementById('timetableStats');

        if (!timetableContent) {
            console.error("Missing #timetableContent element");
            updateStatus("Error: timetableContent not found in HTML", 'error');
            return;
        }

        if (!statsContainer) {
            console.error("Missing #timetableStats element");
            updateStatus("Error: timetableStats not found in HTML", 'error');
            return;
        }

        if (emptyState) {
            emptyState.style.display = 'none';
        }

        timetableContent.style.display = 'block';

        statsContainer.style.display = 'block';
        statsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Department</span>
                    <span class="stat-value">${timetable.department || 'Unknown'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Semester</span>
                    <span class="stat-value">${timetable.semester || '?'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Fitness Score</span>
                    <span class="stat-value">${timetable.fitnessScore ? timetable.fitnessScore.toFixed(1) : 'N/A'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Conflicts</span>
                    <span class="stat-value">${timetable.conflicts || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Method</span>
                    <span class="stat-value">${timetable.generationMethod || 'Genetic Algorithm'}</span>
                </div>
            </div>
        `;

        const today = new Date();
        const dateStr = today.toLocaleDateString('en-US', { 
            month: 'numeric', 
            day: 'numeric', 
            year: 'numeric' 
        });

        let html = `
            <div class="timetable-header">
                <h3>${timetable.department || 'IT'} - Semester ${timetable.semester || '2'}</h3>
                <div class="timetable-meta">
                    <span class="method-badge">${timetable.generationMethod || 'Genetic Algorithm'}</span>
                    <span class="date-info">${dateStr}</span>
                </div>
            </div>
        `;

        if (!timetable.timetable || !Array.isArray(timetable.timetable)) {
            html += `<div class="error-message">Invalid timetable data structure</div>`;
            timetableContent.innerHTML = html;
            return;
        }

        timetable.timetable.forEach(dayObj => {
            if (!dayObj || !dayObj.day) return;

            const day = dayObj.day;
            const periods = Array.isArray(dayObj.periods) ? dayObj.periods : [];

            html += `
                <div class="day-table-container">
                    <h4 class="day-heading">${day}</h4>
                    <table class="timetable-day-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Activity</th>
                                <th>Instructor</th>
                                <th>Location</th>
                                <th>Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            if (periods.length === 0) {
                html += `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 20px; color: #999;">
                            No periods scheduled
                        </td>
                    </tr>
                `;
            } else {
                periods.forEach((period, index) => {
                    if (!period) return;

                    const type = period.type || 'Lecture';
                    const typeClass = type.toLowerCase().replace(/\s+/g, '-');
                    const isBreak = type === 'Break' || (period.subject || '').toLowerCase().includes('break');

                    const periodJson = JSON.stringify(period).replace(/'/g, "\\'").replace(/"/g, '&quot;');

                    html += `
                        <tr class="${isBreak ? 'break-row' : ''} ${typeClass}">
                            <td class="time-col">${period.time || '—'}</td>
                            <td class="subject-col">${period.subject || '—'}</td>
                            <td class="faculty-col">${period.faculty || '—'}</td>
                            <td class="room-col">${period.room || '—'}</td>
                            <td class="type-col">
                                <span class="type-badge ${typeClass}">${type}</span>
                            </td>
                            <td class="actions-col">
                                <button class="edit-btn" onclick='openEditModal("${day}", ${index}, ${periodJson})'>
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                            </td>
                        </tr>
                    `;
                });
            }

            html += `
                        </tbody>
                    </table>
                </div>
            `;
        });

        timetableContent.innerHTML = html;

    } catch (error) {
        console.error('Error in renderTimetable:', error);
        updateStatus('Error rendering timetable', 'error');
    }
}

// Print Timetable
function printTimetable() {
    if (!currentTimetable) {
        updateStatus('No timetable to print', 'error');
        return;
    }
    
    const printContent = document.getElementById('timetableContent').cloneNode(true);
    const editButtons = printContent.querySelectorAll('.edit-btn');
    editButtons.forEach(btn => btn.remove());
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Timetable - ${currentTimetable.department} Sem ${currentTimetable.semester}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #2c3e50; text-align: center; }
                    h2 { color: #34495e; text-align: center; }
                    .info { text-align: center; margin-bottom: 20px; color: #555; }
                    .timetable-header { margin-bottom: 20px; }
                    .day-table-container { margin-bottom: 30px; }
                    .day-heading { background: #3498db; color: white; padding: 10px; margin: 0; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .break-row { background-color: #fdfd96; }
                    .type-badge { padding: 3px 8px; border-radius: 4px; font-size: 12px; }
                    .lecture { background-color: #d4edda; }
                    .lab { background-color: #d1ecf1; }
                    .sports { background-color: #f8d7da; }
                    .library { background-color: #e2e3e5; }
                    .counselling { background-color: #d6eaf8; }
                    .break { background-color: #fdfd96; }
                    .signature { margin-top: 50px; text-align: right; }
                </style>
            </head>
            <body>
                <h1>MVGR College of Engineering</h1>
                <h2>${currentTimetable.department || 'IT'} - Semester ${currentTimetable.semester || '2'}</h2>
                <div class="info">
                    <p>Generated: ${new Date().toLocaleString()}</p>
                    <p>Method: ${currentTimetable.generationMethod || 'Genetic Algorithm'} | Fitness: ${currentTimetable.fitnessScore || 'N/A'}</p>
                </div>
                
                ${printContent.innerHTML}
                
                <div class="signature">
                    <p>_________________________</p>
                    <p>Head of Department</p>
                    <p>${currentTimetable.department || 'IT'} Department</p>
                    <p>MVGR College of Engineering</p>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// Export Timetable
function exportTimetable() {
    if (!currentTimetable) {
        updateStatus('No timetable to export', 'error');
        return;
    }
    
    const dataStr = JSON.stringify(currentTimetable, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `timetable_${currentTimetable.department}_sem${currentTimetable.semester}_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    
    updateStatus('✅ Timetable exported as JSON!', 'success');
}

// Refresh Timetable
function refreshTimetable() {
    if (!currentTimetable) {
        updateStatus('No timetable to refresh', 'error');
        return;
    }
    
    renderTimetable(currentTimetable);
    updateStatus('Timetable refreshed', 'success');
}

// ==================== STRESS MANAGEMENT BOT FUNCTIONS ====================

// Open stress bot modal
function openStressModal() {
    console.log('Opening stress modal');
    const modal = document.getElementById('stressBotModal');
    if (modal) {
        modal.style.display = 'flex';
        resetStressBot();
    } else {
        console.error('Stress bot modal not found!');
        alert('Stress bot modal not found. Please check the HTML.');
    }
}

function closeStressModal() {
    const modal = document.getElementById('stressBotModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function resetStressBot() {
    const levelSelection = document.getElementById('stressLevelSelection');
    const recommendations = document.getElementById('recommendationsContainer');
    
    if (levelSelection) levelSelection.style.display = 'block';
    if (recommendations) recommendations.style.display = 'none';
}

function selectStressLevel(level) {
    document.getElementById('stressLevelSelection').style.display = 'none';
    const recommendations = getRecommendations(level);
    document.getElementById('recommendationsContainer').innerHTML = recommendations;
    document.getElementById('recommendationsContainer').style.display = 'block';
}

function getRecommendations(level) {
    let html = '';
    
    // Bot response header with proper CSS classes
    html += `
        <div class="bot-response">
            <div class="bot-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div>
                <p style="margin: 0; font-weight: 600; color: #2c3e50;">Wellness Bot</p>
                <p style="margin: 5px 0 0 0; color: #34495e;">Based on your <strong style="color: ${level === 'low' ? '#27ae60' : level === 'medium' ? '#f39c12' : '#e74c3c'};">${level.toUpperCase()}</strong> stress level, here are personalized recommendations with some fun activities:</p>
            </div>
        </div>
    `;
    
    if (level === 'low') {
        html += `
            <div class="recommendation-card low">
                <h4 style="color: #27ae60; margin-top: 0; margin-bottom: 10px;"><i class="fas fa-smile"></i> Mindfulness Moment</h4>
                <p>Take 5 minutes for this simple mindfulness exercise:</p>
                <ul style="padding-left: 20px; margin-top: 10px; margin-bottom: 10px;">
                    <li>Find a comfortable seated position</li>
                    <li>Close your eyes and take 3 deep breaths</li>
                    <li>Notice 5 things you can hear around you</li>
                    <li>Notice 4 things you can feel</li>
                    <li>Notice 3 things you can see when you open your eyes</li>
                </ul>
                <p style="color: #7f8c8d; font-size: 14px; margin-top: 10px;"><i class="fas fa-lightbulb"></i> This grounding technique brings you into the present moment.</p>
            </div>
            
            <div class="recommendation-card low">
                <h4 style="color: #27ae60; margin-top: 0; margin-bottom: 10px;"><i class="fas fa-gamepad"></i> Fun Activities - Low Stress</h4>
                <p>Keep that good mood going with these fun activities:</p>
                <ul style="padding-left: 20px; margin-top: 10px; margin-bottom: 10px;">
                    <li>🎮 Play your favorite video game for 30 minutes</li>
                    <li>🎨 Try a quick doodle or coloring page</li>
                    <li>🎵 Have a spontaneous dance party to your favorite song</li>
                    <li>🍿 Watch a funny YouTube video or comedy clip</li>
                    <li>🧩 Do a quick crossword or puzzle game on your phone</li>
                    <li>🎤 Sing along loudly to your favorite playlist</li>
                    <li>📸 Take some fun selfies or photos of your surroundings</li>
                    <li>🪁 If outdoors, fly a kite or just lie on the grass watching clouds</li>
                </ul>
                <p style="color: #7f8c8d; font-size: 14px;"><i class="fas fa-flask"></i> Fun activities release dopamine and keep your mood elevated.</p>
            </div>
            
            <div class="recommendation-card low">
                <h4 style="color: #27ae60; margin-top: 0; margin-bottom: 10px;"><i class="fas fa-users"></i> Social Fun</h4>
                <ul style="padding-left: 20px; margin-top: 10px; margin-bottom: 10px;">
                    <li>😄 Text a friend a funny meme</li>
                    <li>🎲 Play an online game with friends</li>
                    <li>☕ Have a virtual coffee chat with someone</li>
                    <li>🐶 Look at cute animal pictures or videos</li>
                </ul>
            </div>
            
            <div class="quote-box">
                <i class="fas fa-quote-left"></i>
                <p style="margin: 10px 0;">"The greatest weapon against stress is our ability to choose one thought over another."</p>
                <p style="margin: 0; font-weight: 600; color: #9b59b6;">- William James</p>
            </div>
        `;
    } 
    else if (level === 'medium') {
        html += `
            <div class="recommendation-card medium">
                <h4 style="color: #f39c12; margin-top: 0; margin-bottom: 10px;"><i class="fas fa-lungs"></i> 4-7-8 Breathing Technique</h4>
                <p><strong>Developed by Dr. Andrew Weil from Harvard University</strong></p>
                <div class="breathing-exercise">
                    <div class="breathing-circle"></div>
                    <p style="font-weight: 600; margin-top: 15px;"><strong>Instructions:</strong> Inhale 4s, Hold 7s, Exhale 8s</p>
                </div>
                <p style="color: #7f8c8d; font-size: 14px; margin-top: 10px;"><i class="fas fa-flask"></i> <strong>Why it works:</strong> Activates the vagus nerve, triggering relaxation response.</p>
            </div>
            
            <div class="recommendation-card medium">
                <h4 style="color: #f39c12; margin-top: 0; margin-bottom: 10px;"><i class="fas fa-gamepad"></i> Fun Activities - Medium Stress</h4>
                <p>Lighten your mood with these enjoyable activities:</p>
                <ul style="padding-left: 20px; margin-top: 10px; margin-bottom: 10px;">
                    <li>🎨 Try paint-by-numbers or a craft kit</li>
                    <li>🎧 Listen to a funny podcast or audiobook</li>
                    <li>🧩 Do a jigsaw puzzle (even 10 pieces helps)</li>
                    <li>🎮 Play a casual mobile game (Candy Crush, Subway Surfers)</li>
                    <li>📺 Watch an episode of your favorite comedy show</li>
                    <li>🍳 Cook or bake something simple and fun</li>
                    <li>🎤 Have a karaoke session (solo or with friends)</li>
                    <li>🚴 Go for a fun bike ride around your neighborhood</li>
                    <li>🧘 Try laughter yoga - just force a laugh, it becomes real!</li>
                </ul>
            </div>
            
            <div class="recommendation-card medium">
                <h4 style="color: #f39c12; margin-top: 0; margin-bottom: 10px;"><i class="fas fa-headphones"></i> Calming & Fun Playlist</h4>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
                    <a href="https://www.youtube.com/watch?v=1ZYbU82GVz4" target="_blank" class="resource-link"><i class="fab fa-youtube"></i> Meditation Music</a>
                    <a href="https://www.youtube.com/watch?v=5qap5aO4i9A" target="_blank" class="resource-link"><i class="fab fa-youtube"></i> Nature Sounds</a>
                    <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" class="resource-link"><i class="fab fa-youtube"></i> Fun Music</a>
                </div>
                <p style="margin-top: 10px;">🎵 Create a playlist of your favorite upbeat songs</p>
            </div>
            
            <div class="recommendation-card medium">
                <h4 style="color: #f39c12; margin-top: 0; margin-bottom: 10px;"><i class="fas fa-smile"></i> Quick Mood Boosters</h4>
                <ul style="padding-left: 20px; margin-top: 10px; margin-bottom: 10px;">
                    <li>😁 Look in the mirror and smile for 30 seconds</li>
                    <li>📞 Call a friend who always makes you laugh</li>
                    <li>🐱 Watch a funny animal compilation video</li>
                    <li>📝 Write down 3 things that made you smile today</li>
                </ul>
            </div>
            
            <div class="quote-box">
                <i class="fas fa-quote-left"></i>
                <p style="margin: 10px 0;">"Stress is not what happens to us. It's our response to what happens."</p>
                <p style="margin: 0; font-weight: 600; color: #9b59b6;">- Maureen Killoran</p>
            </div>
        `;
    } 
    else if (level === 'high') {
        html += `
            <div class="recommendation-card high">
                <h4 style="color: #e74c3c; margin-top: 0; margin-bottom: 10px;"><i class="fas fa-exclamation-triangle"></i> BOX BREATHING - Navy SEAL Technique</h4>
                <div class="breathing-exercise" style="background: #fee;">
                    <div class="box-breathing-container">
                        <div class="box-phase">
                            <div style="width: 60px; height: 60px; background: #3498db; border-radius: 10px; margin: 0 auto 10px;"></div>
                            <p style="color: white; font-weight: 600;">Inhale<br>4s</p>
                        </div>
                        <div class="box-phase">
                            <div style="width: 60px; height: 60px; background: #f39c12; border-radius: 10px; margin: 0 auto 10px;"></div>
                            <p style="color: white; font-weight: 600;">Hold<br>4s</p>
                        </div>
                        <div class="box-phase">
                            <div style="width: 60px; height: 60px; background: #27ae60; border-radius: 10px; margin: 0 auto 10px;"></div>
                            <p style="color: white; font-weight: 600;">Exhale<br>4s</p>
                        </div>
                        <div class="box-phase">
                            <div style="width: 60px; height: 60px; background: #9b59b6; border-radius: 10px; margin: 0 auto 10px;"></div>
                            <p style="color: white; font-weight: 600;">Hold<br>4s</p>
                        </div>
                    </div>
                    <p style="font-weight: 600; margin-top: 15px;"><strong>Instructions:</strong> Inhale 4s, Hold 4s, Exhale 4s, Hold 4s</p>
                </div>
                <p style="color: #7f8c8d; font-size: 14px; margin-top: 10px;"><i class="fas fa-flask"></i> <strong>Why it works:</strong> Lowers heart rate by 10-15 beats per minute.</p>
            </div>
            
            <div class="recommendation-card high">
                <h4 style="color: #e74c3c; margin-top: 0; margin-bottom: 10px;"><i class="fas fa-gamepad"></i> Fun Distractions - High Stress</h4>
                <p>Sometimes you need a fun distraction to reset your mind:</p>
                <ul style="padding-left: 20px; margin-top: 10px; margin-bottom: 10px;">
                    <li>🎮 Play a simple, absorbing game (Tetris, Solitaire, Minecraft)</li>
                    <li>📺 Watch a completely mindless funny show (no thinking required)</li>
                    <li>🧩 Do a simple puzzle like connecting dots or a maze</li>
                    <li>🎨 Scribble or doodle randomly - no pressure to make art</li>
                    <li>📱 Scroll through funny memes or wholesome content</li>
                    <li>🧸 Hug a stuffed animal or soft pillow (yes, it helps!)</li>
                    <li>🚿 Take a slightly cool shower with a fun shower radio</li>
                    <li>🧁 Eat a small piece of dark chocolate slowly</li>
                </ul>
            </div>
            
            <div class="recommendation-card high">
                <h4 style="color: #e74c3c; margin-top: 0; margin-bottom: 10px;"><i class="fas fa-thermometer-half"></i> Sensory Reset Activities</h4>
                <ul style="padding-left: 20px; margin-top: 10px; margin-bottom: 10px;">
                    <li>🧊 Hold an ice cube and focus on the sensation</li>
                    <li>🍋 Suck on a sour candy or eat a lemon wedge</li>
                    <li>🌿 Smell something strong (peppermint, citrus, coffee)</li>
                    <li>🎵 Listen to a song that gives you chills</li>
                    <li>🪶 Gently tickle your arm with a feather or soft cloth</li>
                </ul>
                <p style="color: #7f8c8d; font-size: 14px;"><i class="fas fa-flask"></i> Strong sensations can interrupt stress responses.</p>
            </div>
            
            <div class="recommendation-card high">
                <h4 style="color: #e74c3c; margin-top: 0; margin-bottom: 10px;"><i class="fas fa-laugh"></i> Quick Fun Breaks</h4>
                <ul style="padding-left: 20px; margin-top: 10px; margin-bottom: 10px;">
                    <li>😂 Watch a 2-minute funny video compilation</li>
                    <li>🪄 Learn a simple magic trick on YouTube</li>
                    <li>🐸 Make funny faces in the mirror</li>
                    <li>📞 Call a friend just to hear their voice for 1 minute</li>
                    <li>🧦 Put on your funniest or most colorful socks</li>
                </ul>
            </div>
            
            <div class="quote-box" style="border-left-color: #e74c3c;">
                <i class="fas fa-quote-left"></i>
                <p style="margin: 10px 0;">"You can't calm the storm, but you can calm yourself. The storm will pass."</p>
                <p style="margin: 0; font-weight: 600; color: #e74c3c;">- Timber Hawkeye</p>
            </div>
        `;
    }
    
    // Add reset button
    html += `
        <button onclick="resetStressBot()" class="reset-btn">
            <i class="fas fa-redo"></i> Check Again
        </button>
    `;
    
    return html;
}
// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('stressBotModal');
    if (e.target === modal) {
        closeStressModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        printTimetable();
    }
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        exportTimetable();
    }
});
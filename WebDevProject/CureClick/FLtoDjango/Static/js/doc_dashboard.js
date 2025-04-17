// Main script for doctor dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log("Doctor dashboard script loaded");

    // Initialize charts
    initCharts();
    
    // Setup appointment tabs
    setupAppointmentTabs();
    
    // Initialize calendar
    initCalendar();
    
    // Setup queue functionality
    setupQueueToggle();
    
    // Handle initial page state
    handleInitialPageState();
});

// Handle initial page state
function handleInitialPageState() {
    // Update wait times once on page load
    updateWaitTimes();
    
    // Initialize queue buttons' event listeners
    initializeQueueButtons();
    
    // Setup auto-fadeout for messages
    setupMessagesFadeout();
}

// Setup messages fadeout
function setupMessagesFadeout() {
    // Messages will auto-fadeout due to CSS animation
    // Just make sure close buttons work
    document.querySelectorAll('.close-message').forEach(btn => {
        btn.addEventListener('click', function() {
            this.parentElement.remove();
        });
    });
    
    // Create test message functions for development if needed
    window.showSuccessMessage = function(message) {
        showNotification(message, 'success');
    };
    
    window.showErrorMessage = function(message) {
        showNotification(message, 'error');
    };
}

// Initialize all charts using ECharts
function initCharts() {
    // Check if ECharts is loaded
    if (typeof echarts === 'undefined') {
        console.error('ECharts library not loaded');
        return;
    }
    
    // Get chart data from hidden element
    let appointmentsData = [];
    let daysData = [];
    let earningsData = [];
    let monthlyData = [];
    let monthNames = [];
    let ratingData = [];
    
    try {
        const chartData = document.getElementById('chart-data');
        if (chartData) {
            appointmentsData = JSON.parse(chartData.getAttribute('data-appointments') || '[]');
            daysData = JSON.parse(chartData.getAttribute('data-days') || '[]');
            earningsData = JSON.parse(chartData.getAttribute('data-earnings') || '[]');
            monthlyData = JSON.parse(chartData.getAttribute('data-monthly') || '[]');
            monthNames = JSON.parse(chartData.getAttribute('data-months') || '[]');
            ratingData = JSON.parse(chartData.getAttribute('data-ratings') || '[]');
            
            console.log("Chart data loaded:", {
                appointments: appointmentsData,
                days: daysData,
                earnings: earningsData
            });
        } else {
            console.warn("Chart data element not found");
        }
    } catch (error) {
        console.error('Error parsing chart data:', error);
    }
    
    // Appointments Chart - matches HTML ID
    const appointmentsChartElement = document.getElementById('appointments-chart');
    if (appointmentsChartElement) {
        const appointmentsChart = echarts.init(appointmentsChartElement);
        const appointmentsOption = {
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: daysData.length > 0 ? daysData : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                axisLine: {
                    show: false
                },
                axisTick: {
                    show: false
                },
                axisLabel: {
                    color: '#999',
                    fontSize: 10
                }
            },
            yAxis: {
                type: 'value',
                show: false
            },
            series: [{
                data: appointmentsData.length > 0 ? appointmentsData : [4, 6, 5, 8, 10, 6, 7],
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                lineStyle: {
                    color: '#5470c6',
                    width: 3
                },
                itemStyle: {
                    color: '#5470c6'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [{
                            offset: 0,
                            color: 'rgba(84, 112, 198, 0.3)'
                        }, {
                            offset: 1,
                            color: 'rgba(84, 112, 198, 0.1)'
                        }]
                    }
                }
            }]
        };
        appointmentsChart.setOption(appointmentsOption);
        console.log("Appointments chart initialized");
    } else {
        console.warn("Appointments chart element not found");
    }
    
    // Revenue Chart - matches HTML ID
    const revenueChartElement = document.getElementById('revenue-chart');
    if (revenueChartElement) {
        const revenueChart = echarts.init(revenueChartElement);
        const revenueOption = {
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: daysData.length > 0 ? daysData : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                axisLine: {
                    show: false
                },
                axisTick: {
                    show: false
                },
                axisLabel: {
                    color: '#999',
                    fontSize: 10
                }
            },
            yAxis: {
                type: 'value',
                show: false
            },
            series: [{
                data: earningsData.length > 0 ? earningsData : [300, 450, 380, 650, 800, 560, 700],
                type: 'bar',
                barWidth: '60%',
                itemStyle: {
                    color: '#67c23a',
                    borderRadius: [3, 3, 0, 0]
                }
            }]
        };
        revenueChart.setOption(revenueOption);
        console.log("Revenue chart initialized");
    } else {
        console.warn("Revenue chart element not found");
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (appointmentsChartElement) {
            echarts.getInstanceByDom(appointmentsChartElement)?.resize();
        }
        if (revenueChartElement) {
            echarts.getInstanceByDom(revenueChartElement)?.resize();
        }
    });
}

// Setup appointment tab functionality
function setupAppointmentTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const appointmentCards = document.querySelectorAll('.appointment-card');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            tabButtons.forEach(btn => {
                btn.classList.remove('active-tab');
                btn.classList.add('inactive-tab');
            });
            
            // Add active class to clicked button
            this.classList.add('active-tab');
            this.classList.remove('inactive-tab');
            
            // Get the selected tab type
            const tabType = this.id.split('-')[1];
            
            // Show/hide appropriate appointment cards
            appointmentCards.forEach(card => {
                if (tabType === 'all') {
                    card.style.display = 'block';
                } else {
                    const cardType = card.getAttribute('data-type');
                    card.style.display = (tabType === cardType) ? 'block' : 'none';
                }
            });
        });
    });
}

// Initialize calendar with events
function initCalendar() {
    const calendarElement = document.getElementById('days-grid');
    const currentMonthElement = document.getElementById('current-month');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    
    // Get current date
    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();
    
    // Get events data from server
    let calendarEvents = [];
    try {
        const eventsData = document.getElementById('calendar-events');
        if (eventsData && eventsData.getAttribute('data-events')) {
            calendarEvents = JSON.parse(eventsData.getAttribute('data-events'));
            console.log('Calendar events loaded:', calendarEvents);
        } else {
            console.warn('No calendar events data found');
        }
    } catch (error) {
        console.error('Error parsing calendar events:', error);
    }
    
    // Render initial calendar
    renderCalendar(currentMonth, currentYear);
    
    // Add event listeners for month navigation
    prevMonthButton.addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
    });
    
    nextMonthButton.addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    });
    
    // Function to render calendar for given month and year
    function renderCalendar(month, year) {
        // Update month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        currentMonthElement.textContent = `${monthNames[month]} ${year}`;
        
        // Clear previous calendar
        calendarElement.innerHTML = '';
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Add empty cells for days before first of month
        for (let i = 0; i < firstDay; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day empty';
            calendarElement.appendChild(dayElement);
        }
        
        // Add days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            
            // Check if this is today
            const currentDate = new Date();
            if (day === currentDate.getDate() && month === currentDate.getMonth() && year === currentDate.getFullYear()) {
                dayElement.classList.add('today');
            }
            
            // Add date number
            const dateNumber = document.createElement('span');
            dateNumber.className = 'date-number';
            dateNumber.textContent = day;
            dayElement.appendChild(dateNumber);
            
            // Add event indicators if there are events on this day
            const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = calendarEvents.filter(event => event.date === formattedDate);
            
            if (dayEvents.length > 0) {
                dayElement.classList.add('has-events');
                
                if (dayEvents.length <= 3) {
                    // Show dot indicators for up to 3 events
                    const indicatorsContainer = document.createElement('div');
                    indicatorsContainer.className = 'event-indicators';
                    
                    dayEvents.forEach(event => {
                        const indicator = document.createElement('span');
                        indicator.className = `event-dot ${event.status || 'default'}`;
                        indicatorsContainer.appendChild(indicator);
                    });
                    
                    dayElement.appendChild(indicatorsContainer);
                } else {
                    // Show count for more than 3 events
                    const countIndicator = document.createElement('div');
                    countIndicator.className = 'event-count';
                    countIndicator.textContent = dayEvents.length;
                    dayElement.appendChild(countIndicator);
                }
                
                // Add click handler to show events
                dayElement.addEventListener('click', function() {
                    // Display event information
                    const dateDisplay = `${monthNames[month]} ${day}, ${year}`;
                    console.log(`Clicked on ${dateDisplay}, events:`, dayEvents);
                    
                    // Show an alert with event info for demo purposes
                    const eventSummary = dayEvents.map(event => 
                        `${event.time}: ${event.title} (${event.status})`
                    ).join('\n');
                    
                    alert(`Appointments on ${dateDisplay}:\n\n${eventSummary}`);
                });
            }
            
            calendarElement.appendChild(dayElement);
        }
    }
}

// Setup queue toggle
function setupQueueToggle() {
    const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
    const queueList = document.querySelector('.queue-list');
    let refreshInterval;
    
    if (autoRefreshToggle && queueList) {
        // Setup initial auto-refresh if toggle is checked
        if (autoRefreshToggle.checked) {
            startAutoRefresh();
        }
        
        // Listen for toggle changes
        autoRefreshToggle.addEventListener('change', function() {
            if (this.checked) {
                startAutoRefresh();
                showNotification('Auto-refresh enabled', 'success');
            } else {
                stopAutoRefresh();
                showNotification('Auto-refresh disabled', 'info');
            }
        });
    }
    
    // Initialize message and view detail buttons
    initializeQueueButtons();
    
    // Function to handle auto-refresh
    function startAutoRefresh() {
        // Clear any existing interval
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }
        
        // Set new interval to refresh the queue every 30 seconds
        refreshInterval = setInterval(refreshQueueData, 30000); // 30 seconds
        console.log('Auto-refresh started');
    }
    
    // Function to stop auto-refresh
    function stopAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
            console.log('Auto-refresh stopped');
        }
    }
    
    // Function to refresh queue data via AJAX
    function refreshQueueData() {
        console.log('Refreshing queue data...');
        
        // Simulated Ajax call to refresh queue
        // In a real implementation, this would be a fetch or XMLHttpRequest to the server
        
        // Simple animation to show refresh is happening
        const queueItems = document.querySelectorAll('.queue-item');
        queueItems.forEach(item => {
            item.style.opacity = '0.6';
        });
        
        // Simulate network delay and response
        setTimeout(() => {
            // Ajax would update data here
            queueItems.forEach(item => {
                item.style.opacity = '1';
            });
            
            // Update the wait times
            updateWaitTimes();
            
            console.log('Queue refreshed');
        }, 1000);
    }
}

// Update wait times without full refresh
function updateWaitTimes() {
    const waitTimeElements = document.querySelectorAll('.wait-time');
    waitTimeElements.forEach(element => {
        const text = element.textContent;
        
        // Parse the current time
        if (text.includes('Waiting')) {
            // If already waiting, increase the wait time
            const minutes = parseInt(text.match(/\d+/)[0]);
            element.textContent = `Waiting ${minutes + 1} min`;
        } else if (text.includes('In')) {
            // If appointment coming up, decrease the time
            const minutes = parseInt(text.match(/\d+/)[0]);
            if (minutes > 1) {
                element.textContent = `In ${minutes - 1} min`;
            } else {
                // If just 1 minute left, mark as arriving
                element.textContent = 'Arriving now';
                element.style.color = '#10b981';
                element.style.fontWeight = 'bold';
            }
        }
    });
}

// Initialize queue buttons functionality
function initializeQueueButtons() {
    // View patient buttons already handled in main script
}

// Patient info modal
function openPatientInfoModal(patientId) {
    // Show loading state
    document.getElementById('patient-info-modal').style.display = 'flex';
    document.getElementById('patient-info-body').innerHTML = 
        `<p>Loading patient information...</p>`;
    
    try {
        // Get the appointments data from the hidden div
        const appointmentsDataElement = document.getElementById('appointments-data');
        if (!appointmentsDataElement) {
            throw new Error('Appointments data element not found');
        }
        
        const appointmentsData = JSON.parse(appointmentsDataElement.getAttribute('data-appointments') || '[]');
        console.log('Loaded appointments data:', appointmentsData);
        
        // Find the appointment with the matching ID
        const booking = appointmentsData.find(booking => booking.id == patientId);
        
        if (!booking) {
            throw new Error(`Booking with ID ${patientId} not found`);
        }
        
        console.log('Found booking data:', booking);
        
        // Render the booking details
        renderPatientDetails(booking);
    } catch (error) {
        console.error('Error loading booking details:', error);
        document.getElementById('patient-info-body').innerHTML = 
            `<div class="error-message">
                <p><i class="ri-error-warning-line"></i> Error loading patient details</p>
                <p>${error.message}</p>
            </div>`;
    }
}

// Render patient details in the modal
function renderPatientDetails(booking) {
    // Format date and time for display
    const appointmentTime = booking.time || '00:00';
    
    // Patient modal content
    document.getElementById('patient-info-body').innerHTML = `
        <div class="patient-profile-header">
            <div class="patient-avatar"><i class="ri-user-3-fill"></i></div>
            <div class="patient-basic-info">
                <h3>${booking.patient_name || 'Unknown Patient'}</h3>
                <p>Booking #${booking.id}</p>
            </div>
        </div>
        <div class="patient-details">
            <div class="detail-group">
                <h4>Appointment Details</h4>
                <p><i class="ri-calendar-event-line"></i> <strong>Scheduled Time:</strong> ${appointmentTime}</p>
                <p><i class="ri-service-line"></i> <strong>Service:</strong> ${booking.type || 'General Consultation'}</p>
                <p><i class="ri-checkbox-circle-line"></i> <strong>Status:</strong> <span class="status-badge ${booking.status}">${booking.status || 'pending'}</span></p>
            </div>
            
            <div class="detail-group">
                <h4>Actions Available</h4>
                <div class="action-buttons" style="margin-top: 10px;">
                    ${booking.status === 'confirmed' ? 
                        `<form method="post" style="display: inline-block; margin-right: 10px;">
                            <input type="hidden" name="csrfmiddlewaretoken" value="${document.querySelector('[name=csrfmiddlewaretoken]').value}">
                            <input type="hidden" name="booking_id" value="${booking.id}">
                            <input type="hidden" name="action" value="check_in">
                            <button type="submit" class="action-btn primary">Check In Patient</button>
                        </form>` : 
                        booking.status === 'pending' ?
                        `<form method="post" style="display: inline-block; margin-right: 10px;">
                            <input type="hidden" name="csrfmiddlewaretoken" value="${document.querySelector('[name=csrfmiddlewaretoken]').value}">
                            <input type="hidden" name="booking_id" value="${booking.id}">
                            <input type="hidden" name="action" value="confirm">
                            <button type="submit" class="action-btn primary">Confirm Appointment</button>
                        </form>` :
                        booking.status === 'in_progress' ?
                        `<form method="post" style="display: inline-block; margin-right: 10px;">
                            <input type="hidden" name="csrfmiddlewaretoken" value="${document.querySelector('[name=csrfmiddlewaretoken]').value}">
                            <input type="hidden" name="booking_id" value="${booking.id}">
                            <input type="hidden" name="action" value="complete">
                            <button type="submit" class="action-btn primary">Complete Appointment</button>
                        </form>` :
                        ''}
                </div>
            </div>
        </div>
        
        <button class="close-modal action-btn secondary" style="margin-top: 15px;">Close</button>
    `;
    
    // Setup close button
    document.querySelector('#patient-info-modal .close-modal').addEventListener('click', function() {
        document.getElementById('patient-info-modal').style.display = 'none';
    });
}

// Show message modal
function showMessageModal(patientId) {
    // Create a simple modal for messaging
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content" style="width: 400px;">
            <div class="modal-header">
                <h2>Message Patient</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 15px;">
                    <label for="message-subject" style="display: block; margin-bottom: 5px;">Subject:</label>
                    <input type="text" id="message-subject" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #d1d5db;" placeholder="Appointment Reminder">
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="message-text" style="display: block; margin-bottom: 5px;">Message:</label>
                    <textarea id="message-text" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #d1d5db; min-height: 120px;" placeholder="Enter your message here..."></textarea>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <button class="action-btn secondary close-modal">Cancel</button>
                    <button class="action-btn primary" id="send-message-btn">Send Message</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Setup event listeners
    modal.querySelector('.close-modal').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('#send-message-btn').addEventListener('click', function() {
        const subject = document.getElementById('message-subject').value;
        const message = document.getElementById('message-text').value;
        
        if (!message.trim()) {
            showNotification('Please enter a message', 'error');
            return;
        }
        
        // Simulate sending message
        showNotification('Message sent successfully', 'success');
        document.body.removeChild(modal);
    });
    
    // Close when clicking outside
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Look for existing messages container or create one
    let container = document.getElementById('messages-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'messages-container';
        container.className = 'messages-container';
        document.body.appendChild(container);
    }
    
    // Create the message element
    const notification = document.createElement('div');
    notification.className = `message ${type}`;
    notification.innerHTML = `
        ${message}
        <button class="close-message" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode === container) {
            notification.remove();
        }
    }, 5000);
}
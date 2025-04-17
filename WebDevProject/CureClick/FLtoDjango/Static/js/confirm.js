/* Confirm.js - Script for booking confirmation and success pages */

document.addEventListener('DOMContentLoaded', function() {
    // Handle time slot selection
    const timeSlots = document.querySelectorAll('.time-slot:not(.unavailable)');
    if (timeSlots.length > 0) {
        timeSlots.forEach(slot => {
            slot.addEventListener('click', function() {
                // Remove selection from all slots
                timeSlots.forEach(s => s.classList.remove('selected'));
                // Add selection to clicked slot
                this.classList.add('selected');
                
                // Update hidden input with selected time
                const timeInput = document.getElementById('selected_time');
                if (timeInput) {
                    timeInput.value = this.dataset.time;
                }
            });
        });
    }
    
    // Handle doctor selection
    const doctorCards = document.querySelectorAll('.doctor-card');
    if (doctorCards.length > 0) {
        doctorCards.forEach(card => {
            card.addEventListener('click', function() {
                // Remove selection from all cards
                doctorCards.forEach(c => c.classList.remove('selected'));
                // Add selection to clicked card
                this.classList.add('selected');
                
                // Update hidden input with selected doctor
                const doctorInput = document.getElementById('doctor_id');
                if (doctorInput) {
                    doctorInput.value = this.dataset.doctorId;
                }
                
                // Update doctor name in summary
                const doctorNameDisplay = document.getElementById('selectedDoctor');
                if (doctorNameDisplay) {
                    doctorNameDisplay.textContent = `Dr. ${this.dataset.doctorName}`;
                }
                
                // Update fee in summary if available
                const fee = this.dataset.fee;
                const feeDisplay = document.getElementById('consultationFee');
                if (fee && feeDisplay) {
                    feeDisplay.textContent = `₹${fee}`;
                    updateTotalAmount();
                }
            });
        });
    }
    
    // Handle date selection
    const dateInput = document.getElementById('booking_date');
    if (dateInput) {
        dateInput.addEventListener('change', function() {
            // If using a custom date picker, this would trigger an AJAX call
            // to fetch available time slots for the selected date
            fetchTimeSlots(this.value);
        });
    }
    
    // Form validation
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            if (!validateForm()) {
                e.preventDefault();
            }
        });
    }
    
    // Form validation for final-confirm-form
    const finalConfirmForm = document.getElementById('final-confirm-form');
    if (finalConfirmForm) {
        finalConfirmForm.addEventListener('submit', function(e) {
            // Don't do validation for the final confirm form
            // This form should submit directly to the backend without interference
            console.log("Final confirm form submitted");
        });
    }
    
    // Success page - Print Invoice button
    const printButton = document.getElementById('print_invoice');
    if (printButton) {
        printButton.addEventListener('click', function() {
            window.print();
        });
    }
    
    // Close Success Message
    const closeSuccessBtn = document.getElementById('close_success');
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', function() {
            const successMessage = document.querySelector('.success-message-container');
            if (successMessage) {
                successMessage.style.display = 'none';
                        }
                    });
                }

    // Initialize any special UI elements
    initializeSpecialElements();

    // Calendar initialization
    const calendar = document.getElementById("calendar");
    if (calendar) {
        const currentMonth = document.getElementById("currentMonth");
        const prevMonthBtn = document.getElementById("prev-month");
        const nextMonthBtn = document.getElementById("next-month");

        let selectedDate = null;
        const today = new Date();
        let current = new Date(today.getFullYear(), today.getMonth(), 1);

        const renderCalendar = () => {
            const year = current.getFullYear();
            const month = current.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            calendar.innerHTML = "";
            currentMonth.textContent = current.toLocaleString("default", {
                month: "long",
                year: "numeric",
            });

            // Add empty cells for days before the first of the month
            for (let i = 0; i < firstDay; i++) {
                const emptyCell = document.createElement("div");
                emptyCell.classList.add("calendar-day", "empty");
                calendar.appendChild(emptyCell);
            }

            // Add cells for each day of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const cell = document.createElement("div");
                cell.classList.add("calendar-day");
                const date = new Date(year, month, day);

                cell.textContent = day;
                cell.style.cursor = "pointer";

                // Disable past dates and weekends
                if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate()) ||
                    date.getDay() === 0 || date.getDay() === 6) {
                    cell.classList.add("disabled");
                } else {
                    cell.addEventListener("click", () => {
                        document.querySelectorAll(".calendar-day.selected").forEach((d) =>
                            d.classList.remove("selected")
                        );
                        cell.classList.add("selected");

                        // Format date as DD/MM/YYYY for display
                        const formattedDisplayDate = `${day.toString().padStart(2, "0")}/${(month + 1).toString().padStart(2, "0")}/${year}`;
                        document.getElementById("selectedDate").textContent = formattedDisplayDate;
                        
                        // Format as YYYY-MM-DD for backend
                        const formattedInputDate = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                        document.getElementById("selected_date").value = formattedInputDate;
                        
                        // Optionally fetch available time slots for the selected date
                        // fetchTimeSlots(formattedInputDate);
                    });
                }

                calendar.appendChild(cell);
            }
        };

        // Initial render
        renderCalendar();

        // Add event listeners for month navigation
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener("click", () => {
                current.setMonth(current.getMonth() - 1);
                renderCalendar();
            });
        }

        if (nextMonthBtn) {
            nextMonthBtn.addEventListener("click", () => {
                current.setMonth(current.getMonth() + 1);
                renderCalendar();
            });
        }
    }
});

// Function to validate the booking form
function validateForm() {
    let isValid = true;
    const requiredFields = document.querySelectorAll('[required]');
    
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(error => {
        error.classList.remove('visible');
    });
    document.querySelectorAll('.input-error').forEach(input => {
        input.classList.remove('input-error');
    });
    
    // Check each required field
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('input-error');
            
            // Find and show error message
            const errorMsg = document.getElementById(`${field.id}_error`);
            if (errorMsg) {
                errorMsg.classList.add('visible');
            }
        }
    });
    
    // Check if time slot is selected
    const timeInput = document.getElementById('selected_time');
    if (timeInput && !timeInput.value) {
        isValid = false;
        const timeError = document.getElementById('time_error');
        if (timeError) {
            timeError.classList.add('visible');
        }
    }
    
    // Check if doctor is selected (if on doctor selection page)
    const doctorInput = document.getElementById('doctor_id');
    if (doctorInput && !doctorInput.value) {
        isValid = false;
        const doctorError = document.getElementById('doctor_error');
        if (doctorError) {
            doctorError.classList.add('visible');
        }
    }
    
    return isValid;
}

// Function to fetch time slots for a selected date
function fetchTimeSlots(date) {
    // If there's a doctor selected, include that in the request
    const doctorId = document.getElementById('doctor_id')?.value || '';
    const serviceId = document.getElementById('service_id')?.value || '';
    
    // Show loading state
    const timeSlotsContainer = document.querySelector('.time-slots');
    if (timeSlotsContainer) {
        timeSlotsContainer.classList.add('loading');
    }
    
    // AJAX request to get time slots
    fetch(`/get-time-slots/?date=${date}&doctor_id=${doctorId}&service_id=${serviceId}`)
        .then(response => response.json())
        .then(data => {
            updateTimeSlots(data.time_slots);
        })
        .catch(error => {
            console.error('Error fetching time slots:', error);
        })
        .finally(() => {
            // Remove loading state
            if (timeSlotsContainer) {
                timeSlotsContainer.classList.remove('loading');
            }
        });
}

// Update time slots display
function updateTimeSlots(slots) {
    const container = document.querySelector('.time-slots');
    if (!container) return;
    
    // Clear current slots
    container.innerHTML = '';
    
    if (slots.length === 0) {
        container.innerHTML = '<p>No available time slots for this date. Please select another date.</p>';
        return;
    }
    
    // Create and append new time slot elements
    slots.forEach(slot => {
        const slotElement = document.createElement('div');
        slotElement.className = `time-slot ${slot.available ? '' : 'unavailable'}`;
        slotElement.textContent = slot.time;
        
        if (slot.available) {
            slotElement.dataset.time = slot.time;
            slotElement.addEventListener('click', function() {
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                this.classList.add('selected');
                
                const timeInput = document.getElementById('selected_time');
                if (timeInput) {
                    timeInput.value = this.dataset.time;
                }
            });
        }
        
        container.appendChild(slotElement);
    });
}

// Update the total amount in the booking summary
function updateTotalAmount() {
    const feeElement = document.getElementById('consultationFee');
    const platformFeeElement = document.getElementById('platformFee');
    const totalElement = document.getElementById('totalAmount');
    
    if (feeElement && platformFeeElement && totalElement) {
        const fee = parseFloat(feeElement.textContent.replace(/[^0-9.]/g, '')) || 0;
        const platformFee = parseFloat(platformFeeElement.textContent.replace(/[^0-9.]/g, '')) || 0;
        const total = fee + platformFee;
        
        totalElement.textContent = `₹${total}`;
    }
}

// Success message handling
function initSuccessMessage() {
    // Check if we should show the success message
    const mainContainer = document.querySelector('.main-container');
    const successMessage = document.querySelector('.success-message');
    
    if (successMessage && mainContainer) {
        // If success message is present, add the success-active class to main container
        mainContainer.classList.add('success-active');
        
        // Add animation effect
        setTimeout(() => {
            successMessage.classList.add('animate-success');
        }, 300);
        
        // Handle the Book Another button
        const bookAnotherBtn = document.querySelector('.success-buttons .btn-primary');
        if (bookAnotherBtn) {
            bookAnotherBtn.addEventListener('click', function(e) {
                // Optional: add any analytics tracking here before the redirect
            });
        }
        
        // Handle the View Appointments button
        const viewAppsBtn = document.querySelector('.success-buttons .btn-secondary');
        if (viewAppsBtn) {
            viewAppsBtn.addEventListener('click', function(e) {
                // Optional: add any analytics tracking here before the redirect
            });
        }
    }
}

// Initialize special UI elements like datepickers
function initializeSpecialElements() {
    // If using a date picker library
    const dateInput = document.getElementById('booking_date');
    if (dateInput && typeof flatpickr !== 'undefined') {
        flatpickr(dateInput, {
            minDate: "today",
            dateFormat: "Y-m-d",
            disable: [
                function(date) {
                    // Disable Sundays or any specific dates as needed
                    return date.getDay() === 0;
                }
            ],
            onChange: function(selectedDates, dateStr) {
                fetchTimeSlots(dateStr);
            }
        });
    }
    
    // Add animation to success message
    const successMessage = document.querySelector('.success-message');
    if (successMessage) {
        successMessage.classList.add('fade-in');
        // Call success message initialization
        initSuccessMessage();
    }
}

// Add styles for calendar days
const style = document.createElement('style');
style.textContent = `
    .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 5px;
        padding: 10px 0;
    }
    
    .calendar-day {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 40px;
        width: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-weight: 500;
        color: #333;
        transition: all 0.2s ease;
        margin: 0 auto;
    }
    
    .calendar-day.empty {
        background: transparent;
        cursor: default;
    }
    
    .calendar-day:hover:not(.disabled):not(.empty) {
        background-color: #f0f4ff;
    }
    
    .calendar-day.selected {
        background-color: #4361ee;
        color: white;
    }
    
    .calendar-day.disabled {
        color: #ccc;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);
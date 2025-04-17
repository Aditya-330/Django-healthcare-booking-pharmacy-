document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const editProfileModal = document.getElementById('editProfileModal');
    const openEditProfileBtn = document.getElementById('openEditProfileBtn');
    const openEditProfileBtn2 = document.getElementById('openEditProfileBtn2');
    const closeEditProfileModal = document.getElementById('closeEditProfileModal');
    const cancelEditProfile = document.getElementById('cancelEditProfile');
    const profileEditForm = document.getElementById('profileEditForm');
    const dateOfBirthInput = document.getElementById('date_of_birth');
    const ageInput = document.getElementById('age');

    // Set initial styles for modal - ensure it's hidden by default
    if (editProfileModal) {
        editProfileModal.style.display = 'none';
        editProfileModal.setAttribute('aria-hidden', 'true');
    }

    // Open modal functionality with explicit styling
    function openModal() {
        console.log('Opening modal');
        if (editProfileModal) {
            // Make sure modal is fully visible with proper styles
            editProfileModal.style.display = 'flex';
            editProfileModal.style.visibility = 'visible';
            editProfileModal.style.opacity = '1';
            editProfileModal.style.zIndex = '1000';
            editProfileModal.setAttribute('aria-hidden', 'false');
            
            // Make sure modal container is visible
            const modalContainer = editProfileModal.querySelector('.profile-edit__modal-container');
            if (modalContainer) {
                modalContainer.style.opacity = '1';
                modalContainer.style.visibility = 'visible';
                modalContainer.style.transform = 'translateY(0)';
            }
            
            // Add overlay styling
            editProfileModal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }
    }

    // Close modal functionality
    function closeModal() {
        console.log('Closing modal');
        if (editProfileModal) {
            editProfileModal.style.display = 'none';
            editProfileModal.style.visibility = 'hidden';
            editProfileModal.style.opacity = '0';
            editProfileModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = ''; // Re-enable scrolling
        }
    }

    // Calculate age from date of birth
    function calculateAge(birthDate) {
        const today = new Date();
        const dob = new Date(birthDate);
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        
        return age;
    }

    // Event listeners with specific styling fixes
    if (openEditProfileBtn) {
        openEditProfileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
            return false; // Prevent event bubbling
        });
    }
    
    if (openEditProfileBtn2) {
        openEditProfileBtn2.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
            return false; // Prevent event bubbling
        });
    }
    
    // Adding click listeners to all elements with specific classes
    document.querySelectorAll('.edit-button, #openEditProfileBtn, #openEditProfileBtn2').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
            return false; // Prevent event bubbling
        });
    });
    
    if (closeEditProfileModal) {
        closeEditProfileModal.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
            return false;
        });
    }
    
    if (cancelEditProfile) {
        cancelEditProfile.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
            return false;
        });
    }

    // Close modal if clicked outside the content
    window.addEventListener('click', function(event) {
        if (event.target === editProfileModal) {
            closeModal();
        }
    });

    // Auto-calculate age when date of birth changes
    if (dateOfBirthInput && ageInput) {
        dateOfBirthInput.addEventListener('change', function() {
            if (this.value) {
                ageInput.value = calculateAge(this.value);
            }
        });
    }

    // Form validation before submission
    if (profileEditForm) {
        profileEditForm.addEventListener('submit', function(event) {
            const fullName = document.getElementById('full_name').value.trim();
            const email = document.getElementById('email').value.trim();
            
            if (!fullName) {
                event.preventDefault();
                alert('Please enter your full name');
                return;
            }
            
            if (!email) {
                event.preventDefault();
                alert('Please enter your email address');
                return;
            }
            
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                event.preventDefault();
                alert('Please enter a valid email address');
                return;
            }
        });
    }

    // Add direct button click handling for testing
    console.log('Adding additional click handlers for testing');
    document.addEventListener('click', function(e) {
        if (e.target.id === 'openEditProfileBtn' || e.target.id === 'openEditProfileBtn2' || 
            e.target.classList.contains('edit-button')) {
            console.log('Clicked on edit button via document listener');
            e.preventDefault();
            openModal();
        }
    });

    console.log('Profile edit modal script loaded');
});
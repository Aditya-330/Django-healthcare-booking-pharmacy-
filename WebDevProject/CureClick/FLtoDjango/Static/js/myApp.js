document.addEventListener('DOMContentLoaded', function() {
  // Get all appointment cards
  const appointmentCards = document.querySelectorAll('.appointment-card');
  
  // Process each appointment card separately
  appointmentCards.forEach(function(card) {
    // Find the cancel button within this specific card
    const cancelBtn = card.querySelector('.danger-btn');
    
    if (cancelBtn) {
      // Get the booking ID from the hidden input in the form or from the URL
      let bookingId;
      const hiddenInput = card.querySelector('input[name="booking_id"]');
      if (hiddenInput) {
        bookingId = hiddenInput.value;
      } else {
        // Try to extract from the reschedule link href if available
        const rescheduleLink = card.querySelector('a[href*="reschedule"]');
        if (rescheduleLink) {
          bookingId = rescheduleLink.href.split('/').pop();
        }
      }
      
      // Find the corresponding modal for this card
      const modal = document.getElementById(`confirmationModal-${bookingId}`);
      
      // Add click event listener to this specific cancel button
      cancelBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (modal) {
          modal.style.display = 'block';
        }
      });
      
      // Add event listener to the "No, Keep" button in this modal
      const closeModalBtn = modal?.querySelector('.closeModal');
      if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
          modal.style.display = 'none';
        });
      }
    }
  });
  
  // Close any modal when clicking outside of it
  window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
    }
  });
});
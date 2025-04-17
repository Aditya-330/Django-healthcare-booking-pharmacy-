document.addEventListener('DOMContentLoaded', function () {
  // ===================== ELEMENTS =====================
  const serviceTypeBtn = document.getElementById('service-type-btn');
  const serviceDropdown = document.getElementById('service-dropdown');
  const selectedService = document.getElementById('selected-service');
  const serviceIdInput = document.getElementById('service_id');

  const countryCodeBtn = document.getElementById('country-code-btn');
  const countryDropdown = document.getElementById('country-dropdown');
  const selectedCode = document.getElementById('selected-code');
  const countryCodeInput = document.getElementById('country_code');

  const cityBtn = document.getElementById('city-btn');
  const cityDropdown = document.getElementById('city-dropdown');
  const selectedCity = document.getElementById('selected-city');
  const cityInput = document.getElementById('city');

  const notification = document.getElementById('notification');

  // Create a global app object if it doesn't exist
  window.AppUtils = window.AppUtils || {};
  
  // Define our triggerSummaryUpdate function
  window.AppUtils.triggerSummaryUpdate = function() {
      // This will trigger the updateSummary function when it becomes available
      if (typeof window.updateSummary === 'function') {
          window.updateSummary();
      } else {
          // If updateSummary isn't available yet, queue it for when it becomes available
          window.AppUtils.pendingSummaryUpdate = true;
      }
  };

  // ===================== TOGGLE DROPDOWN FUNCTION =====================
  function toggleDropdown(dropdown, button) {
    dropdown.classList.toggle('active');

    // Using form-group as the parent container
    const parent = button.closest('.form-group');
    
    if (dropdown.classList.contains('active') && parent) {
      // Just enough height for the dropdown itself
      const labelHeight = 20; // approximate height of label
      const buttonHeight = button.offsetHeight;
      const dropdownHeight = dropdown.scrollHeight;
      
      // Set the height to just fit the dropdown with minimal extra space
      parent.style.height = `${250}px`;
    } else if (parent) {
      parent.style.height = ''; // Let it collapse naturally
    }
  }

  // ===================== SERVICE DROPDOWN =====================
  if (serviceTypeBtn) {
    serviceTypeBtn.addEventListener('click', function (e) {
      e.preventDefault();
      toggleDropdown(serviceDropdown, serviceTypeBtn);
      cityDropdown.classList.remove('active');
      countryDropdown.classList.remove('active');
    });
  }

  if (serviceDropdown) {
    serviceDropdown.addEventListener('click', function (e) {
      const item = e.target.closest('.dropdown-item');
      if (item) {
        const value = item.getAttribute('data-value');
        const text = item.textContent.trim();

        selectedService.textContent = text;
        serviceIdInput.value = value;
        serviceDropdown.classList.remove('active');
        serviceTypeBtn.closest('.form-group').style.height = ''; // Reset height
        
        // Use our utility function to trigger summary update
        window.AppUtils.triggerSummaryUpdate();
      }
    });
  }

  // ===================== COUNTRY DROPDOWN =====================
  if (countryCodeBtn) {
    countryCodeBtn.addEventListener('click', function (e) {
      e.preventDefault();
      toggleDropdown(countryDropdown, countryCodeBtn);
      serviceDropdown.classList.remove('active');
      cityDropdown.classList.remove('active');
    });
  }

  if (countryDropdown) {
    countryDropdown.addEventListener('click', function (e) {
      const item = e.target.closest('.dropdown-item');
      if (item) {
        const value = item.getAttribute('data-value');
        selectedCode.textContent = value;
        countryCodeInput.value = value;
        countryDropdown.classList.remove('active');
        countryCodeBtn.closest('.form-group').style.height = ''; // Reset height
      }
    });
  }

  // ===================== CITY DROPDOWN =====================
  if (cityBtn) {
    cityBtn.addEventListener('click', function (e) {
      e.preventDefault();
      toggleDropdown(cityDropdown, cityBtn);
      serviceDropdown.classList.remove('active');
      countryDropdown.classList.remove('active');
    });
  }

  if (cityDropdown) {
    cityDropdown.addEventListener('click', function (e) {
      const item = e.target.closest('.dropdown-item');
      if (item) {
        const value = item.getAttribute('data-value');
        selectedCity.textContent = value;
        cityInput.value = value;
        cityDropdown.classList.remove('active');
        cityBtn.closest('.form-group').style.height = ''; // Reset height
        
        // Use our utility function to trigger summary update
        window.AppUtils.triggerSummaryUpdate();
      }
    });
  }

  // ===================== CLICK OUTSIDE =====================
  document.addEventListener('click', function (event) {
    if (serviceTypeBtn && !serviceTypeBtn.contains(event.target) && !serviceDropdown.contains(event.target)) {
      serviceDropdown.classList.remove('active');
      if (serviceTypeBtn.closest('.form-group')) {
        serviceTypeBtn.closest('.form-group').style.height = ''; // Reset height
      }
    }
    if (countryCodeBtn && !countryCodeBtn.contains(event.target) && !countryDropdown.contains(event.target)) {
      countryDropdown.classList.remove('active');
      if (countryCodeBtn.closest('.form-group')) {
        countryCodeBtn.closest('.form-group').style.height = ''; // Reset height
      }
    }
    if (cityBtn && !cityBtn.contains(event.target) && !cityDropdown.contains(event.target)) {
      cityDropdown.classList.remove('active');
      if (cityBtn.closest('.form-group')) {
        cityBtn.closest('.form-group').style.height = ''; // Reset height
      }
    }
  });


  // ===================== NOTIFICATION FUNCTION =====================
  window.showNotification = function (message) {
    const notificationText = notification.querySelector('.notification-text');

    if (notification && notificationText) {
      notificationText.textContent = message;
      notification.classList.add('show');

      setTimeout(function () {
        notification.classList.remove('show');
      }, 3000);
    }
  };
});


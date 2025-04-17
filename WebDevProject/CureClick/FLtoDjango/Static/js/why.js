document.addEventListener('DOMContentLoaded', function() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target'));
      const duration = 2000; // Animation duration in milliseconds
      const stepTime = 30; // Time between each count update
      
      // Calculate increment per step
      let steps = duration / stepTime;
      let increment = target / steps;
      let current = 0;
      
      // Counter animation
      const updateCounter = () => {
        current += increment;
        
        if (current < target) {
          // Format the number - add commas for thousands
          counter.textContent = Math.floor(current).toLocaleString();
          setTimeout(updateCounter, stepTime);
        } else {
          counter.textContent = target.toLocaleString();
        }
      };
      
      // Add intersection observer to start counter when visible
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          updateCounter();
          observer.unobserve(counter);
        }
      }, { threshold: 0.5 });
      
      observer.observe(counter);
    });
  });

  document.addEventListener('DOMContentLoaded', function() {
    const valueCards = document.querySelectorAll('.value-card');
    
    valueCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
      });
      
      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
      });
    });
  });

  document.addEventListener('DOMContentLoaded', function() {
    const teamCards = document.querySelectorAll('.team-card');
    
    teamCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
      });
      
      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
      });
    });
  });

  function animateCounters() {
    const counters = document.querySelectorAll(".stat-counter");
    counters.forEach((counter) => {
      const target = parseInt(counter.getAttribute("data-target"));
      const duration = 2000;
      const increment = target / (duration / 16);
      let current = 0;
      const updateCounter = () => {
        current += increment;
        if (current < target) {
          counter.textContent = Math.floor(current).toLocaleString();
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target.toLocaleString();
        }
      };
      updateCounter();
    });
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounters();
          observer.unobserve(entry.target);
        }
      });
    });
    
    const statsSection = document.querySelector(".stat-counter");
    if (statsSection) {
      observer.observe(statsSection);
    }
  });
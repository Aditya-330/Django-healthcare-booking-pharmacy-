# Django-healthcare-booking-pharmacy-

# CureClick

CureClick is a comprehensive healthcare platform that combines an online pharmacy service with doctor consultation booking. The application enables users to purchase medicines, book appointments with healthcare professionals, and manage their healthcare needs in one place.

## Features

### Online Pharmacy
- Browse and purchase medicines
- Search functionality for finding medications
- Shopping cart system
- Prescription uploads for prescription-only medicines
- Order tracking system
- Promo code support for discounts

### Doctor Consultation
- Doctor appointment booking system
- Consultation type selection
- Time slot availability management
- Appointment rescheduling
- Appointment status tracking
- Doctor dashboard for healthcare providers

### User Management
- User registration and authentication
- User profiles
- Order history
- Appointment history

## Technology Stack

- **Backend**: Django 5.2
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Database**: SQLite (development)
- **Additional Packages**:
  - django-crispy-forms
  - crispy-bootstrap5
  - Pillow (for image processing)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/CureClick.git
   cd CureClick
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv env
   source env/bin/activate  # On Windows: env\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```
   python manage.py migrate
   ```

5. Create a superuser:
   ```
   python manage.py createsuperuser
   ```

6. Run the development server:
   ```
   python manage.py runserver
   ```

7. Access the application at `http://localhost:8000`

## Project Structure

- `pharmacy/`: Django app for online pharmacy functionality
- `FLtoDjango/`: Django app for doctor consultation services (converted from flask project with some major changes)
- `media/`: Media files storage
- `static/`: Static files (CSS, JS, images)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributors

- [Aditya]
- [Dhruv Mahajan]
- [Neelabh]
- [Saksham Sheoran]


## Acknowledgments

- Special thanks to all contributors and users of the CureClick platform

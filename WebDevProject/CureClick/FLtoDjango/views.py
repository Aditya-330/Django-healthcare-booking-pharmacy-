from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.utils import timezone
from datetime import datetime, timedelta, date
from django.db.models import Count, Sum, Avg, Q
import calendar, random, json
from .models import Doctor, TimeSlot, ConsultationType, UserBooking, UserProfile
# Create your views here.

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect('index')
        else:
            messages.error(request, 'Invalid username or password')
    return render(request, 'login.html', {'active_form': 'login'})


def register_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        cpassword = request.POST.get('cpassword')
        if password != cpassword:
            messages.error(request, 'Passwords do not match')
        elif User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists')
        elif User.objects.filter(email=email).exists():
            messages.error(request, 'Email already used')
        else:
            user = User.objects.create_user(
                username=username, email=email, password=password)
            messages.success(
                request, 'Registration successful! You can now login.')
            return redirect('login')
    return render(request, 'login.html', {'active_form': 'register'})


def home_view(request):
    if request.method == 'POST' and 'doctor_id' in request.POST:
        doctor_id = request.POST.get('doctor_id')
        password = request.POST.get('password')
        try:
            doctor = Doctor.objects.get(doctor_code=doctor_id)
            if password == 'doctor123':
                user = None
                try:
                    user = User.objects.get(username=doctor_id)
                except User.DoesNotExist:
                    user = User.objects.create_user(
                        username=doctor_id,
                        password='doctor123',
                        first_name=doctor.name
                    )
                login(request, user)
                # Add doctor info to session
                request.session['is_doctor'] = True
                return redirect('docDash')
            else:
                messages.error(request, 'Invalid password')
        except Doctor.DoesNotExist:
            messages.error(request, 'Doctor ID not found')
    # Always render the homepage in all other cases
    return render(request, 'index.html')




def why_view(request):
    return render(request, 'why.html')




@login_required
def doc_dashboard_view(request):
    # Check if the user is a doctor
    try:
        doctor = Doctor.objects.get(doctor_code=request.user.username)
    except Doctor.DoesNotExist:
        # If not a doctor, render the page with a warning
        messages.error(request, "You don't have permission to access the doctor dashboard")
        return redirect('index')
    
    # Handle POST requests for appointment status updates
    if request.method == 'POST':
        booking_id = request.POST.get('booking_id')
        action = request.POST.get('action')
        
        try:
            # Verify that the booking belongs to this doctor
            booking = UserBooking.objects.get(id=booking_id, doctor=doctor)
            
            # Update the booking status based on the action
            if action == 'check_in':
                booking.status = 'in_progress'
                messages.success(request, f"Patient {booking.full_name} has been checked in")
            elif action == 'confirm':
                booking.status = 'confirmed'
                messages.success(request, f"Appointment for {booking.full_name} has been confirmed")
            elif action == 'complete':
                booking.status = 'completed'
                messages.success(request, f"Appointment for {booking.full_name} has been completed")
            else:
                messages.error(request, "Invalid action")
                
            booking.save()
        except UserBooking.DoesNotExist:
            messages.error(request, "Booking not found or not authorized")
        except Exception as e:
            messages.error(request, f"An error occurred: {str(e)}")
    
    # Current date info
    today = timezone.now().date()
    current_month = today.month
    current_year = today.year
    days_in_month = calendar.monthrange(current_year, current_month)[1]
    
    # Today's appointments
    todays_only_appointments = UserBooking.objects.filter(
        doctor=doctor,
        selected_date=today
    ).order_by('selected_time')
    
    # Count of today's appointments only (not future dates)
    today_count = todays_only_appointments.count()
    
    # Check if there are appointments specifically for today
    today_has_appointments = today_count > 0
    
    # All appointments query (which may include future dates if needed)
    todays_appointments = todays_only_appointments
    
    # If today has no appointments, use all future appointments without slicing yet
    if not today_has_appointments:
        print("No appointments found for today's date. Getting ALL future appointments...")
        todays_appointments = UserBooking.objects.filter(
            doctor=doctor,
            selected_date__gte=today
        ).order_by('selected_date', 'selected_time')  # Remove the slice [:10]
    
    # Debug: Print all appointments for today to check data
    print(f"Today's appointments for doctor {doctor.name}:")
    if not todays_appointments:
        print("WARNING: No appointments found for today. This is likely why nothing is showing in the dashboard.")
    for app in todays_appointments[:10]:  # Only print the first 10 for debugging
        print(f" - {app.id}: {app.full_name} at {app.selected_time}, status: {app.status}")
    
    all_appointments_count = todays_appointments.count()
    
    print(f"Server's current date: {today}")
    print(f"Formatted as: {today.strftime('%Y-%m-%d')}")
    
   
    upcoming_appointments = UserBooking.objects.filter(
        doctor=doctor,
        status__in=['confirmed', 'pending']
    ).filter(
        Q(selected_date__gt=today)
    ).order_by('selected_date', 'selected_time')
    
    upcoming_count = upcoming_appointments.count()
    
    print(f"Upcoming appointments count (future dates only): {upcoming_count}")
    for app in upcoming_appointments[:5]:  # Show first 5 for debugging
        print(f" - Upcoming: {app.id}: {app.full_name} on {app.selected_date} at {app.selected_time}, status: {app.status}")
    
    completed_appointments = todays_appointments.filter(status='completed')
    completed_count = completed_appointments.count()
    
    in_progress_appointments = todays_appointments.filter(status='in_progress')
    in_progress_count = in_progress_appointments.count()

    todays_appointments_display = todays_appointments[:10]  
    
    yesterday = today - timedelta(days=1)
    yesterday_count = UserBooking.objects.filter(doctor=doctor, selected_date=yesterday).count()
    
    # Calculate percentage change from yesterday
    if yesterday_count > 0:
        appointment_change_pct = ((today_count - yesterday_count) / yesterday_count) * 100
    else:
        appointment_change_pct = 0 if today_count == 0 else 100
    
    # Today's earnings - Make sure consultation_fee is a numeric field
    todays_earnings = UserBooking.objects.filter(
        doctor=doctor,
        selected_date=today,
        status__in=['confirmed', 'completed', 'in_progress']
    ).aggregate(Sum('consultation_fee'))['consultation_fee__sum'] or 0
    
    # Yesterday's earnings for comparison
    yesterday_earnings = UserBooking.objects.filter(
        doctor=doctor,
        selected_date=yesterday,
        status__in=['confirmed', 'completed', 'in_progress']
    ).aggregate(Sum('consultation_fee'))['consultation_fee__sum'] or 0
    
    # Calculate percentage change in earnings
    if yesterday_earnings > 0:
        earnings_change_pct = ((todays_earnings - yesterday_earnings) / yesterday_earnings) * 100
    else:
        earnings_change_pct = 0 if todays_earnings == 0 else 100
    
    # Monthly earnings
    first_day_of_month = today.replace(day=1)
    monthly_earnings = UserBooking.objects.filter(
        doctor=doctor,
        selected_date__gte=first_day_of_month,
        selected_date__lte=today,
        status__in=['confirmed', 'completed', 'in_progress']
    ).aggregate(Sum('consultation_fee'))['consultation_fee__sum'] or 0
    
    # Last month's earnings for comparison
    last_month = first_day_of_month - timedelta(days=1)
    first_day_last_month = last_month.replace(day=1)
    last_month_earnings = UserBooking.objects.filter(
        doctor=doctor,
        selected_date__gte=first_day_last_month,
        selected_date__lte=last_month,
        status__in=['confirmed', 'completed', 'in_progress']
    ).aggregate(Sum('consultation_fee'))['consultation_fee__sum'] or 0
    
    # Calculate percentage change in monthly earnings
    if last_month_earnings > 0:
        monthly_change_pct = ((monthly_earnings - last_month_earnings) / last_month_earnings) * 100
    else:
        monthly_change_pct = 0 if monthly_earnings == 0 else 100
    
    # Current rating from Doctor model
    current_rating = float(doctor.rating) if doctor.rating else 4.5
    
    # For rating change, we'll calculate an estimated change based on recent reviews
    # This is a placeholder; in a real app, you'd have a table tracking rating changes
    rating_change = 0.1  # This would typically come from comparing current rating with previous period
    
    # Count monthly patients
    monthly_patients = UserBooking.objects.filter(
        doctor=doctor,
        selected_date__gte=first_day_of_month,
        selected_date__lte=today
    ).values('user').distinct().count()
    
    # Last month patients for comparison
    last_month_patients = UserBooking.objects.filter(
        doctor=doctor,
        selected_date__gte=first_day_last_month,
        selected_date__lte=last_month
    ).values('user').distinct().count()
    
    # Calculate percentage change in monthly patients
    if last_month_patients > 0:
        patient_change_pct = ((monthly_patients - last_month_patients) / last_month_patients) * 100
    else:
        patient_change_pct = 0 if monthly_patients == 0 else 100
    
    # Patient queue - patients with appointments in the next hour or waiting up to 30 min
    now = timezone.now()
    time_30_min_ago = (now - timedelta(minutes=30)).time()
    time_60_min_ahead = (now + timedelta(minutes=60)).time()
    
    # Handle time edge cases (crossing midnight)
    if time_30_min_ago > time_60_min_ahead:
        # If we're crossing midnight, we need two queries
        queue_patients_before_midnight = UserBooking.objects.filter(
            doctor=doctor,
            selected_date=today,
            status='confirmed',
            selected_time__gte=time_30_min_ago
        )
        queue_patients_after_midnight = UserBooking.objects.filter(
            doctor=doctor,
            selected_date=today + timedelta(days=1),
            status='confirmed',
            selected_time__lte=time_60_min_ahead
        )
        waiting_patients = list(queue_patients_before_midnight) + list(queue_patients_after_midnight)
        waiting_patients.sort(key=lambda x: x.selected_time)
    else:
        waiting_patients = UserBooking.objects.filter(
            doctor=doctor,
            selected_date=today,
            status='confirmed',
            selected_time__gte=time_30_min_ago,
            selected_time__lte=time_60_min_ahead
        ).order_by('selected_time')
    
    # Format queue patients with waiting time
    waiting_patients_data = []
    now = timezone.now()
    for booking in waiting_patients:
        # Create datetime objects for comparison
        appointment_time = datetime.combine(booking.selected_date, booking.selected_time)
        appointment_datetime = timezone.make_aware(appointment_time)
        
        time_diff = now - appointment_datetime if now > appointment_datetime else appointment_datetime - now
        minutes_diff = int(time_diff.total_seconds() / 60)
        
        if now > appointment_datetime:
            wait_time = f"Waiting {minutes_diff} min"
        else:
            wait_time = f"In {minutes_diff} min"
            
        # Check if this is the patient's first booking
        is_new = UserBooking.objects.filter(user=booking.user).count() <= 1
        
        # Format the patient's name
        patient_name = booking.full_name
        if not patient_name and booking.user:
            patient_name = f"{booking.user.first_name} {booking.user.last_name}".strip()
            if not patient_name:
                patient_name = booking.user.username
                
        waiting_patients_data.append({
            'id': booking.id,
            'name': patient_name,
            'wait_time': wait_time,
            'is_new': is_new
        })
    
    # Get current month and year for calendar
    current_month_year = today.strftime('%B %Y')
    
    # Calendar events - real appointments for this month
    month_start = today.replace(day=1)
    if month_start.month == 12:
        month_end = datetime(month_start.year + 1, 1, 1) - timedelta(days=1)
    else:
        month_end = datetime(month_start.year, month_start.month + 1, 1) - timedelta(days=1)
    
    # Get all appointments for this month
    month_appointments = UserBooking.objects.filter(
        doctor=doctor,
        selected_date__gte=month_start,
        selected_date__lte=month_end
    )
    
    # Debug: Print all month appointments to check data
    print(f"Month appointments for doctor {doctor.name}:")
    if not month_appointments:
        print("WARNING: No appointments found for this month. Calendar will be empty.")
    for app in month_appointments:
        print(f" - {app.id}: {app.full_name} on {app.selected_date}, status: {app.status}")
    
    # Format as calendar events
    calendar_events = []
    for booking in month_appointments:
        # Ensure full_name is never empty
        display_name = booking.full_name
        if not display_name and booking.user:
            display_name = f"{booking.user.first_name} {booking.user.last_name}".strip()
            if not display_name:
                display_name = booking.user.username
        
        calendar_events.append({
            'id': booking.id,
            'title': display_name,
            'date': booking.selected_date.strftime('%Y-%m-%d'),
            'time': booking.selected_time.strftime('%H:%M'),
            'status': booking.status
        })
    
    # ===== CHART DATA =====
    
    # 1. Appointments data for the last 7 days
    appointments_data = []
    days_data = []
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        count = UserBooking.objects.filter(
            doctor=doctor,
            selected_date=date
        ).count()
        appointments_data.append(count)
        days_data.append(date.strftime('%d %b'))
    
    # 2. Earnings data for the last 7 days
    earnings_data = []
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        earnings = UserBooking.objects.filter(
            doctor=doctor,
            selected_date=date,
            status__in=['confirmed', 'completed', 'in_progress']
        ).aggregate(Sum('consultation_fee'))['consultation_fee__sum'] or 0
        earnings_data.append(float(earnings))
    
    # 3. Monthly data for the last 6 months
    monthly_data = []
    month_names = []
    for i in range(5, -1, -1):
        # Calculate month date
        month_date = today.replace(day=1)
        for _ in range(i):
            # Go back one month
            if month_date.month == 1:
                month_date = month_date.replace(year=month_date.year-1, month=12)
            else:
                month_date = month_date.replace(month=month_date.month-1)
            
        # Calculate month end
        if month_date.month == 12:
            month_end = datetime(month_date.year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = datetime(month_date.year, month_date.month + 1, 1) - timedelta(days=1)
        
        # Get data for the month
        month_earnings = UserBooking.objects.filter(
            doctor=doctor,
            selected_date__gte=month_date,
            selected_date__lte=month_end,
            status__in=['confirmed', 'completed', 'in_progress']
        ).aggregate(Sum('consultation_fee'))['consultation_fee__sum'] or 0
        
        monthly_data.append(float(month_earnings))
        month_names.append(month_date.strftime('%b'))
    
    # 4. Rating data - synthetic data based on booking counts
    rating_data = []
    for i in range(5, -1, -1):
        rating = max(3.5, min(5.0, current_rating - (random.uniform(0, 0.5))))
        rating_data.append(round(rating, 1))
    
    # Serialize data for JavaScript
    appointments_data_json = json.dumps(appointments_data)
    days_data_json = json.dumps(days_data)
    earnings_data_json = json.dumps(earnings_data)
    monthly_data_json = json.dumps(monthly_data)
    month_names_json = json.dumps(month_names)
    rating_data_json = json.dumps(rating_data)
    calendar_events_json = json.dumps(calendar_events)
    
    # Debug: Print the JSON data for calendar events
    print(f"Calendar events JSON: {calendar_events_json}")
    
    # All serialized appointments for debug
    all_serialized = json.dumps([{
        'id': a.id,
        'patient_name': a.full_name or (f"{a.user.first_name} {a.user.last_name}".strip() if a.user else "Unknown"),
        'time': a.selected_time.strftime('%H:%M'),
        'status': a.status,
        'type': a.consultation_type.name if a.consultation_type else 'General'
    } for a in todays_appointments_display])
    
    # Debug: Print all serialized appointments
    print(f"All serialized appointments: {all_serialized}")
    
    # Add queue patients to serialized_appointments
    # Convert both to lists before combining them
    all_appointments_with_queue = list(todays_appointments_display) + list(waiting_patients)
    
    # Extended serialized data for all appointments including queue patients
    all_serialized_extended = json.dumps([{
        'id': a.id,
        'patient_name': a.full_name or (f"{a.user.first_name} {a.user.last_name}".strip() if a.user else "Unknown"),
        'time': a.selected_time.strftime('%H:%M'),
        'status': a.status,
        'type': a.consultation_type.name if a.consultation_type else 'General'
    } for a in all_appointments_with_queue])
    
    context = {
        'doctor': doctor,
        'today_date': today.strftime('%A, %B %d, %Y'),
        'today': today,  # Raw date object for template comparisons
        'current_month_year': current_month_year,
        
        # Stats cards data - use today_count for Today's Appointments card
        'today_appointments_count': today_count,  # Changed from all_appointments_count to today_count
        'appointment_change_pct': appointment_change_pct,
        'earnings_today': todays_earnings,
        'earnings_change_pct': earnings_change_pct,
        'monthly_earnings': monthly_earnings,
        'monthly_change_pct': monthly_change_pct,
        'current_rating': current_rating,
        'rating_change': rating_change,
        'monthly_patients': monthly_patients,
        'patient_change_pct': patient_change_pct,
        
        # Appointment data
        'all_appointments': todays_appointments_display,
        'upcoming_appointments': upcoming_appointments[:10],  # Also limit these to 10
        'completed_appointments': completed_appointments[:10],  # Limit to 10
        'in_progress_appointments': in_progress_appointments[:10],  # Limit to 10
        'all_count': all_appointments_count,
        'today_count': today_count,  # Count of only today's appointments
        'upcoming_count': upcoming_count,
        'completed_count': completed_count,
        'in_progress_count': in_progress_count,
        'today_has_appointments': today_has_appointments,  # Flag to indicate if there are appointments specifically for today
        
        # Patient queue
        'waiting_patients': waiting_patients_data,
        
        # Chart data
        'appointments_data': appointments_data_json,
        'days_data': days_data_json,
        'earnings_data': earnings_data_json,
        'monthly_data': monthly_data_json,
        'month_names': month_names_json,
        'rating_data': rating_data_json,
        'calendar_events': calendar_events_json,
        'serialized_appointments': all_serialized_extended
    }
    
    return render(request, 'doc_dashboard.html', context)

@login_required
def book_view(request):
    # Initialize reschedule data variable at the beginning of the function
    reschedule_data = request.session.get('reschedule_booking', {})
    
    # Debug all request parameters
    print("\n" + "=" * 80)
    print("BOOK VIEW DEBUG")
    print(f"Request method: {request.method}")
    print("GET parameters:")
    for key, value in request.GET.items():
        print(f"  {key}: {value}")
    print("POST parameters:")
    for key, value in request.POST.items():
        print(f"  {key}: {value}")
    print("Session data:")
    for key, value in request.session.items():
        print(f"  {key}: {value}")
    print("=" * 80 + "\n")
    
    countries = [
        {"name": "India", "code": "+91"},
    ]
    random.shuffle(countries)
    selected_countries = countries[:10]
    # Unique cities from doctors
    cities = Doctor.objects.values_list('city', flat=True).distinct()[:10]

    services = ConsultationType.objects.all()
    
    if request.method == 'POST':
        # Extra validation for service_id
        service_id = request.POST.get('service_id')
        
        if not service_id:
            messages.error(request, "Please select a service type before proceeding")
            return render(request, 'book.html', {
                'services': services,
                'countries': selected_countries,
                'cities': cities,
                'reschedule_mode': bool(reschedule_data),
                'reschedule_data': reschedule_data,
                'service_name': "Select a service"
            })
            
        # Extract form data
        full_name = request.POST.get('full_name')
        phone_number = request.POST.get('phone_number','6284664155')
        email = request.POST.get('email')
        
        # Handle age conversion properly
        age_str = request.POST.get('age', '19')
        try:
            age = int(age_str)
        except (ValueError, TypeError):
            age = 19  # Default value if conversion fails
            
        gender = request.POST.get('gender','Male')
        city = request.POST.get('city')
        
        # Required field validation
        if not all([full_name, phone_number, email, city]):
            if not full_name:
                messages.error(request, "Full name is required")
            if not phone_number:
                messages.error(request, "Phone number is required")
            if not email:
                messages.error(request, "Email is required")
            if not city:
                messages.error(request, "City is required")
            return render(request, 'book.html', {
                'services': services,
                'countries': selected_countries,
                'cities': cities,
                'reschedule_mode': bool(reschedule_data),
                'reschedule_data': reschedule_data,
                'service_name': "Select a service"
            })
        
        # Debug the extracted values
        print(f"Extracted values:")
        print(f"  full_name: {full_name}")
        print(f"  phone_number: {phone_number}")
        print(f"  email: {email}")
        print(f"  age: {age} (from {age_str})")
        print(f"  gender: {gender}")
        print(f"  city: {city}")
        print(f"  service_id: {service_id}")
        
        # Store in session
        request.session['patient_details'] = {
            'full_name': full_name,
            'phone_number': phone_number,
            'email': email,
            'age': age,  # Store the integer value
            'gender': gender,
            'city': city
        }
        
        # Debug what's stored in session
        print(f"Stored in session: {request.session['patient_details']}")
        
        # Redirect to confirm view with needed parameters
        return redirect(f"/confirm/?service_id={service_id}&city={city}")

    # Prepare pre-filled data for service name if in reschedule mode
    service_name = "Select a service"
    if reschedule_data and 'service_id' in reschedule_data:
        try:
            service = ConsultationType.objects.get(id=reschedule_data['service_id'])
            service_name = service.name
        except ConsultationType.DoesNotExist:
            pass

    return render(request, 'book.html', {
        'services': services,
        'countries': selected_countries,
        'cities': cities,
        'reschedule_mode': bool(reschedule_data),
        'reschedule_data': reschedule_data,
        'service_name': service_name
    })

def calculate_platform_fee(user, consultation):
    user_bookings = UserBooking.objects.filter(user=user)

    if user_bookings.count() < 4:
        return 0  # Platform fee waived for the first 4 bookings

    platform_fee = 50  # Default platform fee
    if consultation.requires_referral:
        platform_fee = 50
    if consultation.emergency_specialty:
        platform_fee = 100
    if consultation.requires_referral and consultation.emergency_specialty:
        platform_fee = 150

    return platform_fee



@login_required
def confirm_view(request):
    # Print detailed debug information
    print("\n" + "=" * 80)
    print("CONFIRM VIEW DEBUG")
    print(f"Request method: {request.method}")
    print("GET parameters:")
    for key, value in request.GET.items():
        print(f"  {key}: {value}")
    print("POST parameters:")
    for key, value in request.POST.items():
        print(f"  {key}: {value}")
    print("Session data:")
    for key, value in request.session.items():
        if key not in ['_auth_user_id', '_auth_user_backend', '_auth_user_hash']:  # Skip auth data
            print(f"  {key}: {value}")
    print("=" * 80 + "\n")
    
    # Check if we're in reschedule mode
    reschedule_data = request.session.get('reschedule_booking', {})
    reschedule_mode = bool(reschedule_data)
    
    # Get patient details from session
    patient_details = request.session.get('patient_details', {})
    
    # Debug - print patient details from session
    print("=" * 50)
    print("CONFIRM VIEW CALLED")
    print(f"Request method: {request.method}")
    print("=" * 50)
    print("PATIENT DETAILS FROM SESSION:")
    print(patient_details)
    print("=" * 50)
    
    # Handle initial GET request or form reload - this should be processed first
    service_id = request.GET.get("service_id") or request.POST.get("service_id")
    user_city = request.GET.get("city") or request.POST.get("city", "")  # Provide default empty string
    full_name = request.POST.get("full_name", "")
    
    # If reschedule mode, pre-fill form with stored data
    if reschedule_mode:
        service_id = reschedule_data.get('service_id', service_id)
        user_city = reschedule_data.get('city', user_city)
        full_name = reschedule_data.get('full_name', full_name)
    
    try:
        if not service_id:
            messages.error(request, "Service type is required")
            return redirect("book")  # Redirect to a safe page
        
        # Print available consultation type IDs for debugging
        available_ids = list(ConsultationType.objects.values_list('id', flat=True))
        print(f"Available ConsultationType IDs: {available_ids}")
        print(f"Requested service_id: {service_id}")
        
        # Validate service_id
        try:
            service_id = int(service_id)
            if not ConsultationType.objects.filter(id=service_id).exists():
                messages.error(request, f"Service type with ID {service_id} does not exist.")
                # Redirect to a safe page with a list of valid services
                return redirect("book")
        except ValueError:
            messages.error(request, f"Invalid service ID format: {service_id}")
            return redirect("book")
        
        # Now safely get the consultation type
        consultation = ConsultationType.objects.get(id=service_id)
        
        # Use filter() with a conditional on city to avoid empty results
        doctor_query = Doctor.objects.filter(consultation_type=consultation)
        if user_city:
            doctor_query = doctor_query.filter(city=user_city)
        
        doctors = doctor_query
        
        # Pre-select the previous doctor if in reschedule mode
        if reschedule_mode:
            doctor_id = reschedule_data.get('doctor_id')
            if doctor_id:
                for doctor in doctors:
                    if doctor.id == int(doctor_id):
                        doctor.preselected = True
                        break
        
        # If no doctors found, provide a useful message
        if not doctors.exists():
            messages.warning(request, "No doctors found for the selected criteria")
        
        # Time slots with defensive coding
        time_slot_query = TimeSlot.objects.filter(doctor__consultation_type=consultation)
        if user_city:
            time_slot_query = time_slot_query.filter(doctor__city=user_city)
        
        time_slots = time_slot_query
        
        # Handle case where no time slots exist
        if not time_slots.exists():
            messages.warning(request, "No time slots available for the selected criteria")
            morning_slots = []
            afternoon_slots = []
            evening_slots = []
        else:
            unique_slots = time_slots.values("start_time", "end_time").distinct()
            morning_slots = unique_slots.filter(start_time__hour__lt=12)
            afternoon_slots = unique_slots.filter(start_time__hour__gte=12, start_time__hour__lt=17)
            evening_slots = unique_slots.filter(start_time__hour__gte=17)

        platform_fee = calculate_platform_fee(request.user, consultation)
        
        # Skip time slot validation on initial GET request
        if request.method == "GET" and not ("selected_time" in request.GET and "selected_date" in request.GET):
            context = {
                "consultation": consultation,
                "doctors": doctors,
                "morning_slots": morning_slots,
                "afternoon_slots": afternoon_slots,
                "evening_slots": evening_slots,
                "city": user_city,
                "full_name": patient_details.get('full_name', ''),
                "platform_fee": platform_fee,
                "reschedule_mode": reschedule_mode,
                # Add gender and age to the context
                "gender": patient_details.get('gender', 'Male'),
                "age": patient_details.get('age', 19),
            }
            return render(request, "confirm.html", context)
    
    except Exception as e:
        # More detailed error
        import traceback
        error_details = traceback.format_exc()
        print(f"Error loading page: {str(e)}\n{error_details}")
        messages.error(request, f"Error loading page: {str(e)}")
        return redirect("book")  # Changed from "myApp" to "book"
    
    # Now handle POST requests
    if request.method == "POST":
        form_action = request.POST.get("form_action")
        print("=" * 50)
        print(f"POST request received in confirm_view")
        print(f"form_action: {form_action}")
        print(f"All POST fields: {list(request.POST.keys())}")
        print(f"POST data: {request.POST}")
        print("=" * 50)
        
        # Step 1: Handle confirmation prompt
        if form_action == "confirm_booking_prompt":
            print("PROCESSING: confirm_booking_prompt") 
            full_name = request.POST.get("full_name")
            service_id = request.POST.get("service_id")
            doctor_id = request.POST.get("doctor_id")
            selected_date = request.POST.get("selected_date")
            selected_time = request.POST.get("selected_time")
            
            # Debug information
            print(f"Confirmation prompt data: {full_name}, {service_id}, {doctor_id}, {selected_date}, {selected_time}")

            # Validate all required fields
            if not all([full_name, service_id, doctor_id, selected_date, selected_time]):
                messages.error(request, "All booking fields are required.")
                return redirect("confirm")  # Use the correct URL name here

            # Prepare context for confirmation prompt
            try:
                # Check if ConsultationType exists
                try:
                    service_id = int(service_id)
                except ValueError:
                    messages.error(request, f"Invalid service ID format: {service_id}")
                    return redirect("book")
                
                # Print available consultation type IDs for debugging
                available_ids = list(ConsultationType.objects.values_list('id', flat=True))
                print(f"Available ConsultationType IDs: {available_ids}")
                print(f"Requested service_id: {service_id}")
                
                if not ConsultationType.objects.filter(id=service_id).exists():
                    messages.error(request, f"Service type with ID {service_id} does not exist.")
                    return redirect("book")
                    
                consultation_type = ConsultationType.objects.get(id=service_id)
                
                # Check if Doctor exists
                try:
                    doctor_id = int(doctor_id)
                except ValueError:
                    messages.error(request, f"Invalid doctor ID format: {doctor_id}")
                    return redirect("book")
                
                if not Doctor.objects.filter(id=doctor_id).exists():
                    messages.error(request, f"Doctor with ID {doctor_id} does not exist.")
                    return redirect("book")
                    
                doctor = Doctor.objects.get(id=doctor_id)
                
                platform_fee = calculate_platform_fee(request.user, consultation_type)
                consultation_fee = doctor.consultation_fee if doctor.consultation_fee is not None else 0
                total_amount = float(consultation_fee) + float(platform_fee)

                context = {
                    "confirmation_prompt": True,
                    "full_name": full_name,
                    "consultation_type": consultation_type,
                    "doctor": doctor,
                    "selected_date": selected_date,
                    "selected_time": selected_time,
                    "platform_fee": platform_fee,
                    "consultation_fee": consultation_fee,
                    "total_amount": total_amount,
                    "reschedule_mode": reschedule_mode,
                    # Pass gender and age from patient_details
                    "gender": patient_details.get('gender', 'Male'),
                    "age": patient_details.get('age', 19),
                }
                return render(request, "confirm.html", context)
            except Exception as e:
                import traceback
                error_details = traceback.format_exc()
                print(f"Error preparing confirmation: {str(e)}\n{error_details}")
                messages.error(request, f"Error preparing confirmation: {str(e)}")
                return redirect("confirm")  # Use the correct URL name

        # Handle initial submission from book.html
        elif form_action == "initial_book_submission":
            print("PROCESSING: initial_book_submission")
            # Extract form data from book page
            full_name = request.POST.get("full_name")
            service_id = request.POST.get("service_id")
            email = request.POST.get("email")
            phone_number = request.POST.get("phone_number")
            age = request.POST.get("age", "19")
            gender = request.POST.get("gender", "Male")
            city = request.POST.get("city")
            
            # Validate all required fields
            if not all([service_id, full_name]):
                messages.error(request, "Service type and full name are required.")
                return redirect("book")
                
            # Store in session for later use
            request.session['patient_details'] = {
                'full_name': full_name,
                'phone_number': phone_number,
                'email': email,
                'age': int(age) if age.isdigit() else 19,
                'gender': gender,
                'city': city
            }
            
            # Continue processing like a GET request
            print(f"Continuing with initial book submission, service_id={service_id}, city={city}")
            
            # Return the normal confirm page with doctors list
            try:
                service_id = int(service_id)
                consultation = ConsultationType.objects.get(id=service_id)
                
                doctor_query = Doctor.objects.filter(consultation_type=consultation)
                if city:
                    doctor_query = doctor_query.filter(city=city)
                    
                doctors = doctor_query
                
                # Pre-select the previous doctor if in reschedule mode
                if reschedule_mode:
                    doctor_id = reschedule_data.get('doctor_id')
                    if doctor_id:
                        for doctor in doctors:
                            if doctor.id == int(doctor_id):
                                doctor.preselected = True
                                break
                
                # If no doctors found, provide a useful message
                if not doctors.exists():
                    messages.warning(request, "No doctors found for the selected criteria")
                
                # Time slots with defensive coding
                time_slot_query = TimeSlot.objects.filter(doctor__consultation_type=consultation)
                if city:
                    time_slot_query = time_slot_query.filter(doctor__city=city)
                
                time_slots = time_slot_query
                
                # Handle case where no time slots exist
                if not time_slots.exists():
                    messages.warning(request, "No time slots available for the selected criteria")
                    morning_slots = []
                    afternoon_slots = []
                    evening_slots = []
                else:
                    unique_slots = time_slots.values("start_time", "end_time").distinct()
                    morning_slots = unique_slots.filter(start_time__hour__lt=12)
                    afternoon_slots = unique_slots.filter(start_time__hour__gte=12, start_time__hour__lt=17)
                    evening_slots = unique_slots.filter(start_time__hour__gte=17)
                
                platform_fee = calculate_platform_fee(request.user, consultation)
                
                context = {
                    "consultation": consultation,
                    "doctors": doctors,
                    "morning_slots": morning_slots,
                    "afternoon_slots": afternoon_slots,
                    "evening_slots": evening_slots,
                    "city": city,
                    "full_name": full_name,
                    "platform_fee": platform_fee,
                    "reschedule_mode": reschedule_mode,
                    "gender": gender,
                    "age": age,
                }
                return render(request, "confirm.html", context)
            except Exception as e:
                messages.error(request, f"Error processing service request: {str(e)}")
                return redirect("book")
                
        # Step 2: Handle final booking submission
        elif form_action == "final_confirm_booking":
            print("=" * 80)
            print("PROCESSING FINAL BOOKING CONFIRMATION")
            print("=" * 80)
            
            full_name = request.POST.get("full_name")
            service_id = request.POST.get("service_id")
            doctor_id = request.POST.get("doctor_id")
            selected_date = request.POST.get("selected_date")
            selected_time = request.POST.get("selected_time")
            
            # Get gender and age directly from the form
            gender = request.POST.get("gender", "Male")
            age_str = request.POST.get("age", "19")
            
            # Debug information
            print(f"Final confirm data: {full_name}, {service_id}, {doctor_id}, {selected_date}, {selected_time}")
            print(f"Gender from form: {gender}")
            print(f"Age from form: {age_str}")
            print(f"Patient details from session: {patient_details}")
            
            try:
                # Ensure age is an integer
                try:
                    age = int(age_str)
                except (ValueError, TypeError):
                    age = 19  # Default to 19 if conversion fails
                
                # Check if ConsultationType exists
                try:
                    service_id = int(service_id)
                except ValueError:
                    messages.error(request, f"Invalid service ID format: {service_id}")
                    return redirect("book")
                
                if not ConsultationType.objects.filter(id=service_id).exists():
                    messages.error(request, f"Service type with ID {service_id} does not exist.")
                    return redirect("book")
                
                consultation_type = ConsultationType.objects.get(id=service_id)
                
                # Check if Doctor exists
                try:
                    doctor_id = int(doctor_id)
                except ValueError:
                    messages.error(request, f"Invalid doctor ID format: {doctor_id}")
                    return redirect("book")
                
                if not Doctor.objects.filter(id=doctor_id).exists():
                    messages.error(request, f"Doctor with ID {doctor_id} does not exist.")
                    return redirect("book")
                
                doctor = Doctor.objects.get(id=doctor_id)
                
                # Handle both date formats
                try:
                    if '-' in selected_date:  # YYYY-MM-DD format
                        year, month, day = map(int, selected_date.split('-'))
                    else:  # DD/MM/YYYY format
                        day, month, year = map(int, selected_date.split('/'))
                    
                    selected_date_obj = date(year, month, day)
                except ValueError as e:
                    messages.error(request, f"Invalid date format: {selected_date}. Error: {str(e)}")
                    return redirect("confirm")
                
                # Handle time format with better error handling
                try:
                    # Handle time ranges (e.g., "17:00 - 17:30")
                    if " - " in selected_time:
                        start_time = selected_time.split(" - ")[0].strip()
                        selected_time = start_time  # Just use the start time
                    
                    # Try different time formats
                    formats_to_try = ["%H:%M", "%I:%M %p", "%I:%M%p", "%H.%M"]
                    selected_time_obj = None
                    
                    for time_format in formats_to_try:
                        try:
                            selected_time_obj = datetime.strptime(selected_time, time_format).time()
                            break  # Stop if a format works
                        except ValueError:
                            continue
                    
                    if not selected_time_obj:
                        raise ValueError(f"Could not parse time: {selected_time}")
                except Exception as e:
                    messages.error(request, f"Invalid time format: {selected_time}. Error: {str(e)}")
                    return redirect("confirm")

                # Calculate fees
                platform_fee = calculate_platform_fee(request.user, consultation_type)
                consultation_fee = doctor.consultation_fee if doctor.consultation_fee is not None else 0
                total_amount = float(consultation_fee) + float(platform_fee)

                # Handle reschedule if in reschedule mode
                if reschedule_mode:
                    try:
                        booking = UserBooking.objects.get(id=reschedule_data['booking_id'], user=request.user)
                        
                        # Debug logging for reschedule
                        print(f"Rescheduling booking {booking.id}")
                        print(f"Patient details from session: {patient_details}")
                        print(f"Age: {patient_details.get('age', 0)}")
                        print(f"Gender: {patient_details.get('gender', 'Not specified')}")
                        print(f"Phone: {patient_details.get('phone_number', '')}")
                        
                        # Mark previously booked time slot as available
                        try:
                            old_time_slot = TimeSlot.objects.get(
                                doctor=booking.doctor,
                                start_time=booking.selected_time,
                                is_available=False
                            )
                            old_time_slot.is_available = True
                            old_time_slot.save()
                        except TimeSlot.DoesNotExist:
                            pass
                        
                        # Mark new time slot as unavailable
                        try:
                            new_time_slot = TimeSlot.objects.get(
                                doctor=doctor,
                                start_time=selected_time_obj,
                                is_available=True
                            )
                            new_time_slot.is_available = False
                            new_time_slot.save()
                        except TimeSlot.DoesNotExist:
                            messages.warning(request, "Selected time slot might not be available anymore.")
                        
                        booking.full_name = full_name
                        booking.consultation_type = consultation_type
                        booking.doctor = doctor
                        booking.selected_date = selected_date_obj
                        booking.selected_time = selected_time_obj
                        booking.consultation_fee = consultation_fee
                        booking.platform_fee = platform_fee
                        booking.total_amount = total_amount
                        # Explicitly set these fields from patient_details
                        # Ensure age is an integer
                        try:
                            age = int(patient_details.get('age', 19))  # Default to 19
                        except (ValueError, TypeError):
                            age = 19  # Default to 19 if conversion fails
                        
                        # Ensure gender has a value
                        gender = patient_details.get('gender', 'Male')
                        if not gender:
                            gender = 'Male'
                        
                        booking.age = age
                        booking.gender = gender
                        booking.phone_number = patient_details.get('phone_number', '')
                        booking.save()
                        
                        # Clear reschedule data from session
                        if 'reschedule_booking' in request.session:
                            del request.session['reschedule_booking']
                            request.session.modified = True
                        
                        messages.success(request, "Your appointment has been rescheduled successfully.")
                        return redirect('myApp')
                    except UserBooking.DoesNotExist:
                        messages.error(request, "Unable to reschedule appointment. Please try again.")
                        return redirect('myApp')
                else:
                    # Create booking (regular flow)
                    # Debug logging for patient details
                    print("\n" + "=" * 80)
                    print("FINAL BOOKING CONFIRMATION PROCESS STARTING")
                    print("=" * 80)
                    print(f"User: {request.user.username} (ID: {request.user.id})")
                    print(f"Patient details from session: {patient_details}")
                    print(f"Age: {patient_details.get('age', 19)}")
                    print(f"Gender: {patient_details.get('gender', 'Male')}")
                    print(f"Phone: {patient_details.get('phone_number', '')}")
                    
                    # Final debug check
                    print("\nFINAL VALUES FOR BOOKING:")
                    print(f"  Full Name: {full_name}")
                    print(f"  Service: {consultation_type.name} (ID: {service_id})")
                    print(f"  Doctor: {doctor.name} (ID: {doctor_id})")
                    print(f"  Date: {selected_date_obj} (Original input: {selected_date})")
                    print(f"  Time: {selected_time_obj} (Original input: {selected_time})")
                    print(f"  Age: {age} (Original input: {age_str})")
                    print(f"  Gender: {gender}")
                    print(f"  Phone: {patient_details.get('phone_number', '')}")
                    print(f"  Fees - Consultation: {consultation_fee}, Platform: {platform_fee}, Total: {total_amount}")
                    
                    try:
                        print("\nAttempting to create UserBooking object...")
                        booking = UserBooking.objects.create(
                            user=request.user,
                            consultation_type=consultation_type,
                            doctor=doctor,
                            selected_date=selected_date_obj,
                            selected_time=selected_time_obj,
                            consultation_fee=consultation_fee,
                            platform_fee=platform_fee,
                            total_amount=total_amount,
                            full_name=full_name,
                            # Add these fields from patient_details with more natural default values
                            age=age,
                            gender=gender,
                            phone_number=patient_details.get('phone_number', ''),
                            status='confirmed'  # Set default status
                        )
                        
                        # Debug info - verify what was saved
                        print("\nSUCCESS: Created booking with details:")
                        print(f"  Booking ID: {booking.id}")
                        print(f"  Full Name: {booking.full_name}")
                        print(f"  Age: {booking.age}")
                        print(f"  Gender: {booking.gender}")
                        print(f"  Phone: {booking.phone_number}")
                        print(f"  Status: {booking.status}")
                        print("About to render success template")
                        print("=" * 80 + "\n")
                    except Exception as e:
                        print(f"\nERROR: Failed to create booking object: {str(e)}")
                        raise e  # Re-raise to be caught by outer exception handler

                    context = {
                        "success": True,
                        "booking": booking,
                    }
                    return render(request, "confirm.html", context)

            except Exception as e:
                # Detailed error message
                import traceback
                error_details = traceback.format_exc()
                print(f"Error creating booking: {str(e)}\n{error_details}")
                messages.error(request, f"Error creating booking: {str(e)}")
                return redirect("confirm")

        # Handle the case when a POST request doesn't have a valid form_action
        else:
            print("POST request received without a valid form_action")
            # Get consultation type and render the confirm page
            try:
                # This might be a direct form submission from book.html, so handle it appropriately
                consultation = ConsultationType.objects.get(id=service_id)
                
                context = {
                    "consultation": consultation,
                    "doctors": doctors,
                    "morning_slots": morning_slots,
                    "afternoon_slots": afternoon_slots,
                    "evening_slots": evening_slots,
                    "city": user_city,
                    "full_name": patient_details.get('full_name', ''),
                    "platform_fee": platform_fee,
                    "reschedule_mode": reschedule_mode,
                    "gender": patient_details.get('gender', 'Male'),
                    "age": patient_details.get('age', 19),
                }
                return render(request, "confirm.html", context)
            except Exception as e:
                messages.error(request, f"Error processing your request: {str(e)}")
                return redirect("book")

@login_required
def myApp_view(request):
    """View to display the user's appointments with reschedule and cancel functionality."""
    # Check if there's reschedule data in the session
    reschedule_data = request.session.get('reschedule_booking', {})
    
    # Get patient details from session
    patient_details = request.session.get('patient_details', {})
    
    # Handle POST requests for cancellation
    if request.method == 'POST' and 'cancel_booking' in request.POST:
        booking_id = request.POST.get('booking_id')
        try:
            booking = UserBooking.objects.get(id=booking_id, user=request.user)
            booking.delete()
            messages.success(request, "Your appointment has been cancelled successfully.")
        except UserBooking.DoesNotExist:
            messages.error(request, "Unable to cancel appointment. Please try again.")
        return redirect('myApp')
    
    # Get all appointments for the current user (both pending and confirmed)
    today = date.today()
    bookings = UserBooking.objects.filter(
        user=request.user,
        selected_date__gte=today
    ).order_by('selected_date', 'selected_time')
   
    # Count upcoming appointments
    upcoming_count = bookings.count()
   
    # Format today's date for display
    today_display = datetime.now().strftime("%A, %B %d, %Y")
   
    # Process bookings to match the format expected in the template
    appointments = []
    for booking in bookings:
        # Debug info to see what's stored in the booking
        print(f"Booking {booking.id} details:")
        print(f"  Full name: {booking.full_name}")
        print(f"  Age: {booking.age}")
        print(f"  Gender: {booking.gender}")
        print(f"  Phone: {booking.phone_number}")
        
        # Check if this booking is currently being rescheduled
        is_being_rescheduled = (reschedule_data and 
                              'booking_id' in reschedule_data and 
                              int(reschedule_data['booking_id']) == booking.id)
        
        # Create appointment object with all required data for the template
        appointment = {
            'id': f"APT-{booking.created_at.year}-{booking.id:03d}",
            'booking_id': booking.id,  # Add the actual booking ID for form submission
            'type': booking.consultation_type.name,
            'fees': booking.consultation_fee,
            'date': booking.selected_date,
            'time': booking.selected_time.strftime('%I:%M %p'),
            'doctor': {
                'name': booking.doctor.name,
                'specialty': booking.consultation_type.name,
                'department': f"{booking.consultation_type.name} Department",
            },
            'patient': {
                # Use booking values first, then fall back to patient_details, then user info
                'name': booking.full_name or patient_details.get('full_name') or request.user.get_full_name() or request.user.username,
                'age': booking.age or patient_details.get('age', 19),
                'gender': booking.gender or patient_details.get('gender', 'Male'),
                'city': booking.doctor.city or patient_details.get('city', ''),
                'phone': booking.phone_number or patient_details.get('phone_number', ''),
            },
            'location': booking.doctor.clinic or 'Hospital',
            'is_being_rescheduled': is_being_rescheduled,
        }
        appointments.append(appointment)
   
    context = {
        'appointments': appointments,
        'upcoming_count': upcoming_count,
        'today_date': today_display,
        'reschedule_mode': bool(reschedule_data),
        'reschedule_booking_id': reschedule_data.get('booking_id') if reschedule_data else None,
    }
   
    return render(request, 'myApp.html', context)


@login_required
def reschedule_appointment(request, booking_id):
    """Handle reschedule functionality"""
    booking = get_object_or_404(UserBooking, id=booking_id, user=request.user)
    
    # Store booking data in session to pre-fill the forms
    request.session['reschedule_booking'] = {
        'booking_id': booking.id,
        'full_name': booking.full_name,
        'phone_number': booking.phone_number,
        'email': booking.user.email,
        'age': booking.age,
        'gender': booking.gender,
        'city': booking.doctor.city,
        'service_id': booking.consultation_type.id,
        'doctor_id': booking.doctor.id,
    }
    
    # Also populate the patient_details for consistency
    request.session['patient_details'] = {
        'full_name': booking.full_name,
        'phone_number': booking.phone_number,
        'email': booking.user.email,
        'age': booking.age,
        'gender': booking.gender,
        'city': booking.doctor.city,
    }
    
    # Redirect to the booking page
    return redirect('book')

@login_required
def profile_view(request):
    
    profile, created = UserProfile.objects.get_or_create(id=request.user)
    
    if request.method == 'POST':
        # Update fields from form data
        profile.full_name = request.POST.get('full_name', '')
        profile.email = request.POST.get('email', '') 
        
        # Handle numeric fields
        age = request.POST.get('age')
        if age:
            try:
                profile.age = int(age)
            except ValueError:
                # Handle invalid age input
                pass
        
        # Handle date of birth - Django needs a date object
        dob = request.POST.get('date_of_birth')
        if dob:
            profile.date_of_birth = dob
        
        # Other personal info
        profile.gender = request.POST.get('gender', '')
        profile.blood_type = request.POST.get('blood_type', '')
        
        # Contact information
        profile.primary_phone = request.POST.get('primary_phone', '')
        profile.address_line1 = request.POST.get('address_line1', '')
        profile.city = request.POST.get('city', '')
        profile.state = request.POST.get('state', '')
        profile.pin_code = request.POST.get('zip_code', '')
        profile.emergency_contact_name = request.POST.get('emergency_contact_name', '')
        profile.emergency_contact_phone = request.POST.get('emergency_contact_phone', '')
        profile.emergency_contact_email = request.POST.get('emergency_contact_email', '')
        profile.emergency_contact_relationship = request.POST.get('emergency_contact_relationship', '')
        
        # Save all changes
        profile.save()
        
        # Update the user's email if it changed
        if request.user.email != profile.email:
            request.user.email = profile.email
            request.user.save()
        
        # Redirect back to profile page
        return redirect('profile')
    
    # For the template to access userprofile through user.userprofile
    # We'll use Django's context processor to extend the user object
    request.user.userprofile = profile
    
    return render(request, 'profile.html')


@login_required
def logout_view(request):
    # Clear any session variables we've set
    if 'is_doctor' in request.session:
        del request.session['is_doctor']
    
    # Log the user out
    logout(request)
    
    # Redirect to home page
    return redirect('index')

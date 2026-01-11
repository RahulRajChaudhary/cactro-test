// Configuration
const API_BASE_URL = 'http://localhost:5000';
let currentUser = null;
let currentToken = null;
let autoScrollEnabled = true;

// DOM Elements
const userInfoEl = document.getElementById('userInfo');
const currentTokenEl = document.getElementById('currentToken');
const consoleOutputEl = document.getElementById('consoleOutput');
const apiStatusEl = document.getElementById('apiStatus');
const apiUrlEl = document.getElementById('apiUrl');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAPIHealth();
    loadEvents();
    updateUserInfo();
    
    // Event Listeners
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('eventForm').addEventListener('submit', handleCreateEvent);
    document.getElementById('bookingForm').addEventListener('submit', handleBooking);
    document.getElementById('bookingEventId').addEventListener('change', updateAvailableTickets);
    
    // Load saved token from localStorage
    const savedToken = localStorage.getItem('eventBookingToken');
    if (savedToken) {
        currentToken = savedToken;
        verifyTokenAndLoadUser();
    }
    
    // Simulate background job logs
    simulateBackgroundJobs();
});

// Tab Switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
    // Load data for tab
    if (tabName === 'events') {
        loadEvents();
    } else if (tabName === 'bookings') {
        loadEventsForBooking();
        loadMyBookings();
    }
}

// API Health Check
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        if (data.status === 'OK') {
            apiStatusEl.innerHTML = '<i class="fas fa-circle status-ok"></i> API Connected';
            apiStatusEl.style.color = '#10b981';
            logToConsole('API is connected and healthy', 'success');
        } else {
            apiStatusEl.innerHTML = '<i class="fas fa-circle status-error"></i> API Error';
            apiStatusEl.style.color = '#dc3545';
            logToConsole('API health check failed', 'error');
        }
    } catch (error) {
        apiStatusEl.innerHTML = '<i class="fas fa-circle status-error"></i> API Offline';
        apiStatusEl.style.color = '#dc3545';
        logToConsole('Cannot connect to API. Make sure server is running on port 5000', 'error');
    }
}

// Handle Registration
async function handleRegister(event) {
    event.preventDefault();
    
    const userData = {
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        name: document.getElementById('registerName').value,
        role: document.getElementById('registerRole').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            logToConsole(`Registered successfully as ${userData.role}: ${userData.email}`, 'success');
            alert(`Registration successful! You can now login as ${userData.role}`);
            
            // Clear form
            document.getElementById('registerForm').reset();
            
            // Switch to login tab
            switchTab('auth');
        } else {
            logToConsole(`Registration failed: ${data.message}`, 'error');
            alert(`Registration failed: ${data.message}`);
        }
    } catch (error) {
        logToConsole('Registration error: ' + error.message, 'error');
        alert('Registration failed. Check console for details.');
    }
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    
    const loginData = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentToken = data.token;
            currentUser = data.user;
            
            // Save to localStorage
            localStorage.setItem('eventBookingToken', currentToken);
            localStorage.setItem('eventBookingUser', JSON.stringify(currentUser));
            
            // Update UI
            updateUserInfo();
            currentTokenEl.value = currentToken;
            
            logToConsole(`Logged in as ${currentUser.role}: ${currentUser.email}`, 'success');
            alert(`Welcome ${currentUser.name}! Role: ${currentUser.role}`);
            
            // Clear form
            document.getElementById('loginForm').reset();
            
            // Show appropriate tab based on role
            if (currentUser.role === 'ORGANIZER') {
                switchTab('events');
            } else {
                switchTab('bookings');
            }
        } else {
            logToConsole(`Login failed: ${data.message}`, 'error');
            alert(`Login failed: ${data.message}`);
        }
    } catch (error) {
        logToConsole('Login error: ' + error.message, 'error');
        alert('Login failed. Check console for details.');
    }
}

// Verify Token and Load User
async function verifyTokenAndLoadUser() {
    if (!currentToken) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/events`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        if (response.ok) {
            const savedUser = JSON.parse(localStorage.getItem('eventBookingUser'));
            if (savedUser) {
                currentUser = savedUser;
                updateUserInfo();
                currentTokenEl.value = currentToken;
                logToConsole(`Auto-logged in as ${currentUser.role}`, 'success');
            }
        } else {
            // Token invalid, clear it
            localStorage.removeItem('eventBookingToken');
            localStorage.removeItem('eventBookingUser');
            currentToken = null;
            currentUser = null;
            updateUserInfo();
        }
    } catch (error) {
        // Error fetching, token might be invalid
        localStorage.removeItem('eventBookingToken');
        localStorage.removeItem('eventBookingUser');
        currentToken = null;
        currentUser = null;
        updateUserInfo();
    }
}

// Update User Info Display
function updateUserInfo() {
    if (currentUser) {
        userInfoEl.innerHTML = `
            <i class="fas fa-user"></i> ${currentUser.name} (${currentUser.role})
            <button onclick="logout()" class="btn-logout">
                <i class="fas fa-sign-out-alt"></i>
            </button>
        `;
        
        // Show/hide forms based on role
        const createEventForm = document.getElementById('createEventForm');
        if (currentUser.role === 'ORGANIZER') {
            createEventForm.style.display = 'block';
        } else {
            createEventForm.style.display = 'none';
        }
    } else {
        userInfoEl.textContent = 'Not logged in';
        document.getElementById('createEventForm').style.display = 'none';
    }
}

// Logout
function logout() {
    currentUser = null;
    currentToken = null;
    localStorage.removeItem('eventBookingToken');
    localStorage.removeItem('eventBookingUser');
    updateUserInfo();
    currentTokenEl.value = '';
    logToConsole('Logged out successfully', 'info');
    alert('Logged out successfully');
    switchTab('auth');
}

// Copy Token
function copyToken() {
    if (currentToken) {
        navigator.clipboard.writeText(currentToken);
        alert('Token copied to clipboard!');
        logToConsole('Token copied to clipboard', 'info');
    } else {
        alert('No token available. Please login first.');
    }
}

// Load Events
async function loadEvents() {
    const eventsListEl = document.getElementById('eventsList');
    eventsListEl.innerHTML = '<p class="loading">Loading events...</p>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/events`);
        const data = await response.json();
        
        if (data.success) {
            if (data.data.length === 0) {
                eventsListEl.innerHTML = '<p>No events available. Create one!</p>';
                return;
            }
            
            eventsListEl.innerHTML = '';
            data.data.forEach(event => {
                const eventDate = new Date(event.date).toLocaleString();
                const eventCard = `
                    <div class="event-card">
                        <div class="event-title">
                            <span>${event.title}</span>
                            <span class="event-price">$${event.price.toFixed(2)}</span>
                        </div>
                        <div class="event-details">
                            <span><i class="far fa-calendar"></i> ${eventDate}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                            <span><i class="fas fa-users"></i> ${event.availableTickets}/${event.capacity} tickets</span>
                        </div>
                        <p>${event.description || 'No description'}</p>
                        <div class="event-actions">
                            ${currentUser && currentUser.role === 'CUSTOMER' ? `
                                <button onclick="quickBook('${event.id}', ${event.availableTickets})" 
                                        class="btn btn-success btn-sm">
                                    <i class="fas fa-ticket-alt"></i> Book Now
                                </button>
                            ` : ''}
                            <button onclick="viewEventDetails('${event.id}')" class="btn btn-secondary btn-sm">
                                <i class="fas fa-info-circle"></i> Details
                            </button>
                        </div>
                    </div>
                `;
                eventsListEl.innerHTML += eventCard;
            });
            
            logToConsole(`Loaded ${data.data.length} events`, 'info');
        } else {
            eventsListEl.innerHTML = '<p>Failed to load events</p>';
            logToConsole('Failed to load events: ' + (data.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        eventsListEl.innerHTML = '<p>Error loading events</p>';
        logToConsole('Error loading events: ' + error.message, 'error');
    }
}

// Load Events for Booking Dropdown
async function loadEventsForBooking() {
    const selectEl = document.getElementById('bookingEventId');
    selectEl.innerHTML = '<option value="">-- Select Event --</option>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/events`);
        const data = await response.json();
        
        if (data.success) {
            data.data.forEach(event => {
                const option = document.createElement('option');
                option.value = event.id;
                option.textContent = `${event.title} - $${event.price.toFixed(2)} (${event.availableTickets} available)`;
                option.dataset.available = event.availableTickets;
                selectEl.appendChild(option);
            });
            
            if (data.data.length === 0) {
                selectEl.innerHTML = '<option value="">No events available</option>';
            }
        }
    } catch (error) {
        logToConsole('Error loading events for booking: ' + error.message, 'error');
    }
}

// Update Available Tickets
function updateAvailableTickets() {
    const selectEl = document.getElementById('bookingEventId');
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    const availableTickets = selectedOption ? parseInt(selectedOption.dataset.available) || 0 : 0;
    document.getElementById('availableTickets').textContent = availableTickets;
}

// Handle Create Event
async function handleCreateEvent(event) {
    event.preventDefault();
    
    if (!currentUser || currentUser.role !== 'ORGANIZER') {
        alert('Only organizers can create events');
        return;
    }
    
    const eventData = {
        title: document.getElementById('eventTitle').value,
        description: document.getElementById('eventDescription').value,
        date: document.getElementById('eventDate').value,
        location: document.getElementById('eventLocation').value,
        capacity: parseInt(document.getElementById('eventCapacity').value),
        price: parseFloat(document.getElementById('eventPrice').value)
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(eventData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            logToConsole(`Event created: ${eventData.title}`, 'success');
            alert('Event created successfully!');
            
            // Clear form
            document.getElementById('eventForm').reset();
            
            // Reload events
            loadEvents();
            loadEventsForBooking();
        } else {
            logToConsole(`Event creation failed: ${data.message}`, 'error');
            alert(`Event creation failed: ${data.message}`);
        }
    } catch (error) {
        logToConsole('Event creation error: ' + error.message, 'error');
        alert('Event creation failed. Check console for details.');
    }
}

// Handle Booking
async function handleBooking(event) {
    event.preventDefault();
    
    if (!currentUser || currentUser.role !== 'CUSTOMER') {
        alert('Only customers can book tickets');
        return;
    }
    
    const bookingData = {
        eventId: document.getElementById('bookingEventId').value,
        tickets: parseInt(document.getElementById('bookingTickets').value)
    };
    
    if (!bookingData.eventId) {
        alert('Please select an event');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(bookingData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            logToConsole(`Booking successful! ${bookingData.tickets} tickets booked`, 'success');
            alert(`Booking successful! Total: $${data.data.totalPrice.toFixed(2)}`);
            
            // Simulate background job notification
            setTimeout(() => {
                logToConsole(`📧 [BACKGROUND JOB] Booking confirmation sent to: ${currentUser.email}`, 'info');
                logToConsole(`   Event: ${document.getElementById('bookingEventId').options[document.getElementById('bookingEventId').selectedIndex].text.split(' - ')[0]}`, 'info');
                logToConsole(`   Tickets: ${bookingData.tickets}`, 'info');
            }, 2000);
            
            // Clear form
            document.getElementById('bookingForm').reset();
            document.getElementById('availableTickets').textContent = '0';
            
            // Reload events and bookings
            loadEvents();
            loadEventsForBooking();
            loadMyBookings();
        } else {
            logToConsole(`Booking failed: ${data.message}`, 'error');
            alert(`Booking failed: ${data.message}`);
        }
    } catch (error) {
        logToConsole('Booking error: ' + error.message, 'error');
        alert('Booking failed. Check console for details.');
    }
}

// Quick Book
function quickBook(eventId, availableTickets) {
    if (!currentUser || currentUser.role !== 'CUSTOMER') {
        alert('Please login as customer to book tickets');
        switchTab('auth');
        return;
    }
    
    document.getElementById('bookingEventId').value = eventId;
    document.getElementById('bookingTickets').value = 1;
    document.getElementById('availableTickets').textContent = availableTickets;
    
    switchTab('bookings');
}

// Load My Bookings
async function loadMyBookings() {
    const myBookingsEl = document.getElementById('myBookings');
    
    if (!currentUser || currentUser.role !== 'CUSTOMER') {
        myBookingsEl.innerHTML = '<p>Please login as customer to view bookings</p>';
        return;
    }
    
    myBookingsEl.innerHTML = '<p class="loading">Loading bookings...</p>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/bookings`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.data.length === 0) {
                myBookingsEl.innerHTML = '<p>No bookings yet. Book your first event!</p>';
                return;
            }
            
            myBookingsEl.innerHTML = '';
            data.data.forEach(booking => {
                const bookingDate = new Date(booking.createdAt).toLocaleString();
                const bookingCard = `
                    <div class="booking-card">
                        <div class="event-title">
                            <span>${booking.event.title}</span>
                            <span class="event-price">$${booking.totalPrice.toFixed(2)}</span>
                        </div>
                        <div class="event-details">
                            <span><i class="far fa-calendar"></i> ${new Date(booking.event.date).toLocaleDateString()}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${booking.event.location}</span>
                            <span><i class="fas fa-ticket-alt"></i> ${booking.tickets} tickets</span>
                            <span><i class="fas fa-clock"></i> Booked: ${bookingDate}</span>
                        </div>
                        <div class="event-actions">
                            <button onclick="cancelBooking('${booking.id}')" class="btn btn-secondary btn-sm">
                                <i class="fas fa-times-circle"></i> Cancel
                            </button>
                        </div>
                    </div>
                `;
                myBookingsEl.innerHTML += bookingCard;
            });
            
            logToConsole(`Loaded ${data.data.length} bookings`, 'info');
        } else {
            myBookingsEl.innerHTML = '<p>Failed to load bookings</p>';
            logToConsole('Failed to load bookings: ' + (data.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        myBookingsEl.innerHTML = '<p>Error loading bookings</p>';
        logToConsole('Error loading bookings: ' + error.message, 'error');
    }
}

// Cancel Booking
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            logToConsole('Booking cancelled successfully', 'success');
            alert('Booking cancelled. Tickets have been returned.');
            
            // Reload data
            loadEvents();
            loadEventsForBooking();
            loadMyBookings();
        } else {
            logToConsole(`Cancellation failed: ${data.message}`, 'error');
            alert(`Cancellation failed: ${data.message}`);
        }
    } catch (error) {
        logToConsole('Cancellation error: ' + error.message, 'error');
        alert('Cancellation failed. Check console for details.');
    }
}

// View Event Details
function viewEventDetails(eventId) {
    logToConsole(`Viewing details for event ID: ${eventId}`, 'info');
    alert('Event details feature coming soon!');
}

// Console Functions
function logToConsole(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const typeClass = 'log-' + type;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'console-message';
    messageDiv.innerHTML = `
        <span class="timestamp">[${timestamp}]</span>
        <span class="${typeClass}">${message}</span>
    `;
    
    consoleOutputEl.appendChild(messageDiv);
    
    // Auto-scroll to bottom
    if (autoScrollEnabled) {
        consoleOutputEl.scrollTop = consoleOutputEl.scrollHeight;
    }
}

function clearConsole() {
    consoleOutputEl.innerHTML = '';
    logToConsole('Console cleared', 'info');
}

function toggleAutoScroll() {
    autoScrollEnabled = !autoScrollEnabled;
    const statusEl = document.getElementById('autoScrollStatus');
    statusEl.textContent = autoScrollEnabled ? 'ON' : 'OFF';
    statusEl.style.color = autoScrollEnabled ? '#20c997' : '#dc3545';
    logToConsole(`Auto-scroll ${autoScrollEnabled ? 'enabled' : 'disabled'}`, 'info');
}

// Simulate Background Jobs (for demo)
function simulateBackgroundJobs() {
    const jobTypes = [
        '📧 Processing booking confirmation emails...',
        '📢 Sending event update notifications...',
        '🔄 Cleaning up old job queue entries...',
        '📊 Generating daily booking reports...'
    ];
    
    setInterval(() => {
        // Randomly add background job logs (30% chance)
        if (Math.random() < 0.3) {
            const randomJob = jobTypes[Math.floor(Math.random() * jobTypes.length)];
            logToConsole(`[BACKGROUND] ${randomJob}`, 'info');
        }
    }, 10000); // Every 10 seconds
    
    logToConsole('Background job simulation started', 'success');
}
const express = require('express');
const path = require('path');

const app = express();

// Set EJS as template engine
app.set('view engine', 'ejs');

// Set views folder
app.set('views', path.join(__dirname, 'views'));

// static files
app.use(express.static(path.join(__dirname, 'public')));

// For parsing form data
app.use(express.urlencoded({ extended: true }));

// routes

// Home page
app.get('/', (req, res) => {
	res.render('index');
});

// Doctors / Therapists page
app.get('/therapists', (req, res) => {
	res.render('therapists');
});

// Book Appointment page 
app.get('/book-appointment', (req, res) => {
	const selectedDoctor = req.query.doctor || '';
	res.render('book-appointment', { doctor: selectedDoctor });
});

// Dashboard page
app.get('/dashboard', (req, res) => {
	res.render('dashboard');
});

// Login page
app.get('/login', (req, res) => {
	res.render('login');
});

// Register page
app.get('/register', (req, res) => {
	res.render('register');
});

// Form Handling

// Register form submission
app.post('/register', (req, res) => {
	console.log('Register form data:', req.body);
	res.redirect('/dashboard');
});

// Login form submission
app.post('/login', (req, res) => {
	console.log('Login form data:', req.body);
	res.redirect('/dashboard');
});

// Book Appointment form submission
app.post('/book-appointment', (req, res) => {
	console.log('Appointment booked:', req.body);
	res.redirect('/dashboard');
});

// start server
const PORT = 3000;
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});

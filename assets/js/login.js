import API from "./api.js";
import { redirectTo } from "./app.js";

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");
const passwordToggle = document.querySelector(".password-toggle");

document.addEventListener("DOMContentLoaded", () => {
	if (API.Auth.isLoggedIn()) {
		redirectTo("index.html");
		return;
	}

	if (loginForm) {
		loginForm.addEventListener("submit", handleLogin);
	}

	if (passwordToggle) {
		passwordToggle.addEventListener("click", togglePasswordVisibility);
	}
});

/**
 * Handle login form submission
 * @param {Event} event - Form submit event
 */
async function handleLogin(event) {
	event.preventDefault();

	resetErrors();

	const email = emailInput.value.trim();
	const password = passwordInput.value.trim();

	if (!validateForm(email, password)) {
		return;
	}

	try {
		const response = await API.User.login(email, password);

		API.Auth.login(email, response.user_id);

		redirectTo("index.html");
	} catch (error) {
		console.error("Login failed:", error);

		API.showError(
			error.message ||
				"Login failed. Please check your credentials and try again.",
		);
	}
}

/**
 * Validate login form inputs
 * @param {string} email - Email address
 * @param {string} password - Password
 * @returns {boolean} - True if form is valid
 */
function validateForm(email, password) {
	let isValid = true;

	if (!email) {
		displayError(emailError, "Email is required");
		isValid = false;
	} else if (!API.Validation.isValidEmail(email)) {
		displayError(emailError, "Please enter a valid email address");
		isValid = false;
	}

	if (!password) {
		displayError(passwordError, "Password is required");
		isValid = false;
	}

	return isValid;
}

/**
 * Display an error message
 * @param {HTMLElement} element - Error element
 * @param {string} message - Error message
 */
function displayError(element, message) {
	element.textContent = message;
	element.parentElement.classList.add("has-error");
}

function resetErrors() {
	emailError.textContent = "";
	passwordError.textContent = "";

	emailInput.parentElement.classList.remove("has-error");
	passwordInput.parentElement.classList.remove("has-error");
}

function togglePasswordVisibility() {
	if (passwordInput.type === "password") {
		passwordInput.type = "text";
		passwordToggle.textContent = "Hide";
	} else {
		passwordInput.type = "password";
		passwordToggle.textContent = "Show";
	}

	passwordInput.focus();
}

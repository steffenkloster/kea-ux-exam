import API from "./api.js";
import { redirectTo } from "./app.js";

const accountForm = document.getElementById("account-form");
const changePasswordForm = document.getElementById("change-password-form");
const deleteAccountForm = document.getElementById("delete-account-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const firstNameInput = document.getElementById("first-name");
const lastNameInput = document.getElementById("last-name");
const addressInput = document.getElementById("address");
const phoneNumberInput = document.getElementById("phone-number");
const birthDateInput = document.getElementById("birth-date");

const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");
const confirmPasswordError = document.getElementById("confirm-password-error");
const firstNameError = document.getElementById("first-name-error");
const lastNameError = document.getElementById("last-name-error");
const addressError = document.getElementById("address-error");
const phoneNumberError = document.getElementById("phone-number-error");
const birthDateError = document.getElementById("birth-date-error");

const passwordToggles = document.querySelectorAll(".password-toggle");

document.addEventListener("DOMContentLoaded", () => {
	if (!API.Auth.isLoggedIn()) {
		redirectTo("login.html");
		return;
	}

	populateFormFields();

	if (accountForm) {
		accountForm.addEventListener("submit", handleSaveAccount);
	}

	if (changePasswordForm) {
		changePasswordForm.addEventListener("submit", handleChangePassword);
	}

	if (deleteAccountForm) {
		deleteAccountForm.addEventListener("submit", async (event) => {
			event.preventDefault();

			const confirmDelete = confirm(
				"Are you sure you want to delete your account? This action cannot be undone.",
			);

			if (!confirmDelete) {
				return;
			}

			console.log("Deleting account...");

			const userId = API.Auth.getUserId();
			try {
				await API.User.deleteUser(userId);
				API.Auth.logout();
				redirectTo("login.html");
			} catch (error) {
				console.error("Failed to delete account:", error);
				API.showError("Failed to delete account. Please try again.");
			}
		});
	}

	for (const toggle of passwordToggles) {
		toggle.addEventListener("click", function () {
			const input = this.previousElementSibling;
			togglePasswordVisibility(input, this);
		});
	}
});

async function populateFormFields() {
	const userId = API.Auth.getUserId();
	const user = await API.User.getUserDetails(userId);
	const { address, birth_date, email, first_name, last_name, phone_number } =
		user;

	emailInput.value = email;
	firstNameInput.value = first_name;
	lastNameInput.value = last_name;
	addressInput.value = address;
	phoneNumberInput.value = phone_number;
	birthDateInput.value = birth_date;
}

async function handleSaveAccount(event) {
	event.preventDefault();

	resetErrors();

	const userData = {
		email: emailInput.value.trim(),
		first_name: firstNameInput.value.trim(),
		last_name: lastNameInput.value.trim(),
		address: addressInput.value.trim(),
		phone_number: phoneNumberInput.value.trim(),
		birth_date: birthDateInput.value.trim(),
	};

	if (!validateForm(userData)) {
		return;
	}

	console.log("Saving account data...");

	try {
		const userId = API.Auth.getUserId();
		await API.User.updateUser(userId, {
			email: userData.email,
			password: userData.password,
			first_name: userData.first_name,
			last_name: userData.last_name,
			address: userData.address,
			phone_number: userData.phone_number,
			birth_date: userData.birth_date,
		});

		API.Auth.login(userData.email, userId);

		API.showSuccess("Account information changed successfully!");
	} catch (error) {
		console.error("Signup failed:", error);
		API.showError(
			error.message || "Failed to create account. Please try again.",
		);
	}
}

async function handleChangePassword(event) {
	event.preventDefault();
	resetErrors();

	const userData = {
		password: passwordInput.value.trim(),
		confirmPassword: confirmPasswordInput.value.trim(),
	};

	if (!validateForm(userData)) {
		return;
	}

	try {
		const userId = API.Auth.getUserId();
		await API.User.updateUser(userId, {
			password: userData.password,
		});

		API.showSuccess("Password changed successfully!");
	} catch (error) {
		console.error("Password change failed:", error);
		API.showError(
			error.message || "Failed to change password. Please try again.",
		);
	}
}

/**
 * Validate signup form inputs
 * @param {Object} userData - User form data
 * @returns {boolean} - True if form is valid
 */
function validateForm(userData) {
	let isValid = true;

	if (!userData) {
		console.error("User data is undefined");
		return false;
	}

	if (userData.email !== undefined) {
		// saving account

		if (!userData.email) {
			displayError(emailError, "Email is required");
			isValid = false;
		} else if (!API.Validation.isValidEmail(userData.email)) {
			displayError(emailError, "Please enter a valid email address");
			isValid = false;
		}

		if (!userData.first_name) {
			displayError(firstNameError, "First name is required");
			isValid = false;
		}

		if (!userData.last_name) {
			displayError(lastNameError, "Last name is required");
			isValid = false;
		}

		if (!userData.address) {
			displayError(addressError, "Address is required");
			isValid = false;
		}

		if (!userData.phone_number) {
			displayError(phoneNumberError, "Phone number is required");
			isValid = false;
		}

		if (!userData.birth_date) {
			displayError(birthDateError, "Birth date is required");
			isValid = false;
		}
	} else {
		// changing password

		if (!userData.password) {
			displayError(passwordError, "Password is required");
			isValid = false;
		} else if (!API.Validation.isValidPassword(userData.password)) {
			displayError(
				passwordError,
				"Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters",
			);
			isValid = false;
		}

		if (!userData.confirmPassword) {
			displayError(confirmPasswordError, "Please confirm your password");
			isValid = false;
		} else if (userData.password !== userData.confirmPassword) {
			displayError(confirmPasswordError, "Passwords do not match");
			isValid = false;
		}
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
	const errorElements = [
		emailError,
		passwordError,
		confirmPasswordError,
		firstNameError,
		lastNameError,
		addressError,
		phoneNumberError,
		birthDateError,
	];

	for (const element of errorElements) {
		element.textContent = "";
		element.parentElement.classList.remove("has-error");
	}
}

function togglePasswordVisibility(input, button) {
	if (input.type === "password") {
		input.type = "text";
		button.textContent = "Hide";
	} else {
		input.type = "password";
		button.textContent = "Show";
	}

	input.focus();
}

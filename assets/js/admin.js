import API from "./api.js";

const tabButtons = document.querySelectorAll(".tab-btn");
const adminPanels = document.querySelectorAll(".admin-panel");

const bookLookupForm = document.getElementById("book-lookup-form");
const bookIdInput = document.getElementById("book-id");
const bookLookupResults = document.getElementById("book-lookup-results");
const bookDetailsTemplate = document.getElementById("book-details-template");

const addBookForm = document.getElementById("add-book-form");
const bookAuthorSelect = document.getElementById("book-author");
const bookPublisherSelect = document.getElementById("book-publisher");
const bookYearInput = document.getElementById("book-year");

const addAuthorForm = document.getElementById("add-author-form");

const addPublisherForm = document.getElementById("add-publisher-form");

document.addEventListener("DOMContentLoaded", () => {
	if (!API.Auth.isAdmin()) {
		window.location.href = "index.html";
		return;
	}

	for (const button of tabButtons) {
		button.addEventListener("click", switchTab);
	}

	bookLookupForm.addEventListener("submit", handleBookLookup);
	addBookForm.addEventListener("submit", handleAddBook);
	addAuthorForm.addEventListener("submit", handleAddAuthor);
	addPublisherForm.addEventListener("submit", handleAddPublisher);

	addBookForm.addEventListener("reset", () => resetFormMessages(addBookForm));
	addAuthorForm.addEventListener("reset", () =>
		resetFormMessages(addAuthorForm),
	);
	addPublisherForm.addEventListener("reset", () =>
		resetFormMessages(addPublisherForm),
	);

	const currentYear = new Date().getFullYear();
	bookYearInput.max = currentYear;

	loadAuthors();
	loadPublishers();
});

function switchTab(event) {
	for (const button of tabButtons) {
		button.classList.remove("active");
		button.setAttribute("aria-selected", "false");
	}
	for (const panel of adminPanels) {
		panel.classList.remove("active");
		panel.hidden = true;
	}

	const clickedTab = event.currentTarget;
	clickedTab.classList.add("active");
	clickedTab.setAttribute("aria-selected", "true");

	const panelId = clickedTab.getAttribute("aria-controls");
	const activePanel = document.getElementById(panelId);
	activePanel.classList.add("active");
	activePanel.hidden = false;
}

async function loadAuthors() {
	try {
		const authors = await API.User.getAllAuthors();

		// sort authors alphabetically
		authors.sort((a, b) => a.author_name.localeCompare(b.author_name));

		while (bookAuthorSelect.options.length > 1) {
			bookAuthorSelect.remove(1);
		}

		for (const author of authors) {
			const option = document.createElement("option");
			option.value = author.author_id;
			option.textContent = author.author_name;
			bookAuthorSelect.appendChild(option);
		}
	} catch (error) {
		console.error("Failed to load authors:", error);

		showFormMessage(
			addBookForm,
			"Failed to load authors. Please try again later.",
			"error",
		);
	}
}

async function loadPublishers() {
	try {
		const publishers = await API.User.getAllPublishers();

		publishers.sort((a, b) => a.publisher_name.localeCompare(b.publisher_name));

		while (bookPublisherSelect.options.length > 1) {
			bookPublisherSelect.remove(1);
		}

		for (const publisher of publishers) {
			const option = document.createElement("option");
			option.value = publisher.publisher_id;
			option.textContent = publisher.publisher_name;
			bookPublisherSelect.appendChild(option);
		}
	} catch (error) {
		console.error("Failed to load publishers:", error);
		showFormMessage(
			addBookForm,
			"Failed to load publishers. Please try again later.",
			"error",
		);
	}
}

async function handleBookLookup(event) {
	event.preventDefault();

	const bookId = bookIdInput.value.trim();
	if (!bookId) {
		showFormMessage(bookLookupForm, "Please enter a book ID.", "error");
		return;
	}

	try {
		bookLookupResults.innerHTML = "";
		showFormMessage(bookLookupForm, "Loading book details...", "info");

		const bookDetails = await API.Admin.getBookDetailsWithLoans(bookId);

		resetFormMessages(bookLookupForm);

		displayBookDetails(bookDetails);
	} catch (error) {
		console.error("Book lookup failed:", error);
		showFormMessage(
			bookLookupForm,
			error.message ||
				"Failed to find book. Please check the ID and try again.",
			"error",
		);
		bookLookupResults.innerHTML = "";
	}
}

function displayBookDetails(book) {
	const bookDetailsElement = bookDetailsTemplate.content.cloneNode(true);

	const coverImg = bookDetailsElement.querySelector(".book-details__image img");
	const titleEl = bookDetailsElement.querySelector(".book-details__title");
	const authorEl = bookDetailsElement.querySelector(".book-details__author");
	const publisherEl = bookDetailsElement.querySelector(
		".book-details__publisher",
	);
	const yearEl = bookDetailsElement.querySelector(".book-details__year");
	const loanTableBody = bookDetailsElement.querySelector(".loan-table tbody");
	const noLoansEl = bookDetailsElement.querySelector(".no-loans");

	coverImg.src = book.cover || "assets/img/book-placeholder.jpg";
	coverImg.alt = `Cover of ${book.title}`;
	titleEl.textContent = book.title;
	authorEl.textContent = `By ${book.author}`;
	publisherEl.textContent = `Publisher: ${book.publishing_company}`;
	yearEl.textContent = `Published: ${book.publishing_year}`;

	if (book.loans && book.loans.length > 0) {
		for (const loan of book.loans) {
			const row = document.createElement("tr");
			row.innerHTML = `
        <td>${loan.user_id}</td>
        <td>${loan.loan_date}</td>
      `;
			loanTableBody.appendChild(row);
		}
		noLoansEl.classList.add("hidden");
	} else {
		noLoansEl.classList.remove("hidden");
	}

	bookLookupResults.appendChild(bookDetailsElement);
}

async function handleAddBook(event) {
	event.preventDefault();

	const formData = new FormData(addBookForm);
	const bookData = {
		title: formData.get("title"),
		author_id: formData.get("author_id"),
		publisher_id: formData.get("publisher_id"),
		publishing_year: formData.get("publishing_year"),
	};

	if (
		!bookData.title ||
		!bookData.author_id ||
		!bookData.publisher_id ||
		!bookData.publishing_year
	) {
		showFormMessage(
			addBookForm,
			"Please fill in all required fields.",
			"error",
		);
		return;
	}

	try {
		showFormMessage(addBookForm, "Adding book...", "info");

		const response = await API.Admin.createBook(bookData);

		showFormMessage(
			addBookForm,
			`Book added successfully! Book ID: ${response.book_id}`,
			"success",
		);

		addBookForm.reset();
	} catch (error) {
		console.error("Add book failed:", error);
		showFormMessage(
			addBookForm,
			error.message || "Failed to add book. Please try again.",
			"error",
		);
	}
}

async function handleAddAuthor(event) {
	event.preventDefault();

	const formData = new FormData(addAuthorForm);
	const authorData = {
		first_name: formData.get("first_name"),
		last_name: formData.get("last_name"),
	};

	if (!authorData.first_name || !authorData.last_name) {
		showFormMessage(
			addAuthorForm,
			"Please enter both first and last name.",
			"error",
		);
		return;
	}

	try {
		showFormMessage(addAuthorForm, "Adding author...", "info");

		const response = await API.Admin.createAuthor(authorData);

		showFormMessage(
			addAuthorForm,
			`Author added successfully! Author ID: ${response.author_id}`,
			"success",
		);

		addAuthorForm.reset();

		await loadAuthors();
	} catch (error) {
		console.error("Add author failed:", error);
		showFormMessage(
			addAuthorForm,
			error.message || "Failed to add author. Please try again.",
			"error",
		);
	}
}

async function handleAddPublisher(event) {
	event.preventDefault();

	const publisherName = document.getElementById("publisher-name").value.trim();

	if (!publisherName) {
		showFormMessage(
			addPublisherForm,
			"Please enter the publisher name.",
			"error",
		);
		return;
	}

	try {
		showFormMessage(addPublisherForm, "Adding publisher...", "info");

		const response = await API.Admin.createPublisher(publisherName);

		showFormMessage(
			addPublisherForm,
			`Publisher added successfully! Publisher ID: ${response.publisher_id}`,
			"success",
		);

		addPublisherForm.reset();

		await loadPublishers();
	} catch (error) {
		console.error("Add publisher failed:", error);
		showFormMessage(
			addPublisherForm,
			error.message || "Failed to add publisher. Please try again.",
			"error",
		);
	}
}

function showFormMessage(form, message, type = "info") {
	resetFormMessages(form);

	const messageElement = document.createElement("div");
	messageElement.className = `admin-message ${type}`;
	messageElement.textContent = message;
	messageElement.setAttribute("role", type === "error" ? "alert" : "status");

	form.insertBefore(messageElement, form.querySelector(".form-group"));
}

function resetFormMessages(form) {
	const messages = form.querySelectorAll(".admin-message");
	for (const message of messages) {
		message.remove();
	}
}

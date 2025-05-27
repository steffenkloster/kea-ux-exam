import API from "./api.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const featuredBooksContainer = $("#featured-books");
const mobileMenuToggle = $(".menu-toggle");
const mainNav = $("#main-nav");
const authRequiredElements = $$(".auth-required");
const adminOnlyElements = $$(".admin-only");
const loginBtn = $(".login-btn");
const signupBtn = $(".signup-btn");
const logoutBtn = $(".logout-btn");

document.addEventListener("DOMContentLoaded", () => {
	checkAuthStatus();
	setupMobileMenu();

	featuredBooksContainer?.addEventListener("load", loadFeaturedBooks());

	logoutBtn?.querySelector("button")?.addEventListener("click", handleLogout);
});

const checkAuthStatus = () => {
	const isLoggedIn = API.Auth.isLoggedIn();
	const isAdmin = API.Auth.isAdmin();

	for (const element of authRequiredElements) {
		element.classList.toggle("hidden", !isLoggedIn);
	}
	for (const element of adminOnlyElements) {
		element.classList.toggle("hidden", !isAdmin);
	}

	loginBtn?.classList.toggle("hidden", isLoggedIn);
	signupBtn?.classList.toggle("hidden", isLoggedIn);
	logoutBtn?.classList.toggle("hidden", !isLoggedIn);
};

const setupMobileMenu = () => {
	mobileMenuToggle &&
		mainNav &&
		mobileMenuToggle.addEventListener("click", () => {
			const isExpanded =
				mobileMenuToggle.getAttribute("aria-expanded") === "true";
			mobileMenuToggle.setAttribute("aria-expanded", !isExpanded);
			mainNav.classList.toggle("active");
		});
};

const loadFeaturedBooks = async () => {
	if (!featuredBooksContainer) return;

	try {
		const books = await API.User.getRandomBooks(8);

		const loadingPlaceholder = featuredBooksContainer.querySelector(
			".loading-placeholder",
		);
		loadingPlaceholder?.remove();

		const bookElements = [];
		for (const book of books) {
			bookElements.push(createBookCard(book));
		}
		featuredBooksContainer.append(...bookElements);
	} catch (error) {
		console.error("Failed to load featured books:", error);
		featuredBooksContainer.innerHTML = `
      <p class="no-results">Failed to load books. Please try again later.</p>
    `;
	}
};

const createBookCard = (book) => {
	const template = document.getElementById("book-card-template");
	const card = template.content.cloneNode(true);

	const titleLink = card.querySelector(".book-card__title a");
	const author = card.querySelector(".book-card__author");
	const year = card.querySelector(".book-card__year");
	const publisher = card.querySelector(".book-card__publisher");
	const actionsDiv = card.querySelector(".book-card__actions");

	titleLink.textContent = book.title;
	titleLink.href = `book-details.html?id=${book.book_id}`;
	titleLink.setAttribute("aria-label", `View details of ${book.title}`);

	author.textContent = `By ${book.author}`;
	year.textContent = `${book.publishing_year}`;
	publisher.textContent = book.publishing_company;

	const detailsLink = actionsDiv.querySelector("a");
	detailsLink.href = `book-details.html?id=${book.book_id}`;

	if (API.Auth.isLoggedIn()) {
		const loanButton = document.createElement("button");
		loanButton.className = "btn btn-primary loan-btn";
		loanButton.dataset.bookId = book.book_id;
		loanButton.setAttribute("aria-label", `Loan ${book.title}`);
		loanButton.textContent = "Loan";

		loanButton.addEventListener("click", (event) => {
			event.preventDefault();
			handleLoanBook(book.book_id);
		});

		actionsDiv.appendChild(loanButton);
	}

	return card;
};

const handleLoanBook = async (bookId) => {
	try {
		const userId = API.Auth.getUserId();
		if (!userId) {
			window.location.href = "login.html";
			return;
		}

		const result = await API.User.loanBook(userId, bookId);

		if (result?.status === "ok") {
			API.showSuccess(
				"Book loaned successfully. An access link will be sent to your email.",
			);
		}
	} catch (error) {
		console.error("Failed to loan book:", error);
		API.showError(
			error?.message || "Failed to loan book. Please try again later.",
		);
	}
};

const handleLogout = (event) => {
	event.preventDefault();

	API.Auth.logout();

	window.location.href = "index.html";
};

export const getUrlParam = (param) => {
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	return urlParams.get(param);
};

export const redirectTo = (url) => {
	window.location.href = url;
};

export { createBookCard };

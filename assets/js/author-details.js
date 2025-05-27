import API from "./api.js";
import { getUrlParam } from "./app.js";

const authorDetailsContainer = document.getElementById("author-details");
const authorNameElement = document.getElementById("author-name-placeholder");
const authorBooksContainer = document.getElementById("author-books");
const bookCardTemplate = document.getElementById("book-card-template");
const breadcrumbCurrentItem = document.querySelector(
	"nav.breadcrumbs .current",
);

const bookId = getUrlParam("id");

document.addEventListener("DOMContentLoaded", () => {
	if (!bookId) {
		API.showError("No book ID provided. Redirecting to home page...");
		setTimeout(() => {
			window.location.href = "index.html";
		}, 3000);
		return;
	}

	loadAuthorDetails(bookId);
});

async function loadAuthorDetails(authorId) {
	try {
		const authorDetails = await API.User.getAuthorDetails(authorId);
		if (!authorDetails) {
			throw new Error("Author details not found.");
		}

		console.log("Author Details:", authorDetails);
		document.title = `${authorDetails.author_name} - eLib`;

		authorNameElement.textContent = authorDetails.author_name;

		renderAuthorDetails(authorDetails);

		// loadRelatedBooks(bookDetails.author);
	} catch (error) {
		console.error("Failed to load book details:", error);
		breadcrumbCurrentItem.textContent = "Error Loading Book";
		authorDetailsContainer.innerHTML = `
      <div class="error-message">
        <h2>Error Loading Book</h2>
        <p>We couldn't load details for this book. Please try again later.</p>
        <a href="index.html" class="btn btn-primary">Return to Home</a>
      </div>
    `;
	}
}

async function renderAuthorDetails(author) {
	const coverUrl = author.cover ?? "img/book-placeholder.jpg"; // TODO: Add a default cover image

	authorDetailsContainer.querySelector(".loading-placeholder").remove();
	breadcrumbCurrentItem.textContent = author.author_name;

	for (const book of author.books) {
		const bookCard = createBookCard(book, coverUrl);
		authorBooksContainer.appendChild(bookCard);
	}
}

function createBookCard(book) {
	const bookCard = bookCardTemplate.content.cloneNode(true);
	const bookCardLink = bookCard.querySelector(".book-card__title a");
	bookCardLink.href = `book-details.html?id=${book.book_id}`;
	bookCardLink.textContent = book.title;

	const bookCardDetails = bookCard.querySelector(".book-card__details");
	bookCardDetails.textContent = `Published: ${book.publishing_year}`;
	return bookCard;
}

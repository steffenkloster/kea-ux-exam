import API from "./api.js";
import { createBookCard, getUrlParam } from "./app.js";

const bookDetailsContainer = document.getElementById("book-details");
const relatedBooksSection = document.querySelector(".related-books");
const viewRelatedBooksBtn = document.getElementById("view-related-books");
const relatedBooksContainer = document.getElementById("related-books");
const loanHistoryTemplate = document.getElementById("loan-history-template");
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

	loadBookDetails(bookId);
});

async function loadBookDetails(bookId) {
	try {
		let bookDetails;

		if (API.Auth.isAdmin()) {
			bookDetails = await API.Admin.getBookDetailsWithLoans(bookId);
		} else {
			bookDetails = await API.User.getBookDetails(bookId);
		}

		document.title = `${bookDetails.title} - Online Library`;

		renderBookDetails(bookDetails);

		loadRelatedBooks(bookDetails.author);
	} catch (error) {
		console.error("Failed to load book details:", error);
		breadcrumbCurrentItem.textContent = "Error Loading Book";
		bookDetailsContainer.innerHTML = `
      <div class="error-message">
        <h2>Error Loading Book</h2>
        <p>We couldn't load details for this book. Please try again later.</p>
        <a href="index.html" class="btn btn-primary">Return to Home</a>
      </div>
    `;
	}
}

async function renderBookDetails(book) {
	const coverUrl = book.cover ?? "img/book-placeholder.jpg"; // TODO: Add a default cover image

	const userId = API.Auth.getUserId();
	const loanedBook = await API.User.hasLoanedBook(
		userId,
		book.book_id || bookId,
	);

	let loanedBookDate;
	if (loanedBook) {
		loanedBookDate = new Date(loanedBook.loan_date);
		loanedBookDate.setDate(loanedBookDate.getDate() + 30);
		loanedBookDate = loanedBookDate.toLocaleDateString("da-DK", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
	}

	console.log("Loaned Book:", loanedBook);
	console.log("Loaned Book Date:", loanedBookDate);

	const bookDetailsHTML = `
    <div class="book-details">
      <div class="book-details__image">
        <img 
          src="${coverUrl}" 
          alt="Cover of ${book.title}" 
          loading="lazy"
        >
      </div>
      <div class="book-details__content">
        <h2 class="book-details__title">${book.title}</h2>
        <p class="book-details__author">By ${book.author}</p>
        
        <div class="book-details__meta">
          <p><strong>Publisher:</strong> ${book.publishing_company}</p>
          <p><strong>Published:</strong> ${book.publishing_year}</p>
        </div>
        
        <div class="book-details__actions">
          ${
						API.Auth.isLoggedIn()
							? `<button 
              class="btn btn-${loanedBook !== false ? "success" : "primary"} loan-btn" 
              data-book-id="${book.book_id || bookId}"
              aria-label="Loan ${book.title}"
              ${loanedBook !== false ? "disabled" : ""}
            >
              ${loanedBook !== false ? `Book Loaned until ${loanedBookDate.toString()}` : "Loan this Book"}
            </button>`
							: `<a href="login.html" class="btn btn-primary">Log in to Loan</a>`
					}
        </div>
      </div>
    </div>
  `;

	bookDetailsContainer.innerHTML = bookDetailsHTML;
	breadcrumbCurrentItem.textContent = book.title;

	if (API.Auth.isAdmin() && book.loans) {
		renderLoanHistory(book.loans);
	}

	const loanBtn = bookDetailsContainer.querySelector(".loan-btn");
	if (loanBtn) {
		loanBtn.addEventListener("click", handleLoanBook);
	}
}

function renderLoanHistory(loans) {
	const loanHistoryElement = loanHistoryTemplate.content.cloneNode(true);
	const tbody = loanHistoryElement.querySelector("tbody");

	for (const loan of loans) {
		const row = document.createElement("tr");
		row.innerHTML = `
      <td>${loan.user_id}</td>
      <td>${loan.loan_date}</td>
    `;
		tbody.appendChild(row);
	}

	bookDetailsContainer.appendChild(loanHistoryElement);
}

async function loadRelatedBooks(authorName) {
	try {
		const authors = await API.User.getAllAuthors();

		const author = authors.find((a) => a.author_name === authorName);

		if (!author) {
			relatedBooksSection.classList.add("hidden");
			return;
		}

		const books = await API.User.getBooksByAuthor(author.author_id);

		const relatedBooks = books
			.filter((book) => book.book_id !== bookId)
			.slice(0, 4);

		if (relatedBooks.length === 0) {
			relatedBooksSection.classList.add("hidden");
			return;
		}

		relatedBooksSection.classList.remove("hidden");

		relatedBooksContainer.innerHTML = "";

		for (const book of relatedBooks) {
			const bookCard = createBookCard(book);
			relatedBooksContainer.appendChild(bookCard);
		}
	} catch (error) {
		console.error("Failed to load related books:", error);
		relatedBooksSection.classList.add("hidden");
	}
}

async function handleLoanBook(event) {
	event.preventDefault();

	try {
		const userId = API.Auth.getUserId();
		const bookId = this.dataset.bookId;

		if (!userId) {
			window.location.href = "login.html";
			return;
		}

		const result = await API.User.loanBook(userId, bookId);

		if (result.status === "ok") {
			API.showSuccess(
				"Book loaned successfully. An access link will be sent to your email.",
			);

			this.disabled = true;
			this.textContent = "Book Loaned";
			this.classList.add("btn-success");
		}
	} catch (error) {
		console.error("Failed to loan book:", error);
		API.showError(
			error.message || "Failed to loan book. Please try again later.",
		);
	}
}

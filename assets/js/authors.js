import API from "./api.js";

const authorList = document.getElementById("author-list-container");

let allAuthors = [];
let allBooks = [];

document.addEventListener("DOMContentLoaded", () => {
	loadAuthors();
});

async function loadAuthors() {
	try {
		allBooks = await API.User.getAllBooks();
		allAuthors = await API.User.getAllAuthors();

		// Sort authors alphabetically
		allAuthors.sort((a, b) => a.author_name.localeCompare(b.author_name));

		for (const author of allAuthors) {
			const card = createAuthorCard(author);
			authorList.appendChild(card);
		}
	} catch (error) {
		console.error("Failed to load authors:", error);
		API.showError("Failed to load author list. Please try again later.");
	}
}

const createAuthorCard = (author) => {
	const template = document.getElementById("author-card-template");
	const card = template.content.cloneNode(true);

	const authorTitle = card.querySelector(".author-card__title > a");
	const authorDetails = card.querySelector(".author-card__details");

	const authorBookCount = allBooks.filter(
		(book) => book.author === author.author_name,
	).length;

	authorTitle.textContent = author.author_name;
	authorTitle.href = `author-details.html?id=${author.author_id}`;
	authorTitle.setAttribute(
		"aria-label",
		`View details of ${author.author_name}`,
	);
	authorDetails.textContent = `${authorBookCount} book${
		authorBookCount === 1 ? "" : "s"
	} available`;

	return card;
};

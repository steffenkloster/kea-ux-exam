import API from "./api.js";
import { createBookCard } from "./app.js";

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const authorFilter = document.getElementById("author-filter");
const resultsCount = document.getElementById("results-count");
const searchResultsContainer = document.getElementById(
	"search-results-container",
);

let allAuthors = [];
let currentSearchResults = [];

document.addEventListener("DOMContentLoaded", () => {
	searchForm.addEventListener("submit", handleSearch);
	authorFilter.addEventListener("change", filterResults);

	loadAuthors();
	checkUrlForSearchParams();
});

async function loadAuthors() {
	try {
		allAuthors = await API.User.getAllAuthors();

		allAuthors.sort((a, b) => a.author_name.localeCompare(b.author_name));

		for (const author of allAuthors) {
			const option = document.createElement("option");
			option.value = author.author_id;
			option.textContent = author.author_name;
			authorFilter.appendChild(option);
		}

		const urlParams = new URLSearchParams(window.location.search);
		const authorId = urlParams.get("author");
		if (authorId) {
			authorFilter.value = authorId;
		}
	} catch (error) {
		console.error("Failed to load authors:", error);
		API.showError("Failed to load author list. Please try again later.");
	}
}

function checkUrlForSearchParams() {
	console.log("Checking URL for search parameters...");
	const urlParams = new URLSearchParams(window.location.search);
	const searchQuery = urlParams.get("q");
	const authorId = urlParams.get("author");

	if (searchQuery || authorId) {
		searchInput.value = searchQuery;
		performSearch(searchQuery, authorId);
	}
}

function handleSearch(event) {
	event.preventDefault();

	const searchQuery = searchInput.value.trim();
	const authorId = authorFilter.value;

	if (!searchQuery) {
		resultsCount.textContent = "Please enter a search term";
		searchResultsContainer.innerHTML = "";
		return;
	}

	const url = new URL(window.location);
	url.searchParams.set("q", searchQuery);

	if (authorId) {
		url.searchParams.set("author", authorId);
	} else {
		url.searchParams.delete("author");
	}

	window.history.pushState({}, "", url);

	performSearch(searchQuery, authorId);
}

/**
 * Perform search and display results
 * @param {string} searchQuery - Search query
 * @param {string|null} authorId - Author ID to filter by
 */
async function performSearch(searchQuery, authorId = null) {
	try {
		searchResultsContainer.innerHTML = "";
		resultsCount.textContent = "Searching...";

		let results;
		console.log("Performing search with query:", searchQuery);

		if (authorId) {
			results = await API.User.getBooksByAuthor(authorId);
			console.log("Books by author:", results);

			if (searchQuery) {
				results = results.filter((book) =>
					book.title.toLowerCase().includes(searchQuery.toLowerCase()),
				);
			}
		} else {
			results = await API.User.searchBooks(searchQuery);
		}

		currentSearchResults = results;

		displaySearchResults(results);
	} catch (error) {
		console.error("Search failed:", error);
		resultsCount.textContent = "Search failed. Please try again.";
		searchResultsContainer.innerHTML = `
      <div class="error-message">
        <p>We couldn't complete your search. Please try again later.</p>
      </div>
    `;
	}
}

/**
 * Display search results
 * @param {Array} results - Array of book results
 */
function displaySearchResults(results) {
	searchResultsContainer.innerHTML = "";

	if (results.length === 0) {
		resultsCount.textContent =
			"No books found matching your criteria. Try adjusting your search terms.";
		searchResultsContainer.innerHTML = "";
		return;
	}

	resultsCount.textContent = `Found ${results.length} book${
		results.length !== 1 ? "s" : ""
	}`;

	for (const book of results) {
		const bookCard = createBookCard(book);
		searchResultsContainer.appendChild(bookCard);
	}
}

function filterResults() {
	const authorId = authorFilter.value;
	const searchQuery = searchInput.value.trim();

	const url = new URL(window.location);

	if (authorId) {
		url.searchParams.set("author", authorId);
	} else {
		url.searchParams.delete("author");
	}

	window.history.pushState({}, "", url);

	if (searchQuery) {
		performSearch(searchQuery, authorId);
	} else if (authorId) {
		performSearch("", authorId);
	} else {
		resultsCount.textContent =
			"Enter search terms to find books in our library";
		searchResultsContainer.innerHTML = "";
	}
}

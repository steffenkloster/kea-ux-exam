const API = {
	// base URL for the API
	baseUrl: "https://py-library-api-v2.server.steffen.codes",

	async fetch(endpoint, options = {}) {
		try {
			const url = `${this.baseUrl}${endpoint}`;

			// logical nullish assignment
			options.headers ??= {
				"Content-Type": "application/json",
			};

			this.toggleLoading(true);

			const response = await fetch(url, options);
			const data = await response.json();

			if (data?.error) {
				throw new Error(data.error);
			}

			return data;
		} catch (error) {
			console.error(`API Error: ${error}`);
			this.showError(error.message);
			throw error;
		} finally {
			this.toggleLoading(false);
		}
	},

	// user-related API calls
	User: {
		getRandomBooks: async (count = 10) => {
			return API.fetch(`/books?n=${count}`);
		},

		searchBooks: async (searchText) => {
			return API.fetch(`/books?s=${encodeURIComponent(searchText)}`);
		},

		getBooksByAuthor: async (authorId) => {
			return API.fetch(`/books?a=${authorId}`);
		},

		getBookDetails: async (bookId) => {
			return API.fetch(`/books/${bookId}`);
		},

		getAllAuthors: async () => {
			return API.fetch("/authors");
		},

		getAuthorDetails: async (authorId) => {
			const allAuthors = await API.User.getAllAuthors();
			const author = allAuthors.find(
				(a) => a.author_id === Number.parseInt(authorId, 10),
			);
			if (!author) {
				throw new Error("Author not found");
			}

			const booksByAuthor = await API.User.getBooksByAuthor(authorId);
			return {
				...author,
				books: booksByAuthor,
			};
		},

		getAllBooks: async () => {
			return API.fetch("/books?n=-1");
		},

		getAllPublishers: async () => {
			return API.fetch("/publishers");
		},

		getUserDetails: async (userId) => {
			return API.fetch(`/users/${userId}`);
		},

		hasLoanedBook: async (userId, bookId) => {
			if (!userId || !bookId) {
				return false;
			}

			const bookDetails = await API.fetch(`/admin/books/${bookId}`);
			const bookLoans = bookDetails?.loans || [];
			const loanedBook = bookLoans.find((loan) => {
				if (loan.user_id.toString() !== userId.toString()) {
					return false;
				}

				const loanDate = new Date(loan.loan_date);
				loanDate.setDate(loanDate.getDate() + 30);
				return loanDate >= new Date();
			});

			return loanedBook ?? false;
		},

		createUser: async (userData) => {
			const formData = new FormData();

			for (const [key, value] of Object.entries(userData)) {
				formData.append(key, value);
			}

			return API.fetch("/users", {
				method: "POST",
				body: formData,
				headers: {}, // let the browser set the correct Content-Type for FormData
			});
		},

		updateUser: async (userId, userData) => {
			const formData = new FormData();

			for (const [key, value] of Object.entries(userData)) {
				formData.append(key, value);
			}

			return API.fetch(`/users/${userId}`, {
				method: "PUT",
				body: formData,
				headers: {}, // let the browser set the correct Content-Type for FormData
			});
		},

		deleteUser: async (userId) => {
			return API.fetch(`/users/${userId}`, {
				method: "DELETE",
			});
		},

		login: async (email, password) => {
			const formData = new FormData();
			formData.append("email", email);
			formData.append("password", password);

			return API.fetch("/users/login", {
				method: "POST",
				body: formData,
				headers: {}, // let the browser set the correct Content-Type for FormData
			});
		},

		loanBook: async (userId, bookId) => {
			return API.fetch(`/users/${userId}/books/${bookId}`, {
				method: "POST",
			});
		},
	},

	// admin-related API calls
	Admin: {
		getBookDetailsWithLoans: async (bookId) => {
			return API.fetch(`/admin/books/${bookId}`);
		},

		createBook: async (bookData) => {
			const formData = new FormData();

			for (const [key, value] of Object.entries(bookData)) {
				formData.append(key, value);
			}

			return API.fetch("/admin/books", {
				method: "POST",
				body: formData,
				headers: {}, // let the browser set the correct Content-Type for FormData
			});
		},

		createAuthor: async (authorData) => {
			const formData = new FormData();

			for (const [key, value] of Object.entries(authorData)) {
				formData.append(key, value);
			}

			return API.fetch("/admin/authors", {
				method: "POST",
				body: formData,
				headers: {}, // let the browser set the correct Content-Type for FormData
			});
		},

		createPublisher: async (name) => {
			const formData = new FormData();
			formData.append("name", name);

			return API.fetch("/admin/publishers", {
				method: "POST",
				body: formData,
				headers: {}, // let the browser set the correct Content-Type for FormData
			});
		},
	},

	// auth functions
	Auth: {
		isLoggedIn: () => {
			return Boolean(sessionStorage.getItem("userEmail"));
		},

		getUserEmail: () => {
			return sessionStorage.getItem("userEmail");
		},

		getUserId: () => {
			return sessionStorage.getItem("userId");
		},

		isAdmin: () => {
			return sessionStorage.getItem("userEmail") === "admin.library@mail.com";
		},

		login: (email, userId) => {
			sessionStorage.setItem("userEmail", email);
			sessionStorage.setItem("userId", userId);
		},

		logout: () => {
			sessionStorage.removeItem("userEmail");
			sessionStorage.removeItem("userId");
		},
	},

	// helper functions
	toggleLoading(show) {
		const loader = document.getElementById("loader");
		if (loader?.style) {
			loader.style.display = show ? "flex" : "none";
		}
	},

	showError(message) {
		const errorBox = document.getElementById("error-box");
		if (errorBox) {
			errorBox.textContent = message;
			errorBox.style.display = "block";

			setTimeout(() => {
				errorBox.style.display = "none";
			}, 5000);
		}
	},

	showSuccess(message) {
		const successBox = document.getElementById("success-box");
		if (successBox) {
			successBox.textContent = message;
			successBox.style.display = "block";

			setTimeout(() => {
				successBox.style.display = "none";
			}, 5000);
		}
	},

	// form validation
	Validation: {
		isValidEmail: (email) => {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			return emailRegex.test(email);
		},

		isValidPassword: (password) => {
			const passwordRegex =
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
			return passwordRegex.test(password);
		},

		passwordsMatch: (password, confirmPassword) => {
			return password === confirmPassword;
		},
	},
};

export default API;

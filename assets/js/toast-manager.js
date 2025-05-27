export class ToastManager {
	constructor(position = "top-right", maxToasts = 5, defaultDuration = 5000) {
		this.position = position;
		this.maxToasts = maxToasts;
		this.defaultDuration = defaultDuration;
		this.toasts = [];
		this.container = this.createContainer();
	}

	createContainer() {
		const container = document.createElement("div");
		container.className = `toast-container ${this.position}`;
		document.body.appendChild(container);
		return container;
	}

	createToast(
		title,
		message = "",
		type = "default",
		duration = this.defaultDuration,
	) {
		const toast = document.createElement("div");
		toast.className = `toast ${type}`;
		toast.role = "alert";
		toast.ariaLive = "polite";

		toast.innerHTML = `
          ${this.getIconForType(type)}
          <div class="toast-content">
              <h4 class="toast-title">${title}</h4>
              ${message ? `<p class="toast-message">${message}</p>` : ""}
          </div>
          <button class="toast-close" aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
          </button>
          ${duration !== Number.POSITIVE_INFINITY ? `<div class="toast-progress"></div>` : ""}
      `;

		const closeButton = toast.querySelector(".toast-close");
		closeButton.addEventListener("click", () => this.removeToast(toast));

		this.container.appendChild(toast);

		const progressBar = toast.querySelector(".toast-progress");
		if (progressBar && duration !== Number.POSITIVE_INFINITY) {
			progressBar.style.animation = `${duration}ms linear 0s 1 normal forwards running progress`;
			progressBar.style.animationName = "none";

			// force a reflow
			void progressBar.offsetWidth;

			progressBar.style.animationName = "progress";
			progressBar.style.transition = `transform ${duration}ms linear`;
			progressBar.style.transform = "scaleX(0)";
		}

		this.toasts.push(toast);
		this.checkMaxToasts();

		requestAnimationFrame(() => {
			toast.classList.add("visible");
		});

		if (duration !== Number.POSITIVE_INFINITY) {
			toast.timeoutId = setTimeout(() => {
				this.removeToast(toast);
			}, duration);
		}

		return toast;
	}

	removeToast(toast) {
		if (toast.timeoutId) {
			clearTimeout(toast.timeoutId);
		}

		toast.classList.add("removing");
		toast.classList.remove("visible");

		setTimeout(() => {
			if (toast.parentNode === this.container) {
				this.container.removeChild(toast);
			}
			this.toasts = this.toasts.filter((t) => t !== toast);
		}, 300);
	}

	checkMaxToasts() {
		if (this.toasts.length > this.maxToasts) {
			this.removeToast(this.toasts[0]);
		}
	}

	getIconForType(type) {
		switch (type) {
			case "success":
				return `
                  <div class="toast-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                  </div>
              `;
			case "error":
				return `
                  <div class="toast-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                  </div>
              `;
			case "warning":
				return `
                  <div class="toast-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                          <line x1="12" y1="9" x2="12" y2="13"></line>
                          <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                  </div>
              `;
			case "info":
				return `
                  <div class="toast-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                  </div>
              `;
			default:
				return "";
		}
	}

	success(title, message = "", duration = this.defaultDuration) {
		return this.createToast(title, message, "success", duration);
	}

	error(title, message = "", duration = this.defaultDuration) {
		return this.createToast(title, message, "error", duration);
	}

	warning(title, message = "", duration = this.defaultDuration) {
		return this.createToast(title, message, "warning", duration);
	}

	info(title, message = "", duration = this.defaultDuration) {
		return this.createToast(title, message, "info", duration);
	}

	setPosition(position) {
		this.container.className = `toast-container ${position}`;
		this.position = position;
	}

	clearAll() {
		for (const toast of [...this.toasts]) {
			this.removeToast(toast);
		}
	}
}

export const toastManager = new ToastManager("top-right", 5, 5000);

export function createToast(title, message, type = "default", duration = 5000) {
	toastManager.createToast(title, message, type, duration);
}

const loadingText = document.getElementById("loadingText");
const downloadButton = document.querySelector("[aria-label='download']");
const urlInput = document.querySelector("[name='url']");
const optionsDiv = document.getElementById("formatSelection");
const getOptionsButton = document.querySelector("[aria-label='getOptions']");
const videoResolution = optionsDiv.querySelector("[name='video-resolution']");
const videoFormat = optionsDiv.querySelector("[name='video-format']");
const formatOptionsCheckbox = optionsDiv.querySelector("[name='enableFormatOptions']");

// const stopDownloadButton = document.querySelector("[aria-label='stopDownload']");
// const audioFormat = optionsDiv.querySelector("[name='audio-format']");
// const conversionMethod = optionsDiv.querySelector("[name='conversion-method']");

const INVALID_URL_MESSAGE = "The URL appears invalid, please check it and try again.";

const isUrlValid = () => {
	if (urlInput.value.length === 0) {
		alert("URL cannot be empty.");
		return false;
	}

	try {
		const _ = new URL(urlInput.value);
		return true;
	} catch {
		alert(INVALID_URL_MESSAGE);
		return false;
	}
}

const animateOverlayStatus = (reveal, text) => {
	if (reveal) {
		loadingText.textContent = text;
		loadingText.style.opacity = 1;
		loadingText.style.visibility = "visible";
		downloadButton.style.visibility = "invisible";
		getOptionsButton.style.visibility = "invisible";
		// stopDownloadButton.style.visibility = "visible";
		// stopDownloadButton.style.opacity = 1;
	} else {
		loadingText.style.opacity = 0;
		loadingText.addEventListener('transitionend', () => {
			loadingText.removeAttribute("style");
			downloadButton.removeAttribute("style");
			getOptionsButton.removeAttribute("style");
		}, { once: true });
		// stopDownloadButton.style.visibility = "visible";
		// stopDownloadButton.style.opacity = 1;
	}
}

const openWebSocket = (path) => {
	const ws = new WebSocket(`wss://joshcantco.de/${path}`);
	ws.onclose = () => {
		animateOverlayStatus(false);
	}
	return ws;
}

const beginDownload = () => {
	if (!isUrlValid(urlInput.value)) return;

	animateOverlayStatus(true, "Downloading...");

	const ws = openWebSocket("download");
	ws.onopen = () => {
		ws.send(JSON.stringify({
			type: "DOWNLOAD_INFO",
			data: JSON.stringify(formatOptionsCheckbox.checked ? {
					url: urlInput.value,
					resolution: videoResolution.value,
					videoFormat: videoFormat.value,
					// audioFormat: audioFormat.value,
					// conversionMethod: conversionMethod.value
				} : {
					url: urlInput.value,
				})
		}));
	}
	ws.onmessage = (msg) => {
		const json = JSON.parse(msg.data);
		switch (json.type) {
			case "DOWNLOAD": {
				const pathInfo = JSON.parse(json.data);
				const a = document.createElement('a');
				a.href = pathInfo.path;
				a.download = pathInfo.file;
				document.body.appendChild(a);
				a.click();
				a.remove();
				break;
			}
			case "ERROR":
				if (json.data !== "USER_CANCELLED")
					alert(INVALID_URL_MESSAGE);
				break;
			case "UPDATE":
				loadingText.style.setProperty("--width", `${parseInt(json.data, 10)}%`);
				break;
			default:
				break;
		}
	};
}

urlInput.addEventListener("keyup", (e) => {
	if (e.key === "Enter")
		beginDownload();
});

downloadButton.addEventListener("click", beginDownload);

/* stopDownloadButton.addEventListener("click", () => {
	window.socket.send(JSON.stringify({
		type: "CANCEL"
	}));
	window.socket.close();
}); */

getOptionsButton.addEventListener("click", () => {
	if (!isUrlValid(urlInput.value)) return;

	animateOverlayStatus(true, "Loading...");

	const ws = openWebSocket("formats");
	ws.onopen = () => {
		ws.send(JSON.stringify({
			type: "URL",
			data: urlInput.value
		}));
	}
	ws.onmessage = (msg) => {
		const json = JSON.parse(msg.data);
		const formats = JSON.parse(json.data);

		while (videoResolution.firstChild) {
			videoResolution.removeChild(videoResolution.firstChild);
		}

		for (let i = 0; i < formats.length; ++i) {
			const format = formats[i];
			const option = document.createElement("option");
			option.innerText = option.value = format.resolution;
			videoResolution.appendChild(option);
		}

		optionsDiv.classList.remove("hidden");
		optionsDiv.classList.add("flex");
	};
})
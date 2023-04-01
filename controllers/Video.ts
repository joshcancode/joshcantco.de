import {
	readLines
} from "../deps.ts";

import { join } from "https://deno.land/std@0.181.0/path/mod.ts";
import { DownloadParams } from "../interfaces/MediaFormat.ts";

export const handleDownload = async (
	ip: string,
	ws: WebSocket,
	downloadParams: DownloadParams
) => {
	const params = [
		"./yt-dlp",
		"--abort-on-error",
		"--ffmpeg-location", join(Deno.cwd(), "tools"),
		"--newline",
		"--no-simulate",
		"-o", "public/download/%(extractor)s/%(id)s/%(title)s.%(ext)s",
		// "--prefer-free-formats",
		"--print", "%(.{id,title,extractor_key})j",
		"--print", "after_move:filepath",
		"--progress",
		"--restrict-filenames",
		// "-v"
	];

	console.log("Resolution: " + downloadParams.resolution + "\nFormat: " + downloadParams.videoFormat);

	if (downloadParams.resolution) {
		params.push("-S", `height:${downloadParams.resolution.substring(downloadParams.resolution.indexOf("x") + 1)}`, downloadParams.url);
	}

	if (downloadParams.videoFormat) {
		params.push("--merge-output-format", downloadParams.videoFormat, "--remux-video", downloadParams.videoFormat);

		if (downloadParams.videoFormat === "flv" || downloadParams.videoFormat === "mov") {
			params.push("-f", "bv*+ba[acodec!=opus]/b");
		} else if (downloadParams.videoFormat === "mp4" || downloadParams.videoFormat === "webm") {
			params.push("-f", "bv*+ba[acodec=opus]/b");
		} else {
			params.push("-f", "bv*+ba/b");
		}
	}

	params.push(downloadParams.url);

	const proc = Deno.run({ 
		cmd: params,
		cwd: Deno.cwd(),
		stdout: "piped",
		stderr: "piped"
	});

	let infoJson: { 
		id: "",
		title: "",
		extractor_key: ""
	} | undefined;

	for await (const line of readLines(proc.stdout)) {
		console.log(line);

		if (!infoJson) {
			infoJson = JSON.parse(line);
			console.log(`[ACTION] IP: ${ip} | Title: ${infoJson?.title} | Extractor: ${infoJson?.extractor_key}`);
			continue;
		}

		if (ws.readyState !== WebSocket.OPEN)
			continue;

		if (line.startsWith("[download]")) {
			ws.send(JSON.stringify({
				type: "UPDATE",
				data: line.substring("[download] ".length, line.indexOf("%") + 1)
			}));
			continue;
		}

		ws.send(JSON.stringify({
			type: "DOWNLOAD",
			data: JSON.stringify({
				path: line.substring(line.indexOf("public") + "public".length + 1),
				file: line.substring(line.indexOf(`${infoJson.id}`) + `${infoJson.id}`.length + 1),
			})
		}));
		ws.close();
	}

	for await (const line of readLines(proc.stderr)) {
		console.error(line);
	}

	const status = await proc.status();
	if (ws.readyState !== WebSocket.OPEN)
		return;

	if (status.code === 1) {
		ws.send(JSON.stringify({
			type: "ERROR",
			data: "INVALID_URL"
		}));
	}
	if (status.signal === 15) {
		ws.send(JSON.stringify({
			type: "ERROR",
			data: "USER_CANCELLED"
		}));
	}

	ws.close();
}

interface MediaFormat {
	resolution: string
}

export const getFormatData = async (
	ws: WebSocket,
	url: string
) => {
	const params = [
		"./yt-dlp",
		"--abort-on-error",
		"--list-formats",
		url
	];

	const proc = Deno.run({ 
		cmd: params,
		cwd: Deno.cwd(),
		stdout: "piped",
		stderr: "piped"
	});

	const formats: MediaFormat[] = [];
	let printingFormats = false;

	for await (const line of readLines(proc.stdout)) {
		console.log(line);

		if (line.startsWith("-")) {
			printingFormats = true;
			continue;
		}

		if (!printingFormats) continue;

		const fields = line.split(/\s+/);
		const videoExtension = fields[1];
		const resolution = fields[2];

		if (!resolution.startsWith("audio") && (
			videoExtension === "mov" || 
			videoExtension === "mp4" || 
			videoExtension === "webm") && !formats.find((f) => { return f.resolution === fields[2]; })) {
			formats.push({ resolution });
		}
	}

	ws.send(JSON.stringify({
		type: "FORMATS",
		data: JSON.stringify(formats)
	}));

	for await (const line of readLines(proc.stderr)) {
		console.error(line);
	}

	ws.close();
}
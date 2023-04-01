import {
	Router,
	Status
} from "../deps.ts";
import { getFormatData, handleDownload } from '../controllers/video.ts';

const router = new Router();
router
	.get("/download", (ctx) => {
		if (!ctx.isUpgradable) {
			ctx.throw(Status.BadGateway);
			return;
		}

		const ws = ctx.upgrade();
		ws.onmessage = (msg) => {
			const sendErrorAndClose = () => {
				ws.send(JSON.stringify({
					type: "ERROR",
					data: "INVALID_DATA"
				}));
				ws.close();
				ctx.throw(Status.BadRequest);
			};

			let json: any;

			try {
				json = JSON.parse(msg.data);
			} catch {
				sendErrorAndClose();
				return;
			}

			if (json.type === "DOWNLOAD_INFO") {
				try {
					json = JSON.parse(json.data);
				} catch {
					sendErrorAndClose();
					return;
				}

				handleDownload(ctx.request.headers.get("CF-Connecting-IP") ?? ctx.request.ip, ws, json);
			}
		};
	})
	.get("/formats", (ctx) => {
		if (!ctx.isUpgradable) {
			ctx.throw(Status.BadGateway);
			return;
		}

		const ws = ctx.upgrade();
		ws.onmessage = (msg) => {
			const sendErrorAndClose = (data: string) => {
				ws.send(JSON.stringify({
					type: "ERROR",
					data
				}));
				ws.close();
				ctx.throw(Status.BadRequest);
			};

			let json: { type: string, data: string };

			try {
				json = JSON.parse(msg.data);
			} catch {
				sendErrorAndClose("INVALID_DATA");
				return;
			}

			if (json.type === "URL") {
				try {
					const _ = new URL(json.data);
				} catch {
					sendErrorAndClose("INVALID_URL");
					return;
				}

				getFormatData(ws, json.data);
			}
		};
	});

export { router };
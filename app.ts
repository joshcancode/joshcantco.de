import {
	Application,
	FlashServer,
	hasFlash,
	Router
} from "./deps.ts";

import { cleanupDownloads } from "./controllers/cleanup.ts";

const appOptions = hasFlash() ? { serverConstructor: FlashServer } : undefined;
const app = new Application(appOptions);

for await (const entry of Deno.readDir("./routes")) {
	try {
		const router: Router = (await import(`./routes/${entry.name}`)).router;
		app.use(router.routes());
		app.use(router.allowedMethods());
	} catch (error) {
		console.error(`An error occured while routing /routes/${entry.name}: ${error}`);
	}
}

cleanupDownloads();
setInterval(cleanupDownloads, 1000 * 60 * 60 * 24);

app.use(async (ctx, next) => {
	try {
		await ctx.send({
			index: "index.html",
			root: "./public"
		});
	} catch {
		await next();
	}
});

app.listen({ port: 8011 }).catch(error => console.log(error));
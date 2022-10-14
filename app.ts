import { Application, Router } from 'https://deno.land/x/oak@v10.6.0/mod.ts';

const SERVER_PORT = 8000;

const app = new Application();

for await (const entry of Deno.readDir('./routes')) {
    if (!entry.isFile) continue;

    const route = await import(`./routes/${entry.name}`)
        .catch(e => {
            console.error(`An error occured while registering routes in routes/${entry.name}: ${e}`);
            return undefined;
        });

    if (!route) continue;

    const router: Router = route.default;
    app.use(router.routes());
    app.use(router.allowedMethods());
}

app.use(async (ctx, next) => {
    await ctx.send({
        root: 'public',
        index: `index.html`
    }).catch(async () => {
        await next();
    });
});

app.listen({ port: SERVER_PORT });
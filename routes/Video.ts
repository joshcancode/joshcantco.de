import { Router, Status } from 'https://deno.land/x/oak@v10.6.0/mod.ts';
import VideoController from '../controllers/Video.ts'

const router = new Router();
router
    .post('/download', async (ctx) => {
        const body = JSON.parse(await ctx.request.body().value);

        const listIndex = body.url.indexOf('?list=');
        if (listIndex > -1)
            body.url = body.url.substring(0, listIndex);

        const videoPath = await VideoController.downloadMedia(body.url, body.videoFormat);

        if (videoPath.length > 0) {
            ctx.response.status = Status.OK;
            ctx.response.body = await Deno.readFile(videoPath);
            ctx.response.headers.set('Content-Disposition', videoPath);
            return;
        }

        // TO-DO: Report different statuses to allow better error handling
        ctx.response.status = Status.InternalServerError;
        ctx.response.body = 'There was an error downloading the video.';
    })
    .post('/videoDetails', async (ctx) => {
        const body = JSON.parse(await ctx.request.body().value);

        const listIndex = body.url.indexOf('?list=');
        if (listIndex > -1)
            body.url = body.url.substring(0, listIndex);

        const mediaFormats = await VideoController.fetchVideoDetails(body.url);

        if (mediaFormats !== undefined && mediaFormats.length > 0) {
            ctx.response.status = 200
            ctx.response.body = mediaFormats;
            return;
        }

        ctx.response.status = 400;
        ctx.response.body = 'There was an error downloading the video.';
    })

export default router;
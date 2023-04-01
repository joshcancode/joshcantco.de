import { walk } from "../deps.ts";

const ONE_DAY = 1000 * 60 * 60 * 24;

export const cleanupDownloads = async () => {
    for await (const entry of walk('./public/download')) {
        if (!entry.isFile) continue;
    
        const info = await Deno.stat(entry.path);
        if (!info.birthtime) continue;

        if (new Date().getTime() - info.birthtime.getTime() > ONE_DAY)
            await Deno.remove(entry.path.substring(0, entry.path.lastIndexOf("/")), { recursive: true });
    }
}
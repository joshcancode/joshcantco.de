import { readLines } from "https://deno.land/std@0.151.0/io/mod.ts";
import { MediaFormat } from "../interfaces/MediaFormat.ts";

export default {
    /* downloadMedia: async (url: string, formatId: string | undefined) => {
        const args = [
            './yt-dlp_x86',
            '--abort-on-error',
            '--restrict-filenames',
            '--embed-metadata',
            '--ffmpeg-location', Deno.cwd(),
            url
        ]

        if (formatId)
            args.splice(2, 0, `-f ${formatId}`);

        const childProcess = Deno.run({ 
            cmd: args,
            cwd: Deno.cwd(),
            stdout: 'piped',
            stderr: 'piped'
        });
    
        let filePath = '';
    
        for await (const line of readLines(childProcess.stdout)) {
            console.log(line);
    
            if (line.startsWith('[ERROR]')) return '';
    
            // Filename is in quotes, so we can extract the filename
            if (line.startsWith('[Merger]')) {
                filePath = line.slice(line.indexOf('\"') + 1, line.lastIndexOf('\"'));
                break;
            }
    
            if (line.endsWith('already been downloaded')) {
                filePath = line.slice(11, -28); // Remove '[download] ' and 'has already been downloaded\n'
                childProcess.close();
                return filePath;
            }
    
            if (line.startsWith('[download] D')) {
                filePath = line.slice(24); // Remove '[download] Destination: '

                // The filename here contains a fragment ID before the filetype. Remove the fragment ID by performing a global regex match and removing the last result
                const matches = [ ... filePath.matchAll(/.f[0-9]{3}.*?/g) ];
                if (matches.length > 0)
                    filePath = filePath.replace(matches[matches.length - 1][0], '');
                break;
            }
        }
    
        await childProcess.status();
        return filePath;
    },
    fetchVideoDetails: async (url: string) => {
        const childProcess = Deno.run({ 
            cmd: [ 
                './yt-dlp_x86',
                '--abort-on-error',
                '--list-formats',
                url
            ],
            cwd: Deno.cwd(),
            stdout: 'piped',
            stderr: 'piped'
        });

        let extractor = '';

        const formats: MediaFormat[] = [];
        const formatRegex = /[^\s]+/g;

        let printingFormats = false;

        for await (const line of readLines(childProcess.stdout)) {
            if (extractor.length == 0) {
                const matches = line.match(/\[(.*?)\]/);
                if (matches)
                    extractor = matches[1][1];
            }

            if (line.includes("---")) {
                printingFormats = true;
                continue;
            }

            if (!printingFormats || line.includes('mhtml'))
                continue;

            console.log(line);

            // Seperate every word by the spaces in-between
            const matches = [ ... line.matchAll(formatRegex) ];

            const mediaFormat: MediaFormat = {
                formatId: matches[0][0],
                fileType: matches[1][0],
                resolution: matches[2][0] === 'audio' ? '0' : matches[2][0],
                fileSize: undefined
            };

            switch (extractor) {
                case 'youtube': {
                    for (let i = mediaFormat.resolution === '0' ? 5 : 4; i < 7; ++i) {
                        const match = matches[i][0];
                        if (match.endsWith('iB') || match === '~') {
                            mediaFormat.fileSize = match.length > 1 ? match : matches[i + 1][0];
                            break;
                        }
                    }
                    break;
                }
            }

            formats.push(mediaFormat);
        }

        await childProcess.status();
        return formats;
    } */
    fetchVideoDetails: async (url: string) => { return ''; },
    downloadMedia: async (url: string, videoFormat: string) => {
        let args: string[] = [];

        if (videoFormat === "webm") {
            args = [
                './yt-dlp',
                '--abort-on-error',
                '--restrict-filenames',
                '--embed-metadata',
                '--ffmpeg-location', Deno.cwd(),
                '--downloader', 'ffmpeg',
                '-f', 'bv[ext=webm]+ba[ext=webm]',
                '--merge-output-format', videoFormat,
                url
            ];
        }
        else if (videoFormat === "mp4") {
            args = [
                './yt-dlp',
                '--abort-on-error',
                '--restrict-filenames',
                '--embed-metadata',
                '--ffmpeg-location', Deno.cwd(),
                '--downloader', 'ffmpeg',
                '-f', 'bv[ext=mp4]+ba[ext=m4a]',
                '--merge-output-format', videoFormat,
                url
            ];
        }
        else {
            args = [
                './yt-dlp',
                '--abort-on-error',
                '--restrict-filenames',
                '--embed-metadata',
                '--ffmpeg-location', Deno.cwd(),
                '--downloader', 'ffmpeg',
                '-f', 'bv+ba[ext=m4a]',
                '--merge-output-format', videoFormat,
                url
            ];
        }

        const childProcess = Deno.run({ 
            cmd: args,
            cwd: Deno.cwd(),
            stdout: 'piped',
            stderr: 'piped'
        });
    
        let filePath = '';
    
        for await (const line of readLines(childProcess.stdout)) {
            console.log(line);
    
            if (line.startsWith('[ERROR]')) return '';
    
            // Filename is in quotes, so we can extract the filename
            if (line.startsWith('[Merger]')) {
                filePath = line.slice(line.indexOf('\"') + 1, line.lastIndexOf('\"'));
                break;
            }
    
            if (line.endsWith('already been downloaded')) {
                filePath = line.slice(11, -28); // Remove '[download] ' and 'has already been downloaded\n'
                childProcess.close();
                return filePath;
            }
    
            if (line.startsWith('[download] D')) {
                filePath = line.slice(24); // Remove '[download] Destination: '

                // The filename here contains a fragment ID before the filetype. Remove the fragment ID by performing a global regex match and removing the last result
                const matches = [ ... filePath.matchAll(/.f[0-9]{3}.*?/g) ];
                if (matches.length > 0)
                    filePath = filePath.replace(matches[matches.length - 1][0], '');
                break;
            }
        }

        for await (const line of readLines(childProcess.stderr)) {
            console.error(line);
        }
    
        await childProcess.status();
        return filePath;
    }
}
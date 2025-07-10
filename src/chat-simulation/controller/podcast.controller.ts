import { Controller, Res, Get, Param } from '@nestjs/common';
import { Response } from 'express';
import { PodcastService } from '../service/podcast.service';
import { Public } from 'src/auth/decorator/public.decorator';

@Controller('podcast')
export class PodcastController {
  constructor(private readonly podcastService: PodcastService) {}

  // Stream a podcast from s3
  @Public()
  @Get('stream/:episodeUUID')
  async streamPodcast(
    @Res() res: Response,
    @Param('episodeUUID') episodeUUID: string,
  ) {
    const audioStream = await this.podcastService.streamPodcast(episodeUUID);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Accept-Ranges': 'bytes',
    });

    audioStream.pipe(res);
  }

  // Generate RSS feed
  @Public()
  @Get('feed')
  async generateRssFeed(@Res() res: Response) {
    const feed = await this.podcastService.generateRssFeed();

    res.set('Content-Type', 'application/rss+xml');
    res.send(feed);
  }

  // Parse RSS feed XML to JS Object
  @Public()
  @Get('parse-feed')
  async parseRssFeed() {
    return await this.podcastService.parseRssFeed();
  }

  // Get episode by episodeUUID
  @Public()
  @Get('episode/:episodeUUID')
  async getEpisode(@Param('episodeUUID') episodeUUID: string) {
    return await this.podcastService.getEpisode(episodeUUID);
  }
}

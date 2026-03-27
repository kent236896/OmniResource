import { Router } from 'express';
import axios from 'axios';

const router = Router();

router.post('/search', async (req, res) => {
  const { platform, keyword, type, count, orientation } = req.body;
  const results: any[] = [];

  try {
    if (platform === 'pexels') {
      const apiKey = process.env.PEXELS_API_KEY;
      if (!apiKey) return res.status(400).json({ error: 'Pexels API key missing' });

      const endpoint = type === 'image'
        ? 'https://api.pexels.com/v1/search'
        : 'https://api.pexels.com/videos/search';
      const orientationParam = orientation !== 'any' ? `&orientation=${orientation}` : '';
      const response = await axios.get(
        `${endpoint}?query=${keyword}&per_page=${count}${orientationParam}`,
        { headers: { Authorization: apiKey } },
      );
      const items = type === 'image' ? response.data.photos : response.data.videos;
      items?.forEach((item: any) => {
        results.push({
          id: `pexels-${item.id}`,
          url: type === 'image' ? item.src.original : item.video_files[0].link,
          previewUrl: type === 'image' ? item.src.medium : item.image,
          platform: 'pexels',
          type,
        });
      });
    } else if (platform === 'pixabay') {
      const apiKey = process.env.PIXABAY_API_KEY;
      if (!apiKey) return res.status(400).json({ error: 'Pixabay API key missing' });

      const orientationMap: Record<string, string> = { any: 'all', landscape: 'horizontal', portrait: 'vertical' };
      const pixabayOrientation = orientationMap[orientation] ?? 'all';
      const videoPath = type === 'video' ? 'videos/' : '';
      const endpoint = `https://pixabay.com/api/${videoPath}?key=${apiKey}&q=${encodeURIComponent(keyword)}&per_page=${count}&orientation=${pixabayOrientation}`;
      const response = await axios.get(endpoint);
      response.data.hits?.forEach((item: any) => {
        results.push({
          id: `pixabay-${item.id}`,
          url: type === 'image' ? item.largeImageURL : item.videos.large.url,
          previewUrl: type === 'image' ? item.webformatURL : item.videos.medium.thumbnail,
          platform: 'pixabay',
          type,
        });
      });
    }

    res.json(results);
  } catch (error) {
    console.error(`Search error (${platform}):`, error);
    res.status(500).json({ error: `Failed to search ${platform}` });
  }
});

export default router;

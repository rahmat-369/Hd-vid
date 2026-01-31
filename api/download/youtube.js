import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { videoId, url } = req.query;

  // Extract video ID if URL is provided
  let finalVideoId = videoId;
  if (url && !videoId) {
    finalVideoId = extractVideoIdFromUrl(url);
  }

  if (!finalVideoId) {
    return res.status(400).json({ 
      author: "Herza",
      success: false,
      error: "Video ID or URL is required" 
    });
  }

  try {
    // Fetch video info from YouTube (using yt-dlp or similar service)
    const videoInfo = await fetchYouTubeInfo(finalVideoId);
    
    return res.status(200).json({
      author: "Herza",
      success: true,
      data: videoInfo
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      author: "Herza",
      success: false,
      error: error.message || "Failed to fetch video information" 
    });
  }
}

// Function to extract video ID from URL
function extractVideoIdFromUrl(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // If it's already a video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }
  
  return null;
}

// Function to fetch YouTube video info (using external API service)
async function fetchYouTubeInfo(videoId) {
  // Option 1: Use a public YouTube info API
  // Option 2: Use yt-dlp executable (requires server with yt-dlp installed)
  // Option 3: Use a scraping service
  
  // For Vercel, we'll use a public API
  const apiUrl = `https://api.ytbapi.com/video_info?id=${videoId}`;
  
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    // Transform the data to match our format
    return transformYouTubeData(videoId, data);
  } catch (error) {
    // Fallback to scraping with ytdl-core alternative
    return await scrapeWithAlternative(videoId);
  }
}

// Alternative scraping method
async function scrapeWithAlternative(videoId) {
  // Using invidious or other YouTube frontend
  const invidiousUrl = `https://inv.riverside.rocks/api/v1/videos/${videoId}`;
  
  try {
    const response = await fetch(invidiousUrl);
    const data = await response.json();
    
    return {
      metadata: {
        title: data.title,
        duration: data.lengthSeconds,
        thumbnail: data.videoThumbnails[data.videoThumbnails.length - 1].url,
        videoId: videoId
      },
      download: {
        video: generateVideoUrls(videoId, data.title),
        audio: generateAudioUrls(videoId, data.title)
      }
    };
  } catch (error) {
    throw new Error('Could not fetch video information. Please try again later.');
  }
}

// Generate video URLs based on available formats
function generateVideoUrls(videoId, title) {
  const qualities = ['144', '240', '360', '480', '720', '1080'];
  const videoUrls = [];
  
  qualities.forEach(quality => {
    videoUrls.push({
      quality: quality,
      url: `https://cdn406.savetube.vip/media/${videoId}/${encodeURIComponent(title)}-${quality}-ytshorts.savetube.me.mp4`,
      filename: `${title}_${quality}p.mp4`.replace(/[^a-zA-Z0-9-_\.]/g, '_')
    });
  });
  
  return videoUrls;
}

// Generate audio URLs
function generateAudioUrls(videoId, title) {
  return [{
    format: "mp3",
    url: `https://cdn404.savetube.vip/media/${videoId}/${encodeURIComponent(title)}-128-ytshorts.savetube.me.mp3`,
    filename: `${title}.mp3`.replace(/[^a-zA-Z0-9-_\.]/g, '_')
  }];
}

// Transform data from external API
function transformYouTubeData(videoId, apiData) {
  return {
    metadata: {
      title: apiData.title || "Unknown Title",
      duration: apiData.duration || 0,
      thumbnail: apiData.thumbnail || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      videoId: videoId
    },
    download: {
      video: generateVideoUrls(videoId, apiData.title || "video"),
      audio: generateAudioUrls(videoId, apiData.title || "video")
    }
  };
}

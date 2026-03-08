export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { videos } = req.query;

  if (!videos) {
    return res.status(400).json({
      error: "videos parameter is required (format: owner_id_video_id)"
    });
  }

  const VK_TOKEN = process.env.VK_TOKEN;

  const url =
    `https://api.vk.com/method/video.get` +
    `?videos=${videos}` +
    `&access_token=${VK_TOKEN}` +
    `&v=5.131`;

  try {

    const response = await fetch(url);
    const data = await response.json();

    if (!data.response || !data.response.items) {
      return res.status(500).json({
        error: "Invalid VK response",
        raw: data
      });
    }

    const videosData = data.response.items.map(video => {

      const thumb = video.image?.[video.image.length - 1]?.url || null;

      return {
        id: video.id,
        owner_id: video.owner_id,
        title: video.title,
        description: video.description,
        duration: video.duration,
        thumb: thumb,
        player: video.player
      };

    });

    res.status(200).json({
      count: data.response.count,
      videos: videosData
    });

  } catch (error) {

    res.status(500).json({
      error: "VK request failed"
    });

  }

}

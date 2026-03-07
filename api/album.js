export default async function handler(req, res) {
  const { album, owner, limit = 100 } = req.query;

  if (!album || !owner) {
    return res.status(400).json({
      error: "album and owner parameters are required"
    });
  }

  const VK_TOKEN = process.env.VK_TOKEN;

  if (!VK_TOKEN) {
    return res.status(500).json({
      error: "VK_TOKEN is not configured"
    });
  }

  const url =
    `https://api.vk.com/method/photos.get` +
    `?owner_id=${owner}` +
    `&album_id=${album}` +
    `&count=${limit}` +
    `&photo_sizes=1` +
    `&access_token=${VK_TOKEN}` +
    `&v=5.131`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json(data.error);
    }

    const photos = data.response.items.map((item) => {
      const largest = item.sizes[item.sizes.length - 1];

      return {
        id: item.id,
        text: item.text,
        date: item.date,
        thumb: item.sizes[2]?.url || largest.url,
        image: largest.url,
        width: largest.width,
        height: largest.height
      };
    });

    res.status(200).json({
      count: data.response.count,
      photos
    });

  } catch (error) {
    res.status(500).json({
      error: "VK request failed",
      details: error.message
    });
  }
}

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { owner, album, limit = 50 } = req.query;

  if (!owner) {
    return res.status(400).json({ error: "owner is required" });
  }

  const VK_TOKEN = process.env.VK_TOKEN;

  const url =
    `https://api.vk.com/method/video.get` +
    `?owner_id=${owner}` +
    `&album_id=${album}` +
    `&count=${limit}` +
    `&access_token=${VK_TOKEN}` +
    `&v=5.131`;

  try {

    const response = await fetch(url);
    const data = await response.json();

    if (!data.response) {
      return res.status(400).json(data);
    }

    const videos = data.response.items.map(v => {

      const thumb =
        v.image?.[v.image.length - 1]?.url ||
        v.first_frame?.[0]?.url ||
        "";

      return {
        id: v.id,
        owner: v.owner_id,
        title: v.title,
        player: v.player,
        thumb: thumb,
        duration: v.duration
      };

    });

    res.status(200).json({
      count: data.response.count,
      videos
    });

  } catch (e) {

    res.status(500).json({
      error: "VK request failed"
    });

  }

}

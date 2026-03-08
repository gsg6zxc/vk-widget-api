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
      error: "videos parameter required (ownerid_videoid or ownerid_videoid_accesskey)"
    });
  }

  try {

    const url =
      `https://api.vk.com/method/video.get` +
      `?videos=${videos}` +
      `&access_token=${process.env.VK_TOKEN}` +
      `&v=5.199`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json(data);
    }

    const videosData = data.response.items.map(v => {

      let preview = null;

      if (v.image?.length) {
        const max = v.image.reduce((p, c) =>
          c.width > p.width ? c : p
        );
        preview = max.url;
      }

      return {
        id: v.id,
        owner_id: v.owner_id,
        title: v.title,
        description: v.description || "",
        duration: v.duration,
        player: v.player || `https://vk.com/video_ext.php?oid=${v.owner_id}&id=${v.id}&hd=2`,
        preview
      };

    });

    return res.status(200).json({
      count: data.response.count,
      videos: videosData
    });

  } catch (err) {

    return res.status(500).json({
      error: "VK request failed",
      details: err.message
    });

  }

}

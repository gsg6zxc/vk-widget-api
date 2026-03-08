export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { owner_id, video_id, access_key } = req.query;

  if (!owner_id || !video_id) {
    return res.status(400).json({
      error: "Missing owner_id or video_id"
    });
  }

  if (!process.env.VK_TOKEN) {
    return res.status(500).json({
      error: "VK_TOKEN not configured"
    });
  }

  try {

    const videoParam = access_key
      ? `${owner_id}_${video_id}_${access_key}`
      : `${owner_id}_${video_id}`;

    const url =
      `https://api.vk.com/method/video.get?videos=${videoParam}` +
      `&access_token=${process.env.VK_TOKEN}&v=5.199`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({
        error: "VK API error",
        details: data.error.error_msg
      });
    }

    if (!data.response?.items?.length) {
      return res.status(404).json({
        error: "Video not found"
      });
    }

    const video = data.response.items[0];

    let preview = null;

    if (video.image?.length) {
      const max = video.image.reduce((prev, current) =>
        current.width > prev.width ? current : prev
      );
      preview = max.url;
    }

    const player =
      video.player ||
      `https://vk.com/video_ext.php?oid=${video.owner_id}&id=${video.id}&hd=2`;

    return res.status(200).json({

      id: video.id,
      owner_id: video.owner_id,

      title: video.title,
      description: video.description || "",

      duration: video.duration,

      width: video.width,
      height: video.height,

      preview,
      player,

      views: video.views,

      date_unix: video.date,
      date_formatted: new Date(video.date * 1000).toLocaleString("ru-RU")

    });

  } catch (err) {

    return res.status(500).json({
      error: "Server error",
      details: err.message
    });

  }

}

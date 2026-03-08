export default async function handler(req, res) {

  // =========================
  // CORS
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { owner_id, post_id } = req.query;

  if (!owner_id || !post_id) {
    return res.status(400).json({ error: "Missing owner_id or post_id" });
  }

  if (!process.env.VK_TOKEN) {
    return res.status(500).json({ error: "VK_TOKEN not configured" });
  }

  try {

    // Получаем пост
    const wallUrl =
      `https://api.vk.com/method/wall.getById?posts=${owner_id}_${post_id}` +
      `&access_token=${process.env.VK_TOKEN}&v=5.199`;

    const wallResponse = await fetch(wallUrl);
    const wallData = await wallResponse.json();

    if (wallData.error) {
      return res.status(400).json({
        error: "VK API error (wall.getById)",
        details: wallData.error.error_msg
      });
    }

    if (!wallData.response?.items?.length) {
      return res.status(404).json({
        error: "Post not found or no access"
      });
    }

    const post = wallData.response.items[0];

    const videos = [];

    (post.attachments || []).forEach(att => {

      if (att.type === "video") {

        videos.push({
          id: att.video.id,
          owner_id: att.video.owner_id,
          access_key: att.video.access_key || null,
          title: att.video.title
        });

      }

    });

    if (!videos.length) {
      return res.status(200).json({
        videos: []
      });
    }

    // =========================
    // Получаем полную инфу о видео
    // =========================

    const videoIds = videos
      .map(v =>
        v.access_key
          ? `${v.owner_id}_${v.id}_${v.access_key}`
          : `${v.owner_id}_${v.id}`
      )
      .join(",");

    const videoUrl =
      `https://api.vk.com/method/video.get?videos=${videoIds}` +
      `&access_token=${process.env.VK_TOKEN}&v=5.199`;

    const videoResponse = await fetch(videoUrl);
    const videoData = await videoResponse.json();

    const result = [];

    if (videoData.response?.items?.length) {

      videoData.response.items.forEach(v => {

        let preview = null;

        if (v.image?.length) {
          const max = v.image.reduce((prev, cur) =>
            cur.width > prev.width ? cur : prev
          );
          preview = max.url;
        }

        result.push({
          id: v.id,
          owner_id: v.owner_id,
          title: v.title,
          duration: v.duration,
          width: v.width,
          height: v.height,
          player: v.player ||
            `https://vk.com/video_ext.php?oid=${v.owner_id}&id=${v.id}&hd=2`,
          preview
        });

      });

    }

    return res.status(200).json({
      owner_id: post.owner_id,
      post_id: post.id,
      videos: result
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }

}

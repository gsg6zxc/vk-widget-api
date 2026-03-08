export default async function handler(req, res) {

  // CORS
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

    // получаем пост
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

    // ищем только видео
    (post.attachments || []).forEach(att => {

      if (att.type === "video") {

        videos.push({
          id: att.video.id,
          owner_id: att.video.owner_id,
          access_key: att.video.access_key || null,
          title: att.video.title,
          page_url: `https://vk.com/video${att.video.owner_id}_${att.video.id}`
        });

      }

    });

    // если есть видео — получаем полную инфу
    if (videos.length > 0) {

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

      if (videoData.response?.items?.length) {

        videos.forEach(video => {

          const full = videoData.response.items.find(
            v => v.id === video.id && v.owner_id === video.owner_id
          );

          if (full) {

            video.description = full.description || "";
            video.duration = full.duration || null;
            video.views = full.views || 0;

            video.player = full.player || null;
            video.width = full.width || null;
            video.height = full.height || null;

            if (full.image?.length) {
              const maxPreview = full.image.reduce((prev, current) =>
                current.width > prev.width ? current : prev
              );
              video.preview = maxPreview.url;
            } else {
              video.preview = null;
            }

          }

        });

      }

      // fallback player
      videos.forEach(video => {
        if (!video.player) {
          video.player =
            `https://vk.com/video_ext.php?oid=${video.owner_id}` +
            `&id=${video.id}&hd=2`;
        }
      });

    }

    const formattedDate = new Date(post.date * 1000)
      .toLocaleString("ru-RU");

    return res.status(200).json({
      owner_id: post.owner_id,
      post_id: post.id,
      text: post.text || "",
      date_unix: post.date,
      date_formatted: formattedDate,
      videos
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
}

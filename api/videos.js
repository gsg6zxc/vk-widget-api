export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { owner_id, post_id } = req.query;

  if (!owner_id || !post_id) {
    return res.status(400).json({ error: "Missing owner_id or post_id" });
  }

  try {

    // получаем пост
    const wallUrl =
      `https://api.vk.com/method/wall.getById?posts=${owner_id}_${post_id}` +
      `&access_token=${process.env.VK_TOKEN}&v=5.199`;

    const wallRes = await fetch(wallUrl);
    const wallData = await wallRes.json();

    if (!wallData.response?.items?.length) {
      return res.status(404).json({ error: "Post not found" });
    }

    const post = wallData.response.items[0];

    const videos = [];

    // ищем видео в посте
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
      return res.status(404).json({ error: "No videos in post" });
    }

    // собираем ID видео
    const videoIds = videos
      .map(v =>
        v.access_key
          ? `${v.owner_id}_${v.id}_${v.access_key}`
          : `${v.owner_id}_${v.id}`
      )
      .join(",");

    // запрашиваем полную инфу
    const videoUrl =
      `https://api.vk.com/method/video.get?videos=${videoIds}` +
      `&access_token=${process.env.VK_TOKEN}&v=5.199`;

    const videoRes = await fetch(videoUrl);
    const videoData = await videoRes.json();

    if (videoData.error) {
      return res.status(400).json(videoData.error);
    }

    const result = videoData.response.items.map(video => {

      let preview = null;

      if (video.image?.length) {
        const max = video.image.reduce((p, c) =>
          c.width > p.width ? c : p
        );
        preview = max.url;
      }

      return {
        id: video.id,
        owner_id: video.owner_id,
        title: video.title,
        description: video.description || "",
        duration: video.duration,
        views: video.views || 0,
        preview,
        player: video.player ||
          `https://vk.com/video_ext.php?oid=${video.owner_id}&id=${video.id}&hd=2`,
        date: video.date
      };

    });

    return res.status(200).json({
      post_id: post.id,
      owner_id: post.owner_id,
      videos: result
    });

  } catch (err) {

    return res.status(500).json({
      error: "Server error",
      details: err.message
    });

  }

}

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

  const { owner_id, post_id } = req.query;

  if (!owner_id || !post_id) {
    return res.status(400).json({ error: "Missing owner_id or post_id" });
  }

  try {

    const wallUrl =
      `https://api.vk.com/method/wall.getById?posts=${owner_id}_${post_id}` +
      `&access_token=${process.env.VK_TOKEN}&v=5.199`;

    const wallResponse = await fetch(wallUrl);
    const wallData = await wallResponse.json();

    if (wallData.error) {
      return res.status(400).json({
        error: "VK API error",
        details: wallData.error.error_msg
      });
    }

    const post = wallData.response.items[0];

    const videos = [];

    (post.attachments || []).forEach(att => {

      if (att.type !== "video") return;

      const video = att.video;

      let preview = null;

      if (video.image?.length) {

        const max = video.image.reduce((p, c) =>
          c.width > p.width ? c : p
        );

        preview = max.url;

      }

      videos.push({
        id: video.id,
        owner_id: video.owner_id,
        access_key: video.access_key || null,
        title: video.title,
        duration: video.duration || null,
        preview,
        page_url: `https://vk.com/video${video.owner_id}_${video.id}`,
        player: `https://vk.com/video_ext.php?oid=${video.owner_id}&id=${video.id}&hd=2`
      });

    });

    return res.status(200).json({
      owner_id: post.owner_id,
      post_id: post.id,
      videos
    });

  } catch (err) {

    return res.status(500).json({
      error: "Server error",
      details: err.message
    });

  }

}

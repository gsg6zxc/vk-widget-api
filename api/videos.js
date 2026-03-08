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

    const wallUrl =
      `https://api.vk.com/method/wall.getById?posts=${owner_id}_${post_id}&v=5.199`;

    const response = await fetch(wallUrl);
    const data = await response.json();

    if (!data.response?.items?.length) {
      return res.status(404).json({ error: "Post not found" });
    }

    const post = data.response.items[0];

    const videos = (post.attachments || [])
      .filter(att => att.type === "video")
      .map(att => {

        const v = att.video;

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
          duration: v.duration,
          player: v.player ||
            `https://vk.com/video_ext.php?oid=${v.owner_id}&id=${v.id}`,
          preview
        };

      });

    return res.status(200).json({
      videos
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }

}

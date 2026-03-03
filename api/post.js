export default async function handler(req, res) {

  // --- CORS ---
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
    const url = `https://api.vk.com/method/wall.getById?posts=${owner_id}_${post_id}&access_token=${process.env.VK_TOKEN}&v=5.199`;

    const vkResponse = await fetch(url);

    if (!vkResponse.ok) {
      return res.status(vkResponse.status).json({
        error: "VK API request failed"
      });
    }

    const data = await vkResponse.json();

    if (data.error) {
      return res.status(400).json({
        error: "VK API error",
        details: data.error.error_msg
      });
    }

    if (!data.response?.items?.length) {
      return res.status(404).json({
        error: "Post not found or no access"
      });
    }

    const post = data.response.items[0];

    // --- Вложения ---
    const photos = [];
    const videos = [];
    const documents = [];
    const links = [];

    (post.attachments || []).forEach(att => {

      switch (att.type) {

        case "photo":
          if (att.photo?.sizes?.length) {
            const maxSize = att.photo.sizes.reduce((prev, current) =>
              current.width > prev.width ? current : prev
            );

            photos.push({
              id: att.photo.id,
              url: maxSize.url,
              width: maxSize.width,
              height: maxSize.height
            });
          }
          break;

        case "video":
          videos.push({
            id: att.video.id,
            owner_id: att.video.owner_id,
            title: att.video.title,
            url: `https://vk.com/video${att.video.owner_id}_${att.video.id}`
          });
          break;

        case "doc":
          documents.push({
            id: att.doc.id,
            title: att.doc.title,
            url: att.doc.url,
            ext: att.doc.ext,
            size: att.doc.size
          });
          break;

        case "link":
          links.push({
            title: att.link.title,
            url: att.link.url,
            description: att.link.description || null
          });
          break;
      }

    });

    const formattedDate = new Date(post.date * 1000)
      .toLocaleString("ru-RU");

    return res.status(200).json({
      owner_id: post.owner_id,
      post_id: post.id,

      text: post.text || "",

      date_unix: post.date,
      date_formatted: formattedDate,

      hash: post.hash || null,

      embed_url: post.hash
        ? `https://vk.com/widget_post.php?owner_id=${post.owner_id}&post_id=${post.id}&hash=${post.hash}`
        : null,

      photos,
      videos,
      documents,
      links
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
}

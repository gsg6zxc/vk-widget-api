export default async function handler(req, res) {

  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Обработка preflight запроса
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
        error: "VK API request failed",
        status: vkResponse.status
      });
    }

    const data = await vkResponse.json();

    // Если VK вернул ошибку
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

    const formattedDate = new Date(post.date * 1000)
      .toLocaleString("ru-RU");

    return res.status(200).json({
      owner_id: post.owner_id,
      post_id: post.id,
      date_unix: post.date,
      date_formatted: formattedDate,
      hash: post.hash || null,
      embed_url: `https://vk.com/widget_post.php?owner_id=${post.owner_id}&post_id=${post.id}&hash=${post.hash}`
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
}

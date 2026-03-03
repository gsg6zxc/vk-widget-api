export default async function handler(req, res) {
  const { owner_id, post_id } = req.query;

  if (!owner_id || !post_id) {
    return res.status(400).json({ error: "Missing owner_id or post_id" });
  }

  try {
    const url = `https://api.vk.com/method/wall.getById?posts=${owner_id}_${post_id}&access_token=${process.env.VK_TOKEN}&v=5.199`;

    const vkResponse = await fetch(url);
    const data = await vkResponse.json();

    if (!data.response?.items?.length) {
      return res.status(404).json({ error: "Post not found or no access" });
    }

    const post = data.response.items[0];

    const formattedDate = new Date(post.date * 1000).toLocaleString("ru-RU");

    res.status(200).json({
      owner_id: post.owner_id,
      post_id: post.id,
      date_unix: post.date,
      date_formatted: formattedDate,
      hash: post.hash,
      embed_url: `https://vk.com/widget_post.php?owner_id=${post.owner_id}&post_id=${post.id}&hash=${post.hash}`
    });

  } catch (err) {
    res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
}

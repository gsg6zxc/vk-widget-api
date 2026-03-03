export default async function handler(req, res) {
  const { owner_id, post_id } = req.query;

  if (!owner_id || !post_id) {
    return res.status(400).json({ error: "Missing owner_id or post_id" });
  }

  try {
    const vkResponse = await fetch(
      `https://api.vk.com/method/wall.getById?posts=${owner_id}_${post_id}&access_token=${process.env.VK_TOKEN}&v=5.199`
    );

    const data = await vkResponse.json();

    if (!data.response) {
      return res.status(400).json({ error: data.error });
    }

    const post = data.response[0];

    res.status(200).json({
      date: post.date,
      hash: post.hash,
      embed: `https://vk.com/widget_post.php?owner_id=${owner_id}&post_id=${post_id}&hash=${post.hash}`
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

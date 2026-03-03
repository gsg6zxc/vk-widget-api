export default async function handler(req, res) {
  const { owner_id, post_id } = req.query;

  try {
    const url = `https://api.vk.com/method/wall.getById?posts=${owner_id}_${post_id}&access_token=${process.env.VK_TOKEN}&v=5.199`;

    const vkResponse = await fetch(url);
    const data = await vkResponse.json();

    return res.status(200).json({
      debug: true,
      vk_raw_response: data
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
}

export default async function handler(req, res) {

  const token = process.env.VK_TOKEN

  const video = req.query.video

  if (!video) {
    res.status(400).json({ error: "video parameter required" })
    return
  }

  const url = `https://api.vk.com/method/video.get?videos=${video}&access_token=${token}&v=5.199`

  try {

    const response = await fetch(url)
    const data = await response.json()

    const item = data.response.items[0]

    const result = {
      title: item.title,
      embed: item.player,
      preview: item.image?.[0]?.url || null,
      vk_link: `https://vk.com/video${video}`
    }

    res.status(200).json(result)

  } catch (err) {

    res.status(500).json({ error: "VK request failed" })

  }

}

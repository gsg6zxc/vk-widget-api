export default async function handler(req, res) {

  const token = process.env.VK_TOKEN
  const videos = req.query.videos

  if (!videos) {
    return res.status(400).json({error: "videos parameter required"})
  }

  const url = `https://api.vk.com/method/video.get?videos=${videos}&access_token=${token}&v=5.131`

  const response = await fetch(url)
  const data = await response.json()

  res.status(200).json(data)
}

export default async function handler(req, res) {

  const token = process.env.VK_TOKEN
  const owner_id = req.query.owner_id || "-123456"

  const url = `https://api.vk.com/method/video.get?owner_id=${owner_id}&v=5.131&access_token=${token}`

  const response = await fetch(url)
  const data = await response.json()

  res.status(200).json(data)
}

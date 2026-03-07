export default async function handler(req, res) {
  const token = process.env.VK_TOKEN

  const url = `https://api.vk.com/method/account.getAppPermissions?access_token=${token}&v=5.131`

  const response = await fetch(url)
  const data = await response.json()

  res.status(200).json(data)
}

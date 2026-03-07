// api/albums.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const GROUP_ID = "236188200"; // замените на ID вашего сообщества
  const ACCESS_TOKEN = process.env.VK_TOKEN_GROUP; // токен VK с правами photos

  try {
    const response = await fetch(
      `https://api.vk.com/method/photos.getAlbums?owner_id=-${GROUP_ID}&access_token=${ACCESS_TOKEN}&v=5.131`
    );
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error });
    }

    res.status(200).json(data.response.items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

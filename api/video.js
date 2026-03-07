import axios from "axios";

export default async function handler(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "Missing url" });
    }

    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://vk.com/"
      }
    });

    const html = response.data;

    const match = html.match(/playerParams\s*=\s*(\{.+?\});/s);

    if (!match) {
      return res.status(404).json({
        error: "playerParams not found (VK probably returned a stub page)"
      });
    }

    const json = JSON.parse(match[1]);
    const player = json.player.params[0];

    return res.status(200).json({
      title: player.md_title,
      preview: player.jpg,
      embed: player.player
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
}

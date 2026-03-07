import axios from "axios";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "No video URL provided" });
  }

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    const html = response.data;

    const match = html.match(/playerParams\s*=\s*(\{.+?\});/s);

    if (!match) {
      return res.status(404).json({ error: "Video data not found" });
    }

    const player = JSON.parse(match[1]).player.params[0];

    res.json({
      title: player.md_title,
      preview: player.jpg,
      embed: player.player
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch video" });
  }
}

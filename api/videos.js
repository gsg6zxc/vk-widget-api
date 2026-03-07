export default async function handler(req, res) {
  const token = process.env.VK_TOKEN; 


  const url = `https://api.vk.com/method/account.getAppPermissions?access_token=${token}&v=5.131`;

  try {

    const response = await fetch(url);
    const data = await response.json();


    if (data.error) {
      return res.status(400).json({ error: data.error });
    }


    return res.status(200).json(data);
  } catch (error) {

    return res.status(500).json({ error: 'Ошибка при запросе разрешений' });
  }
}

const token = 'VK_TOKEN';
const url = `https://api.vk.com/method/account.getAppPermissions?access_token=${token}&v=5.131`;

fetch(url)
  .then(response => response.json())
  .then(data => {
    if (data.response) {
      console.log('Разрешения токена:', data.response);
    } else {
      console.error('Ошибка:', data.error);
    }
  })
  .catch(error => console.error('Ошибка запроса:', error));

const API_KEY = 'YOUR_API_KEY_HERE';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

fetch(API_URL)
.then(async r => {
  const data = await r.json();
  data.models.forEach(m => console.log(m.name));
})
.catch(e => console.error(e));

const axios = require('axios');

async function testProperties() {
  try {
    const res = await axios.get('http://localhost:8000/api/public/properties?take=1');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error(e.message);
    if (e.response) {
      console.error(e.response.data);
    }
  }
}

testProperties();

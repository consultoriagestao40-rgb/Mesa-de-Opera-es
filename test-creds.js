const axios = require('axios');
async function test() {
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('username', 'cristiano@grupojvsserv.com.br');
  params.append('password', '8Gmw.@DzuuHEz9');
  params.append('client_id', '3');
  try {
    const res = await axios.post('https://autenticador.secullum.com.br/Token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    console.log('SUCCESS API LOGIN! Token:', res.data.access_token.substring(0, 10) + '...');
    const dbList = await axios.get('https://autenticador.secullum.com.br/ContasSecullumExterno/ListarBancos/', {
      headers: { 'Authorization': `Bearer ${res.data.access_token}` }
    });
    console.log('Databases:', dbList.data);
  } catch (err) {
    console.log('FAILED API LOGIN:', err.response ? err.response.data : err.message);
  }
}
test();

const axios = require('axios');
async function test() {
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', 'cristiano@grupojvsserv.com.br');
    params.append('password', '8Gmw.@DzuuHEz9');
    params.append('client_id', '3'); 

    const authResp = await axios.post('https://autenticador.secullum.com.br/Token', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const token = authResp.data.access_token;
    
    const res = await axios.get('https://pontowebintegracaoexterna.secullum.com.br/IntegracaoExterna/Funcionarios', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'secullumidbancoselecionado': '85740'
        }
    });

    console.log(`SUCCESS (ID INT): Got ${res.data.length} employees!`);
  } catch (e) {
    console.log(`FAILED (ID INT): ${e.response?.data?.details || e.message}`);
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', 'cristiano@grupojvsserv.com.br');
    params.append('password', '8Gmw.@DzuuHEz9');
    params.append('client_id', '3'); 

    const authResp = await axios.post('https://autenticador.secullum.com.br/Token', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const token = authResp.data.access_token;

    const res2 = await axios.get('https://pontowebintegracaoexterna.secullum.com.br/IntegracaoExterna/Funcionarios', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'secullumidbancoselecionado': '4a2ff5a0-11ab-48fb-8f36-f97ca5af700c'
        }
    });

    console.log(`SUCCESS (ID GUID): Got ${res2.data.length} employees!`);
  } catch (e) {
    console.log(`FAILED (ID GUID): ${e.response?.data?.details || e.message}`);
  }
}
test();

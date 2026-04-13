import axios from 'axios';
async function test() {
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

  console.log(JSON.stringify(res.data[0], null, 2));
}
test();

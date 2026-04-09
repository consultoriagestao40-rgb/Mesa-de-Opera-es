import axios from 'axios';

/**
 * Secullum API Service
 * 
 * Handles authentication and data retrieval from Secullum Ponto Web.
 * Documentation: https://pontowebintegracaoexterna.secullum.com.br/docs/
 */

const SECULLUM_AUTH_URL = 'https://autenticador.secullum.com.br/Token';
const SECULLUM_API_URL = 'https://pontowebintegracaoexterna.secullum.com.br/IntegracaoExterna';
const SECULLUM_BANCOS_URL = 'https://autenticador.secullum.com.br/ContasSecullumExterno/ListarBancos/';

// Environment Variables
const USERNAME = process.env.SECULLUM_USERNAME;
const PASSWORD = process.env.SECULLUM_PASSWORD;
const CLIENT_ID = process.env.SECULLUM_CLIENT_ID || '3';
const DATABASE_ID = process.env.SECULLUM_DATABASE_ID;

// Token Cache
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Authenticates with Secullum and returns a Bearer token.
 */
async function getAccessToken(): Promise<string> {
    const now = Date.now();
    if (cachedToken && tokenExpiry && now < tokenExpiry) {
        return cachedToken;
    }

    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('username', USERNAME || '');
        params.append('password', PASSWORD || '');
        params.append('client_id', CLIENT_ID);

        const response = await axios.post(SECULLUM_AUTH_URL, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        cachedToken = response.data.access_token;
        // Expire slightly early to be safe (convert seconds to ms)
        tokenExpiry = now + (response.data.expires_in * 1000) - 60000;

        return cachedToken!;
    } catch (error: any) {
        console.error('[Secullum] Authentication failed:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with Secullum');
    }
}

/**
 * Basic request wrapper with auth and database headers
 */
async function secullumRequest(endpoint: string, params: any = {}) {
    const token = await getAccessToken();
    const url = endpoint.startsWith('http') ? endpoint : `${SECULLUM_API_URL}/${endpoint}`;

    try {
        const response = await axios.get(url, {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'secullumidbancoselecionado': DATABASE_ID || ''
            }
        });
        return response.data;
    } catch (error: any) {
        console.error(`[Secullum] Request to ${endpoint} failed:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Lists available databases for the account.
 * Useful for finding the correct SECULLUM_DATABASE_ID.
 */
export async function listDatabases() {
    const token = await getAccessToken();
    try {
        const response = await axios.get(SECULLUM_BANCOS_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error: any) {
        console.error('[Secullum] Failed to list databases:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Fetches all employees.
 */
export async function getEmployees() {
    return secullumRequest('Funcionarios');
}

/**
 * Fetches all work schedules / shifts.
 */
export async function getSchedules() {
    return secullumRequest('Horarios');
}

/**
 * Fetches punches for a specific date range.
 * Dates should be in ISO format or YYYY-MM-DD.
 */
export async function getPunches(startDate: string, endDate: string) {
    return secullumRequest('Batidas', {
        DataInicio: startDate,
        DataFim: endDate
    });
}

/**
 * Fetches punches for a specific employee.
 */
export async function getEmployeePunches(pis: string, startDate: string, endDate: string) {
    return secullumRequest('Batidas', {
        FuncionarioPis: pis,
        DataInicio: startDate,
        DataFim: endDate
    });
}

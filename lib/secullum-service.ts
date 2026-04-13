import axios from 'axios';
import { getNexusConfigs } from './config-service';

/**
 * Secullum API Service (Refactored for Nexus)
 * 
 * Handles authentication and data retrieval using dynamic DB configuration.
 */

const SECULLUM_AUTH_URL = 'https://autenticador.secullum.com.br/Token';
const SECULLUM_API_URL = 'https://pontowebintegracaoexterna.secullum.com.br/IntegracaoExterna';

// Token Cache
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

async function getAccessToken(): Promise<string> {
    const now = Date.now();
    if (cachedToken && tokenExpiry && now < tokenExpiry) {
        return cachedToken;
    }

    try {
        const configs = await getNexusConfigs();
        const username = configs['SECULLUM_USERNAME'];
        const password = configs['SECULLUM_PASSWORD'];
        
        if (!username || !password) {
            throw new Error('Secullum credentials missing in NexusConfig');
        }

        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('username', username);
        params.append('password', password);
        params.append('client_id', '3'); // Standard Integration Client ID

        const response = await axios.post(SECULLUM_AUTH_URL, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        cachedToken = response.data.access_token;
        tokenExpiry = now + (response.data.expires_in * 1000) - 60000;

        return cachedToken!;
    } catch (error: any) {
        console.error('[Secullum Auth] Failure:', error.response?.data || error.message);
        throw new Error('Secullum Authentication Failed');
    }
}

async function secullumRequest(endpoint: string, params: any = {}) {
    const token = await getAccessToken();
    const configs = await getNexusConfigs();
    const databaseId = configs['SECULLUM_DATABASE_ID'];

    if (!databaseId) {
        throw new Error('Secullum Database ID missing in NexusConfig');
    }

    const url = `${SECULLUM_API_URL}/${endpoint}`;

    try {
        const response = await axios.get(url, {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'DBSecullumID': databaseId
            }
        });
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 500) {
            console.error(`[Secullum API] 500 Error at ${endpoint}. Check if DBSecullumID is correct:`, databaseId);
        }
        console.error(`[Secullum API] Request to ${endpoint} failed:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Lists available databases for the account.
 */
export async function listDatabases() {
    const token = await getAccessToken();
    try {
        const response = await axios.get('https://autenticador.secullum.com.br/ContasSecullumExterno/ListarBancos/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error: any) {
        console.error('[Secullum] Failed to list databases:', error.response?.data || error.message);
        throw error;
    }
}

export async function getEmployees() {
    return secullumRequest('Funcionarios');
}

export async function getSchedules() {
    return secullumRequest('Horarios');
}

export async function getPunches(startDate: string, endDate: string) {
    return secullumRequest('Batidas', {
        DataInicio: startDate,
        DataFim: endDate
    });
}

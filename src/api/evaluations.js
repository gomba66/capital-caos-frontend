import axios from "axios";

const BASE = "/api/evaluations";

export async function getEvaluations({ limit = 50, offset = 0, symbol, side, result, scanner, hours = 24 } = {}) {
    const params = { limit, offset, hours };
    if (symbol) params.symbol = symbol;
    if (side) params.side = side;
    if (result !== undefined && result !== null) params.result = result;
    if (scanner) params.scanner = scanner;
    const res = await axios.get(BASE, { params });
    return res.data;
}

export async function getEvaluationStats({ side, hours = 24 } = {}) {
    const params = { hours };
    if (side) params.side = side;
    const res = await axios.get(`${BASE}/stats`, { params });
    return res.data;
}

export async function getEvaluationConditions(language) {
    const res = await axios.get(`${BASE}/conditions`, {
        headers: { "Accept-Language": language },
    });
    return res.data;
}

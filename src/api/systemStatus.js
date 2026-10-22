import axios from "axios";

export async function getSystemStatus({ publicView = false } = {}) {
  const endpoint = publicView
    ? "/api/system-status"
    : "/api/admin/system-status";
  const response = await axios.get(endpoint, {
    timeout: 10000,
  });
  return response.data;
}

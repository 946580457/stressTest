import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  timeout: 10000
});

export function sendStressRequest(config, signal) {
  const { url, method = "post", params, data, timeout } = config;
  const requestConfig = {
    url,
    method,
    params,
    data,
    timeout,
    signal
  };

  if (/^https?:\/\//i.test(url)) {
    requestConfig.baseURL = undefined;
  }

  return client.request(requestConfig);
}

export default client;

import { api } from "../../lib/httpClient";

export const loginUser = (payload) =>
  api.post("/auth/login", payload).then((r) => r.data);

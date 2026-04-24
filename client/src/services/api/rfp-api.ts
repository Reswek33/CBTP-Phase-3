import { api } from "./api-client";

/**
 * Creates a new RFP.
 * @param data - Must be a FormData object containing both fields (title, description, etc.)
 * and the 'rfp_doc' file.
 */
export const createRfps = async (data: FormData) => {
  const response = await api.post("/rfps", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getRfps = async () => {
  const response = await api.get("/rfps");
  return response.data;
};

export const getRfpsById = async (id: string) => {
  const response = await api.get(`/rfps/${id}`);
  return response.data;
};

export const cancelRfp = async (id: string) => {
  const response = await api.patch(`/rfps/${id}`);
  return response.data;
};

export const getMyRfps = async () => {
  const response = await api.get("/rfps/my-rfps");
  return response.data;
};

export const deleteRfp = async (id: string) => {
  const response = await api.delete(`/rfps/${id}/delete`);
  return response.data;
};

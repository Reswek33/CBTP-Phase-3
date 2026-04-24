import { api } from "./api-client";

export const updateProfile = async (data: unknown) => {
  const response = await api.patch("/buyer/profile", data);
  return response.data;
};

export const uploadDoc = async (formdata: FormData) => {
  const response = await api.post("/buyer/documents", formdata, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const deleteDocument = async (docId: string) => {
  const response = await api.delete(`/buyer/documents/${docId}/delete`);
  return response.data;
};

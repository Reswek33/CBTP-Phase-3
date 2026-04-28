import { api } from "./api-client";

export const uploadSupplierDocument = async (formdata: FormData) => {
  console.log(formdata);
  const response = await api.post("/supplier/documents", formdata, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const updateSupplierProfile = async (data: unknown) => {
  const response = await api.patch("/supplier/profile", data);
  return response.data;
};

export const getMyBids = async () => {
  const response = await api.get("/supplier/bids");
  return response.data;
};

export const deleteDocument = async (docId: string) => {
  const response = await api.delete(`/supplier/documents/${docId}/delete`);
  return response.data;
};

export const getSuppliersForInvite = async (params = {}) => {
  const response = await api.get("/supplier/eligible-for-bidroom", {
    params,
  });
  console.log(response.data);
  return response.data;
};

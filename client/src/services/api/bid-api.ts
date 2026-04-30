import { api } from "./api-client";

/**
 * Submit a new bid on an RFP.
 * @param data - Can be FormData (if uploading documents) or a plain object.
 */
export const createBid = async (rfpId: string, data: FormData | object) => {
  const isFormData = data instanceof FormData;
  const response = await api.post(`/bids/${rfpId}`, data, {
    headers: {
      "Content-Type": isFormData ? "multipart/form-data" : "application/json",
    },
  });
  return response.data;
};

/**
 * Get a list of bids.
 * - For Suppliers: Returns their own bid history.
 * - For Buyers: Returns bids received for their RFPs.
 */
export const getBids = async () => {
  const response = await api.get("/bids");
  return response.data;
};

/**
 * Get details of a specific bid.
 */
export const getBidById = async (id: string) => {
  const response = await api.get(`/bids/${id}`);
  return response.data;
};

/**
 * Award a bid (Only for Buyers).
 * Marks this bid as the winner and closes the RFP.
 */
export const awardBid = async (id: string) => {
  const response = await api.patch(`/bids/${id}/award`);
  return response.data;
};

export const updateApplicationStatus = async (
  id: string,
  data: { status: string; rejectionReason: string },
) => {
  const response = await api.patch(`/bids/${id}/status`, data);
  return response.data;
};

/**
 * Evaluate technical proposal (Only for Buyers in Two-Envelope workflow).
 */
export const evaluateTechnicalBid = async (
  id: string,
  data: { status: "QUALIFIED" | "DISQUALIFIED"; score: number; rejectionReason?: string },
) => {
  const response = await api.patch(`/bids/${id}/technical`, data);
  return response.data;
};

export const applyToBid = async (id: string, data: FormData) => {
  const isFormData = data instanceof FormData;

  const response = await api.post(`bids/apply/${id}`, data, {
    headers: {
      "Content-Type": isFormData ? "multipart/form-data" : "application/json",
    },
  });

  return response.data;
};

export const submitFinancialBid = async (id: string, amount: number) => {
  const response = await api.patch(`/bids/${id}/submit-amount`, { amount });
  return response.data;
};

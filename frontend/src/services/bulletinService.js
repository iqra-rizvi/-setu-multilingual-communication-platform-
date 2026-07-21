import api from "./api";

// Get all bulletins
export const getBulletins = async () => {
  const response = await api.get("/bulletins/");
  return response.data;
};

// Get one bulletin
export const getBulletin = async (id) => {
  const response = await api.get(`/bulletins/${id}`);
  return response.data;
};

// Create bulletin
export const createBulletin = async (data) => {
  const response = await api.post("/bulletins/", data);
  return response.data;
};

// Update bulletin
export const updateBulletin = async (id, data) => {
  const response = await api.put(`/bulletins/${id}`, data);
  return response.data;
};

// Publish bulletin
export const publishBulletin = async (id) => {
  const response = await api.post(
    `/bulletins/${id}/publish`
  );

  return response.data;
};

// Stop bulletin
export const stopBulletin = async (id) => {
  const response = await api.post(
    `/bulletins/${id}/stop`
  );

  return response.data;
};

// Delete bulletin
export const deleteBulletin = async (id) => {
  const response = await api.delete(
    `/bulletins/${id}`
  );

  return response.data;
};
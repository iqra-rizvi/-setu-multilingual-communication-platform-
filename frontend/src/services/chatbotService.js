import api from "./api";

export const sendMessageToBot = async (question) => {
  try {
    const response = await api.post("/chat/", {
      question,
    });

    return response.data.answer;
  } catch (error) {
    return "Sorry, I couldn't connect to the server.";
  }
};
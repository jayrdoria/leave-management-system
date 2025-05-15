const axios = require("axios");

async function createTestUser() {
  try {
    const response = await axios.post(
      "http://localhost:5050/api/auth/create-test-user",
      {
        name: "Bien Tech",
        email: "bien@company.com",
        password: "bien123",
        role: "manager",
        department: "Tech",
      }
    );

    console.log("✅ User created:", response.data);
  } catch (err) {
    if (err.response) {
      console.error("❌ Error Response:", err.response.data);
    } else {
      console.error("❌ Error:", err.message);
    }
  }
}

createTestUser();

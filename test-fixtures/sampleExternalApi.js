const axios = require("axios");

// Hardcoded URL, no nearby env var check — should be flagged as risky
function callOpenAI() {
  axios.get("https://api.openai.com/v1/models", {
    headers: { Authorization: "Bearer sk-12345" },
  });
}

// Hardcoded URL, but an env var for the key is used nearby — safer
function callGoogleMaps() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  fetch(`https://maps.googleapis.com/maps/api/geocode/json?key=${apiKey}`);
}

// Not an external Api— should be ignored
function callOwnBackend() {
  axios.get("/users");
}

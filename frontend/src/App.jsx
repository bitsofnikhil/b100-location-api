import { useState } from "react";
import "./App.css";

function App() {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");

  const searchVillage = async () => {
    if (!apiKey || !apiSecret || !query) {
      setMessage("Please enter API key, API secret, and search query.");
      return;
    }

    try {
      setMessage("Searching...");

      const response = await fetch(
        `http://localhost:5000/api/v1/search?q=${query}`,
        {
          headers: {
            "x-api-key": apiKey,
            "x-api-secret": apiSecret,
          },
        }
      );

      const data = await response.json();

      if (!data.success) {
        setMessage(data.message || "Search failed.");
        setResults([]);
        return;
      }

      setResults(data.data);
      setMessage(`Found ${data.count} result(s).`);
    } catch (error) {
      setMessage("Backend not reachable. Make sure backend is running on port 5000.");
      setResults([]);
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <h1>B100 Location Intelligence API Platform</h1>
        <p>
          A secure B2B API platform for Indian states, districts,
          sub-districts, and villages.
        </p>
      </header>

      <section className="card">
        <h2>API Authentication</h2>

        <div className="grid">
          <input
            type="text"
            placeholder="Enter API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />

          <input
            type="text"
            placeholder="Enter API Secret"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
          />
        </div>
      </section>

      <section className="card">
        <h2>Search Village</h2>

        <div className="searchBox">
          <input
            type="text"
            placeholder="Search village, e.g. Rampur"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button onClick={searchVillage}>Search</button>
        </div>

        {message && <p className="message">{message}</p>}
      </section>

      <section className="card">
        <h2>Search Results</h2>

        {results.length === 0 ? (
          <p>No results to show.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Village</th>
                <th>Sub-District</th>
                <th>District</th>
                <th>State</th>
              </tr>
            </thead>

            <tbody>
              {results.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.subDistrict?.name}</td>
                  <td>{item.subDistrict?.district?.name}</td>
                  <td>{item.subDistrict?.district?.state?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2>Use Cases</h2>
        <div className="usecases">
          <span>Address Forms</span>
          <span>KYC Systems</span>
          <span>Logistics Platforms</span>
          <span>Dropdown APIs</span>
        </div>
      </section>
    </div>
  );
}

export default App;
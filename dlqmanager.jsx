import React, { useState, useEffect } from "react";
import axios from "axios";

const DLQManager = () => {
  const [queues, setQueues] = useState([]); // Stores fetched DLQs
  const [selectedQueues, setSelectedQueues] = useState([]); // Stores selected DLQs
  const [action, setAction] = useState(""); // Stores the selected action
  const [loading, setLoading] = useState(false); // Tracks API request status
  const [results, setResults] = useState([]); // Stores API response messages

  // Fetch DLQs on component mount
  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/dlqs");
        setQueues(response.data);
      } catch (error) {
        console.error("Error fetching DLQs:", error);
      }
    };
    fetchQueues();
  }, []);

  // Handle queue selection
  const handleSelect = (queue) => {
    setSelectedQueues((prev) =>
      prev.includes(queue) ? prev.filter((q) => q !== queue) : [...prev, queue]
    );
  };

  // Trigger API request for redrive or purge
  const handleAction = async () => {
    if (!action) return alert("Please select an action (Redrive or Purge)");
    if (!selectedQueues.length) return alert("No queues selected");

    setLoading(true);
    try {
      const endpoint =
        action === "redrive"
          ? "http://127.0.0.1:5000/dlqs/redrive"
          : "http://127.0.0.1:5000/dlqs/purge";

      const response = await axios.post(endpoint, { queues: selectedQueues });
      setResults(response.data);
    } catch (error) {
      console.error("Error:", error);
      setResults([{ error: "Action failed. Check logs." }]);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Dead Letter Queue Manager</h2>

      {/* Action Selection */}
      <label>
        <input
          type="radio"
          name="action"
          value="redrive"
          onChange={() => setAction("redrive")}
          checked={action === "redrive"}
        />
        Redrive Messages
      </label>
      <label>
        <input
          type="radio"
          name="action"
          value="purge"
          onChange={() => setAction("purge")}
          checked={action === "purge"}
        />
        Purge Queue
      </label>

      {/* Display Queues */}
      <h3>DLQs</h3>
      {queues.map((queue) => (
        <div key={queue.queue_url}>
          <input
            type="checkbox"
            onChange={() => handleSelect(queue)}
            checked={selectedQueues.includes(queue)}
          />
          <span>{queue.queue_url}</span>
        </div>
      ))}

      {/* Action Button */}
      <button onClick={handleAction} disabled={loading}>
        {loading ? "Processing..." : `Execute ${action}`}
      </button>

      {/* Results Display */}
      <h3>Results</h3>
      <ul>
        {results.map((result, index) => (
          <li key={index}>
            {result.queue_url}: {result.status || result.error}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DLQManager;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import config from "../config.json";
import { Chart } from "chart.js/auto";
import { Line } from "react-chartjs-2";
import "./WelcomePage.css";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import Cookies from "js-cookie";

function Welcome() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState(null);
  const [sensorData, setsensorData] = useState({
    bpm: null,
    ecg: {
      ecg1: null,
      ecg2: null,
      ecg3: null,
    },
  });

  const [sensorDataArr, setsensorDataArr] = useState([]); // For recentSensorData (array of objects)
  const [chartBPMData, setchartBPMData] = useState({
    labels: [],
    datasets: [],
  });
  const [ecg1Data, setEcg1Data] = useState({
    labels: [],
    datasets: [],
  });
  const [ecg2Data, setEcg2Data] = useState({
    labels: [],
    datasets: [],
  });
  const [ecg3Data, setEcg3Data] = useState({
    labels: [],
    datasets: [],
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async (retries = 1) => {
      try {
        const response = await fetch(
          `http://${config.HOST}:${config.PORT}/welcome`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Authenticated successfully!");
          setUsername(data.username);
          setIsAuthenticated(true);
          setLoading(false);
        } else {
          throw new Error("Not Authenticated");
        }
      } catch (error) {
        if (retries > 0) {
          console.log(
            `Auth check failed, retrying... (${retries} attempts left)`
          );
          setTimeout(() => checkAuth(retries - 1), 2000);
        } else {
          console.error("Auth check failed after retries:", error);
          navigate("/login");
        }
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      const cookie_value = Cookies.get("token");

      const ws = new WebSocket(
        `ws://${config.HOST}:${config.PORT}/mcuData?token=${JSON.stringify(
          cookie_value
        )}`
      );

      ws.onopen = () => {
        console.log("WebSocket connection opened");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setsensorDataArr(data.recentSensorData);
          setsensorData(data.recentValue);
        } catch (error) {
          console.error("Error processing message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("Error processing message:", error);
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
          console.log("WebSocket connection closed");
        }
      };
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (sensorDataArr.length === 0) return;

    // Process BPM data for plotting
    const labels = sensorDataArr.map((item) =>
      new Date(item.timestamp).toLocaleTimeString()
    );
    const BPMvalues = sensorDataArr.map((item) => item.bpm); // BPM values

    // Process ECG data for plotting
    const ecg1Values = sensorDataArr.map((item) => item.ecg?.ecg1 || 0); // Use 0 if ecg1 is missing
    const ecg2Values = sensorDataArr.map((item) => item.ecg?.ecg2 || 0); // Use 0 if ecg2 is missing
    const ecg3Values = sensorDataArr.map((item) => item.ecg?.ecg3 || 0); // Use 0 if ecg3 is missing

    // Set chart data for BPM
    setchartBPMData({
      labels,
      datasets: [
        {
          label: "BPM over Time",
          data: BPMvalues,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ],
    });

    setEcg1Data({
      labels,
      datasets: [
        {
          label: "ECG1 over Time",
          data: ecg1Values,
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ],
    });

    setEcg2Data({
      labels,
      datasets: [
        {
          label: "ECG2 over Time",
          data: ecg2Values,
          borderColor: "rgba(54, 162, 235, 1)",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ],
    });

    setEcg3Data({
      labels,
      datasets: [
        {
          label: "ECG3 over Time",
          data: ecg3Values,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ],
    });
  }, [sensorDataArr]);

  const handleLogout = async () => {
    try {
      const response = await fetch(
        `http://${config.HOST}:${config.PORT}/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) {
        navigate("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const transform = (data) => {
    return data.map((item) => ({
      User: item.user,
      Timestamp: format(new Date(item.timestamp), "yyyy-MM-dd HH:mm:ss"),
      BPM: item.bpm,
      ECG_1: item.ecg.ecg1,
      ECG_2: item.ecg.ecg2,
      ECG_3: item.ecg.ecg3,
    }));
  };

  const saveAsExcel = () => {
    const formatedData = transform(sensorDataArr);
    const ws = XLSX.utils.json_to_sheet(formatedData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sensor Data");

    XLSX.writeFile(wb, "data.xlsx");
  };

  if (loading) {
    return <div> Loading... </div>; // Display loading message while checking authentication
  }

  return (
    <div className="welcome-container">
      <h1 className="welcome-title">Welcome {username}!</h1>
      {sensorData ? (
        <div className="data-container">
          <div className="chart-container">
            <h2>BPM Chart</h2>
            <p className="currbpm-data">Current BPM: {sensorData.bpm}</p>
            <Line data={chartBPMData} />
          </div>
          <div className="chart-container">
            <h2>ECG Channels</h2>
            <p className="currecg-data">
              Channel 1: {sensorData.ecg.ecg1}, Channel 2: {sensorData.ecg.ecg2}
              , Channel 3: {sensorData.ecg.ecg3}
            </p>
            <div className="ecg-charts">
              <Line data={ecg1Data} />
              <Line data={ecg2Data} />
              <Line data={ecg3Data} />
            </div>
          </div>
          <div className="button-container">
            <button onClick={saveAsExcel}>Save as Excel</button>
            <button id="logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      ) : (
        <p className="fetching-message">Fetching MCU data...</p>
      )}
    </div>
  );
}

export default Welcome;

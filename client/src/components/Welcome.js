import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config.json';
import { Chart } from 'chart.js/auto';
import { Line } from 'react-chartjs-2';
import "./WelcomePage.css"


function Welcome() {
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [mcuData, setMcuData] = useState(null);
    const [mcuDataArr, setMcuDataArr] = useState([]);
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [],
      });
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async (retries = 3) => {
            try {
                const response = await fetch(`http://${config.HOST}:${config.PORT}/welcome`, {
                    method: 'POST',
                    credentials: 'include'
                });
                
                if (response.ok) { 
                    console.log("Authenticated successfully!");
                    setIsAuthenticated(true); 
                    setLoading(false);
                } else {
                    throw new Error('Not Authenticated');
                }
            } catch (error) {
                if (retries > 0) {
                    console.log(`Auth check failed, retrying... (${retries} attempts left)`);
                    setTimeout(() => checkAuth(retries - 1), 1000);
                } else {
                    console.error("Auth check failed after retries:", error);
                    navigate('/login');
                }
            }
        };

        checkAuth();
    }, [navigate]);


    useEffect(() => {
        if (isAuthenticated) {
            const fetchData = async () => {
                try {
                    const response = await fetch(`http://${config.HOST}:${config.PORT}/mcuData`, {
                        method: 'GET',
                        credentials: 'include'
                    });

                    const data = await response.json();
                    setMcuData(data.recentValue);
                    setMcuDataArr(data.recentBPMs);
                    console.log(mcuDataArr);
                } catch (error) {
                    console.error('Error fetching MCU data:', error);
                }
            };

            // Fetch data immediately
            fetchData();

            // Set up polling
            const intervalId = setInterval(fetchData, 2000);

            // Clear the interval when the component unmounts or isAuthenticated changes
            return () => clearInterval(intervalId);
        }
    }, [isAuthenticated, mcuDataArr]);

    useEffect(() => {
        // Process data for plotting
        const labels = mcuDataArr.map(item => new Date(item.timestamp).toLocaleTimeString());
        const values = mcuDataArr.map(item => item.value);
    
        setChartData({
          labels: labels,
          datasets: [
            {
              label: 'Value over Time',
              data: values,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              fill: false,
              pointRadius: 0, 
              pointHoverRadius: 0,
            },
          ],
        });
      }, [mcuDataArr]);

    if (loading) {
        return (<div> Loading... </div>); // Display loading message while checking authentication
    }

    return (
        <div className="welcome-container">
            <h1 className="welcome-title">Welcome!</h1>
            {mcuData ? (
                <div className="data-container">
                    <p className="mcu-data">MCU Data: {mcuData}</p>
                    <div className="chart-container">
                        <Line data={chartData} />
                    </div>
                </div>
            ) : (
                <p className="fetching-message">Fetching MCU data...</p>
            )}
        </div>
    );
}

export default Welcome;

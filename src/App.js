import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './App.css';
import BarChart from './components/BarChart';

function App() {
  const [excelFile, setExcelFile] = useState(null);
  const [typeError, setTypeError] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [teamOptions, setTeamOptions] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [average, setAverage] = useState(null); // State to hold the calculated average
  const [averageChartData, setAverageChartData] = useState(null);
  const [chartData, setChartData] = useState(null); // State to hold chart data
  const [allTeamsAveragesCharData, setAllTeamsAveragesCharData] = useState(null);
  const [showTable, setShowTable] = useState(true); // State to toggle table visibility

  const handleFile = (e) => {
    let fileTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    let selectedFile = e.target.files[0];
    if (selectedFile && fileTypes.includes(selectedFile.type)) {
      setTypeError(null);
      let reader = new FileReader();
      reader.readAsArrayBuffer(selectedFile);
      reader.onload = (e) => {
        setExcelFile(e.target.result);
      };
    } else {
      setTypeError("Please select only Excel files");
      setExcelFile(null);
    }
  };

  useEffect(() => {
    if (excelData) {
      const teams = new Set();
      excelData.forEach(row => {
        if (row['קבוצה']) {
          teams.add(row['קבוצה']);
        }
      });
      setTeamOptions(Array.from(teams));
    }
  }, [excelData]);

  const handleFileSubmit = (e) => {
    e.preventDefault();
    if (excelFile !== null) {
      const workbook = XLSX.read(excelFile, { type: "buffer" });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      setExcelData(data.slice(0, 400));
    }
  };

  const handleTeamChange = (e) => {
    setSelectedTeam(e.target.value);
  };

  const formatAverages = (averageValues) => {
    const formattedAverages = [];
    Object.keys(averageValues).forEach((key, index) => {
      formattedAverages.push({
        id: index,
        label: key,
        averagePoints: averageValues[key]
      });
    });
    return formattedAverages;
  };
  const calcAvgScore = (team) => {
    const selectedTeamData = excelData.filter(row => row['קבוצה'] === team);

    const nonNaNValues = {};
    const counts = {};

    let isUsingTeamProp = false;
    selectedTeamData.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key !== "" && key.length != 0 && key !== "__EMPTY") {
        if (key !== "Timestamp" && key !== "Email Address" && key !== "מקצה") {
          if (key === " האם הרובוט השתמש באלמנט קבוצתי (TEAM PROP)") {
            isUsingTeamProp = true;
          }
          const value = row[key];
          if (key === "האם הרובוט שם פיקסל סגול על הקו הנכון") {
            const score = (nonNaNValues[key] || 0) + (parseFloat(value === "כן" ? 1 : 0) * (isUsingTeamProp ? 20 : 10));
            nonNaNValues[key] = score;
            counts[key] = (counts[key] || 0) + 1;
          } else if (key === "האם הרובוט שם פיקסל צהוב בברקוד  הנכון") {
            const score = (nonNaNValues[key] || 0) + (parseFloat(value === "כן" ? 1 : 0) * (isUsingTeamProp ? 20 : 10));
            nonNaNValues[key] = score;
            counts[key] = (counts[key] || 0) + 1;
          } else if (key === "באיזה קו נפל המטוס") {
            const distance = (parseFloat(value));
            const distancesMap = {
              0: 0,
              1: 30,
              2: 20,
              3: 10
            };
            const score = (nonNaNValues[key] || 0) + (parseFloat(distancesMap[distance]));
            nonNaNValues[key] = score;
            counts[key] = (counts[key] || 0) + 1;
          } else if (key === "(5-20P) האם הרובוט נתלה או חנה") {
            let pts = 0;
            if (value == "נתלה (20)") {
              pts = 20;
            } else if (value == "חנה (5))") {
              pts = 5;
            }
            const score = (nonNaNValues[key] || 0) + (pts);
            nonNaNValues[key] = score;
            counts[key] = (counts[key] || 0) + 1;
          } else if (key === "(5P) האם הרובוט חנה_1") {
            const score = (nonNaNValues[key] || 0) + (parseFloat(value === "כן" ? 1 : 0) * 5);
            nonNaNValues[key] = score;
            counts[key] = (counts[key] || 0) + 1;
          } else if (key === "(5P) האם הרובוט חנה") {
            const score = (nonNaNValues[key] || 0) + (parseFloat(value === "כן" ? 1 : 0) * 5);
            nonNaNValues[key] = score;
            counts[key] = (counts[key] || 0) + 1;
          }
          else if (!isNaN(value)) {
            // Extracting the number inside parentheses with 'p' next to it
            const match = key.match(/\((\d+)p\)/i);
            if (match) {
              let multiplier = parseInt(match[1]);
              nonNaNValues[key] = (nonNaNValues[key] || 0) + (parseFloat(value) * multiplier);
            } else {
              nonNaNValues[key] = (nonNaNValues[key] || 0) + parseFloat(value);
            }
            counts[key] = (counts[key] || 0) + 1;
          }
        }
        }
      });
    });

    const averageValues = {};
    let totalPoints = 0;
    let totalCount = 0;
    Object.keys(nonNaNValues).forEach(key => {
      if (counts[key] !== 0) {
        averageValues[key] = parseFloat(nonNaNValues[key]) / parseFloat(counts[key]);
        totalPoints += parseFloat(nonNaNValues[key]);
        totalCount = parseFloat(counts[key]);
      }
      else averageValues[key] = 0;
      if (counts[key] === undefined) {
        console.log(key);
      }
    });
    averageValues["Total Average"] = totalPoints / totalCount;
    return averageValues;
  }

  const calculateAvg = () => {
    if (selectedTeam === '') return; // No team selected, return early
    let averageValues = calcAvgScore(selectedTeam);
    // console.log(totalPoints);
    // console.log("TOTAL AVG", totalPoints / totalCount);
    setAverage(averageValues);
    setAverageChartData(formatAverages(averageValues));
  };

  const calculateAllAvgs = () => {
    const allAvgs = [];
    teamOptions.forEach((team) => {
      const averageValues = calcAvgScore(team);
      const totalAverage = averageValues["Total Average"];
      allAvgs.push({ label: team, averagePoints: totalAverage });
    });

    // Sort the allAvgs array from highest to lowest average points
    allAvgs.sort((a, b) => b.averagePoints - a.averagePoints);

    // Set allTeamsAveragesCharData state
    setAllTeamsAveragesCharData(allAvgs);

    // Construct chart data
    const chartData = {
      labels: allAvgs.map((data) => data.label),
      datasets: [{
        label: "Average Points",
        data: allAvgs.map((data) => data.averagePoints),
        backgroundColor: "green",
        borderColor: "black",
        borderWidth: 2
      }]
    };

    // Set chart data state
    setChartData(chartData);
  };

  useEffect(() => {
    if (averageChartData) {
      setChartData({
        labels: averageChartData.map((data) => data.label),
        datasets: [{
          label: "Average Points",
          data: averageChartData.map((data) => data.averagePoints),
          backgroundColor: "blue",
          borderColor: "black",
          borderWidth: 2
        }]
      });
    }

    if (selectedTeam === '' && allTeamsAveragesCharData !== null) {
      setChartData({
        labels: allTeamsAveragesCharData.map((data) => data.label),
        datasets: [{
          label: "Average Points",
          data: allTeamsAveragesCharData.map((data) => data.averagePoints),
          backgroundColor: "blue",
          borderColor: "black",
          borderWidth: 2
        }]
      });
    }
  }, [averageChartData, selectedTeam, allTeamsAveragesCharData]);
  useEffect(() => {
    if (selectedTeam === '' && teamOptions.length > 0) {
      calculateAllAvgs();
    } else {
      calculateAvg();
    }
  }, [selectedTeam, teamOptions]);

  const toggleTable = () => {
    setShowTable(!showTable);
  };

  return (
    <div className="App">
      <form onSubmit={handleFileSubmit}>
        <button style={{ cursor: "pointer" }} onClick={() => { document.getElementById('form-control').click(); }}>UPLOAD</button>
        <input type='file' id='form-control' required onChange={handleFile} style={{ display: "none" }} />
        <button type='submit' className='btn btn-success btn-md'>Submit</button>
        {typeError && (
          <div className='alert alert-danger' role='alert'>{typeError}</div>
        )}
      </form>
      <select value={selectedTeam} onChange={handleTeamChange}>
        <option value="">All Teams</option>
        {teamOptions
          .sort((a, b) => {
            // Extract team numbers from team names and compare
            const teamNumberA = parseInt(a.match(/\d+/)[0]);
            const teamNumberB = parseInt(b.match(/\d+/)[0]);
            return teamNumberA - teamNumberB;
          })
          .map((team, index) => (
            <option key={index} value={team}>{team}</option>
          ))}
      </select>

      {/* <button onClick={calculateAvg}>Calculate Average</button> Button to trigger calculation */}
      <button onClick={toggleTable}>{showTable ? "Hide Table" : "Show Table"}</button> {/* Button to toggle table visibility */}
      <div className='viewer'>
        {showTable && excelData ? (
          <div className='table-responsive'>
            <table className='table'>
              <thead>
                <tr>
                  {Object.keys(excelData[0]).map((key) => (
                    key !== "Timestamp" && key !== "Email Address" && key !== "__EMPTY" && (
                      <th key={key}>{key}</th>
                    )
                  ))}
                </tr>
              </thead>
              <tbody>
                {excelData.map((individualExcelData, index) => {
                  // Filter rows based on the searched team
                  if (selectedTeam !== '' && individualExcelData['קבוצה'] !== selectedTeam) {
                    return null; // Skip rendering if the team name doesn't match
                  }
                  return (
                    <tr key={index}>
                      {Object.keys(individualExcelData).map((key) => (
                        key !== "Timestamp" && key !== "Email Address" && key !== "__EMPTY" && (
                          <td key={key}>{individualExcelData[key]}</td>
                        )
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div></div>
        )}
      </div>

      {chartData && (
        <div style={{ width: 1200 }} className='chart'>
          <BarChart data={chartData}></BarChart>
        </div>
      )}
      {average && selectedTeam !== "" && (
        <div>
          <h3>Average Values for {selectedTeam}:</h3>
          <ul>
            {Object.keys(average).map((key, index) => (
              <li key={index}>{key}: {average[key]}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;

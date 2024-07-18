import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import style from './App.css';
import style from "./app.module.css"
import { PieChart, Pie, Sector, Cell } from 'recharts';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [barChartData, setBarChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("March"); 
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);

  useEffect(() => {
    fetchTransactions();
    fetchStatistics();
    fetchBarChart();
    fetchPieChart();
  }, [selectedMonth, searchQuery, currentPage]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/transactions?month=${selectedMonth}&search=${searchQuery}&page=${currentPage}&perPage=${perPage}`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/statistics?month=${selectedMonth}`);
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchBarChart = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/bar-chart?month=${selectedMonth}`);
      setBarChartData(response.data);
    } catch (error) {
      console.error('Error fetching bar chart data:', error);
    }
  };

  const fetchPieChart = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/pie-chart?month=${selectedMonth}`);
      setPieChartData(response.data);
    } catch (error) {
      console.error('Error fetching pie chart data:', error);
    }
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(parseInt(event.target.value));
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const data = [
    { label: '0-100', value: 10 },
    { label: '101-200', value: 15 },
    { label: '201-300', value: 30 },
    { label: '301-400', value: 20 },
    { label: '401-500', value: 60 },
    { label: '501-600', value: 95 },
    { label: '601-700', value: 35 },
    { label: '701-800', value: 80 },
    { label: '801-900', value: 18 },
    { label: '901 above', value: 38 },
  ];
  const COLORS = ['#0088FE', '#00C49F', '#FF99FF', '#FFC67D', '#8BC34A', '#45B3FA', '#FF69B4', '#33CC33', '#66D9EF', '#FFA07A'];

  return (
    <div className={style.apps}>
      <div className={style.dash}>
        <h1>Transections</h1>
        <h2>DashBoard</h2>
      </div>
      <div className={style.controls}>
        <select value={selectedMonth} onChange={handleMonthChange}>
          <option value={"January"}>January</option>
          <option value={"February"}>February</option>
          <option value={"March"}>March</option>
          <option value={"April"}>April</option>
          <option value={"May"}>May</option>
          <option value={"June"}>June</option>
          <option value={"July"}>July</option>
          <option value={"August"}>August</option>
          <option value={"September"}>September</option>
          <option value={"October"}>October</option>
          <option value={"November"}>November</option>
          <option value={"December"}>December</option>
        </select>
        <input type="text" value={searchQuery} onChange={handleSearchChange} placeholder="Search Transection" />
      </div>

      <h2>Transactions Table</h2>
      <div className={style.tableData}>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Product Title</th>
            <th>Description</th>
            <th>Price</th>
            <th>Category</th>
            <th>Sold</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.id}</td>
              <td>{transaction.dateOfSale.toLocaleDateString()}</td>
              <td>{transaction.productTitle}</td>
              <td>{transaction.productDescription}</td>
              <td>{transaction.price}</td>
              <td>{transaction.category}</td>
              <td>{transaction.sold ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <div className={style.pagination}>
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
        <button onClick={() => handlePageChange(currentPage + 1)}>Next</button>
      </div>

      <h2>Statistics</h2>
      <div className={style.statistics}>
        <div>
          <h3>Total Sale Amount :</h3>
          <p>$ {statistics.totalSaleAmount}</p>
        </div>
        <div>
          <h3>Total Sold Items :</h3>
          <p>{statistics.totalSoldItems}</p>
        </div>
        <div>
          <h3>Total Not Sold Items :</h3>
          <p>{statistics.totalNotSoldItems}</p>
        </div>
      </div>

      <h2>Bar Chart</h2>

      <div className={style.chartContainer}>
      <h2>Bar Chart Stats - {selectedMonth}</h2>
      <svg width="600" height="300">
        <g transform="translate(50, 250)">
          {data.map((item, index) => (
            <rect
              key={index}
              x={index * 40}
              y={-item.value}
              width={30}
              height={item.value}
              fill="#74c9f4"
            />
          ))}
        </g>
        <g transform="translate(50, 250)">
          {data.map((item, index) => (
            <text
              key={index}
              x={index * 40 + 10}
              y={20}
              textAnchor="middle"
              fontSize="9px"
            >
              {item.label}
            </text>
          ))}
        </g>
      </svg>
    </div>
      <h2>Pie Chart</h2>
      <div className={style.chartContainer}>
      <h2>Pie Chart Stats - {selectedMonth}</h2>
      <PieChart width={600} height={400}>
        <Pie
          data={data}
          cx={300}
          cy={200}
          innerRadius={70}
          outerRadius={110}
          fill="#8884d8"
          paddingAngle={3}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Sector
          cx={200}
          cy={200}
          innerRadius={60}
          outerRadius={80}
          startAngle={0}
          endAngle={360}
          fill="none"
        />
      </PieChart>
    </div>
     
    </div>
  );
}

export default App;



  

 
    
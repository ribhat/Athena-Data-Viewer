import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AthenaData.css';

const AthenaData = () => {
    const [data, setData] = useState([]); // Table data (excluding headers)
    const [headers, setHeaders] = useState([]); // Table headers
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('https://f5dw8vghn1.execute-api.us-east-1.amazonaws.com/QueryAthenaTest');
                const result = response.data;

                // Extract headers (first row) and data (remaining rows)
                const tableHeaders = result[0];
                const tableData = result.slice(1);

                setHeaders(tableHeaders);
                setData(tableData);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Function to handle cell click
    const handleCellClick = async (columnIndex, cellValue) => {
        if (!headers[columnIndex] || !cellValue) return;

        const columnName = headers[columnIndex].toLowerCase(); // Convert to lowercase to match the backend query
        try {
            setLoading(true);
            const response = await axios.get(
                `https://f5dw8vghn1.execute-api.us-east-1.amazonaws.com/QueryAthenaTest`,
                { params: { column: columnName, value: cellValue } }
            );

            const result = response.data;
            const tableHeaders = result[0];
            const tableData = result.slice(1);

            setHeaders(tableHeaders);
            setData(tableData);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <h2>Athena Query Results</h2>
            <div style={{ overflowX: 'auto' }}>
                <table>
                    <thead>
                        <tr>
                            {headers.map((col, index) => (
                                <th key={index}>{col.toUpperCase()}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        style={{ textAlign: isNaN(cell) ? 'left' : 'right', cursor: 'pointer' }}
                                        onClick={() => handleCellClick(cellIndex, cell)}
                                    >
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AthenaData;

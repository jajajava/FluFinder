import React, { useState, useEffect } from "react";
import { useLocation } from "../context/LocationContext";

const LatestInfections = () => {
  const [df, setDf] = useState({
    date: [],
    location: [],
    infected: [],
    flockType: [],
    state: []
  }); // DataFrame-like structure
  const [filteredIndices, setFilteredIndices] = useState([]); // Indices of filtered rows
  const [selectedState, setSelectedState] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const { selectedLocation } = useLocation();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  // Fetch data from the API
  useEffect(() => {
    const fetchInfections = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/cdc/data`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Convert the data to DataFrame-like structure
        const newDf = {
          date: data["Outbreak Date"] || [],
          location: data.County.map((county, idx) => `${county}, ${data.State[idx]}`),
          infected: data["Flock Size"].map(size => parseInt(size) || 0),
          flockType: data["Flock Type"] || [],
          state: data.State || []
        };

        // Sort by date (most recent first)
        const indices = Array.from({ length: newDf.date.length }, (_, i) => i);
        indices.sort((a, b) => new Date(newDf.date[b]) - new Date(newDf.date[a]));

        // Reorder all columns based on sorted indices
        const sortedDf = {
          date: indices.map(i => newDf.date[i]),
          location: indices.map(i => newDf.location[i]),
          infected: indices.map(i => newDf.infected[i]),
          flockType: indices.map(i => newDf.flockType[i]),
          state: indices.map(i => newDf.state[i])
        };

        setDf(sortedDf);
        setFilteredIndices(Array.from({ length: sortedDf.date.length }, (_, i) => i));
      } catch (error) {
        console.error("Error fetching infections:", error);
      }
    };

    fetchInfections();
  }, [backendUrl]);

  // Update filtered indices when selected state changes
  useEffect(() => {
    if (selectedState === "All") {
      setFilteredIndices(Array.from({ length: df.date.length }, (_, i) => i));
    } else {
      const filtered = df.state
        .map((state, index) => state === selectedState ? index : -1)
        .filter(index => index !== -1);
      setFilteredIndices(filtered);
    }
    setCurrentPage(1); // Reset to first page when filter changes
  }, [selectedState, df]);

  // Update selected state when location context changes
  useEffect(() => {
    if (selectedLocation?.state) {
      setSelectedState(selectedLocation.state);
    }
  }, [selectedLocation]);

  // Handle state filter change
  const handleStateChange = (event) => {
    setSelectedState(event.target.value);
  };

  // Handle entries per page change
  const handleEntriesPerPageChange = (event) => {
    setEntriesPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  // Calculate pagination values
  const totalPages = Math.ceil(filteredIndices.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentIndices = filteredIndices.slice(startIndex, endIndex);

  // Handle page navigation
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Helper function to get a subset of the DataFrame
  const getDfSubset = (indices) => {
    return {
      date: indices.map(i => df.date[i]),
      location: indices.map(i => df.location[i]),
      infected: indices.map(i => df.infected[i]),
      flockType: indices.map(i => df.flockType[i]),
      state: indices.map(i => df.state[i])
    };
  };

  // Get current page data
  const currentDf = getDfSubset(currentIndices);

  return (
    <div style={{
      padding: isMobile ? "0.5rem" : "0.625rem",
      overflowY: "auto",
      height: "100%",
      maxWidth: "100%"
    }}>
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: isMobile ? "flex-start" : "center",
        marginBottom: isMobile ? "0.75rem" : "-0.45rem",
        marginTop: isMobile ? "0" : "-1.3rem",
        width: "100%"
      }}>
        <h2 style={{
          fontSize: isMobile ? "1.25rem" : "1.5rem",
          marginTop: isMobile ? "-1.95%" : "", 
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          Latest Infections
          <div 
            style={{
              position: "relative",
              display: "inline-block",
              cursor: "help"
            }}
            onMouseEnter={() => setIsTooltipVisible(true)}
            onMouseLeave={() => setIsTooltipVisible(false)}
          >
            <span style={{
              fontSize: isMobile ? "1rem" : "1.25rem",
              color: "#666",
              display: "inline-block",
              width: "1.25rem",
              height: "1.25rem",
              lineHeight: "1.25rem",
              textAlign: "center",
              borderRadius: "50%",
              border: "1px solid #666",
              userSelect: "none"
            }}>?</span>
            <div style={{
              visibility: isTooltipVisible ? "visible" : "hidden",
              position: "absolute",
              zIndex: 1,
              top: "125%",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "#333",
              color: "#fff",
              textAlign: "center",
              padding: "0.5rem",
              borderRadius: "0.25rem",
              width: "max-content",
              maxWidth: "300px",
              fontSize: "0.875rem",
              boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
              opacity: isTooltipVisible ? 1 : 0,
              transition: "opacity 0.3s",
              pointerEvents: "none"
            }}>
              Entries in this table with an infection value of 0 mean there's been a report of an infection but the CDC does not have the total infected count yet. These values will be updated once the CDC receives the data.
              <div style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                marginLeft: "-5px",
                borderWidth: "5px",
                borderStyle: "solid",
                borderColor: "transparent transparent #333 transparent"
              }}></div>
            </div>
          </div>
        </h2>
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? "0.5rem" : "0.625rem",
          alignItems: isMobile ? "flex-start" : "center",
          width: isMobile ? "100%" : "auto"
        }}>
          <select
            value={selectedState}
            onChange={handleStateChange}
            style={{
              padding: "0.3125rem",
              borderRadius: "0.25rem",
              border: "0.0625rem solid #ccc",
              fontSize: "0.875rem",
              backgroundColor: "#2a2a2a",
              color: "#fff",
              width: isMobile ? "100%" : "auto"
            }}
          >
            <option value="All">All States</option>
            <option value="Alabama">Alabama</option>
            <option value="Alaska">Alaska</option>
            <option value="Arizona">Arizona</option>
            <option value="Arkansas">Arkansas</option>
            <option value="California">California</option>
            <option value="Colorado">Colorado</option>
            <option value="Connecticut">Connecticut</option>
            <option value="Delaware">Delaware</option>
            <option value="Florida">Florida</option>
            <option value="Georgia">Georgia</option>
            <option value="Hawaii">Hawaii</option>
            <option value="Idaho">Idaho</option>
            <option value="Illinois">Illinois</option>
            <option value="Indiana">Indiana</option>
            <option value="Iowa">Iowa</option>
            <option value="Kansas">Kansas</option>
            <option value="Kentucky">Kentucky</option>
            <option value="Louisiana">Louisiana</option>
            <option value="Maine">Maine</option>
            <option value="Maryland">Maryland</option>
            <option value="Massachusetts">Massachusetts</option>
            <option value="Michigan">Michigan</option>
            <option value="Minnesota">Minnesota</option>
            <option value="Mississippi">Mississippi</option>
            <option value="Missouri">Missouri</option>
            <option value="Montana">Montana</option>
            <option value="Nebraska">Nebraska</option>
            <option value="Nevada">Nevada</option>
            <option value="New Hampshire">New Hampshire</option>
            <option value="New Jersey">New Jersey</option>
            <option value="New Mexico">New Mexico</option>
            <option value="New York">New York</option>
            <option value="North Carolina">North Carolina</option>
            <option value="North Dakota">North Dakota</option>
            <option value="Ohio">Ohio</option>
            <option value="Oklahoma">Oklahoma</option>
            <option value="Oregon">Oregon</option>
            <option value="Pennsylvania">Pennsylvania</option>
            <option value="Rhode Island">Rhode Island</option>
            <option value="South Carolina">South Carolina</option>
            <option value="South Dakota">South Dakota</option>
            <option value="Tennessee">Tennessee</option>
            <option value="Texas">Texas</option>
            <option value="Utah">Utah</option>
            <option value="Vermont">Vermont</option>
            <option value="Virginia">Virginia</option>
            <option value="Washington">Washington</option>
            <option value="West Virginia">West Virginia</option>
            <option value="Wisconsin">Wisconsin</option>
            <option value="Wyoming">Wyoming</option>
          </select>
          <select
            value={entriesPerPage}
            onChange={handleEntriesPerPageChange}
            style={{
              padding: "0.3125rem",
              borderRadius: "0.25rem",
              border: "0.0625rem solid #ccc",
              fontSize: "0.875rem",
              backgroundColor: "#2a2a2a",
              color: "#fff",
              width: isMobile ? "100%" : "auto"
            }}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      <div
        style={{
          border: "0.0625rem solid #ccc",
          borderRadius: "0.5rem",
          padding: "0.625rem",
          marginTop: "0.625rem",
          boxShadow: "0 0.125rem 0.25rem rgba(0, 0, 0, 0.1)",
          overflowX: isMobile ? "auto" : "hidden",
          maxWidth: "100%",
          boxSizing: "border-box"
        }}
      >
        <div style={{
          width: "100%",
          overflowX: isMobile ? "auto" : "hidden",
          maxWidth: "100%"
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: isMobile ? "32rem" : "auto",
            tableLayout: "fixed"
          }}>
            <thead>
              <tr>
                <th style={{
                  borderBottom: "0.0625rem solid #ccc",
                  padding: "0.5rem",
                  fontSize: isMobile ? "0.75rem" : "1rem",
                  width: "20%"
                }}>Date</th>
                <th style={{
                  borderBottom: "0.0625rem solid #ccc",
                  padding: "0.5rem",
                  fontSize: isMobile ? "0.75rem" : "1rem",
                  width: "35%"
                }}>Location</th>
                <th style={{
                  borderBottom: "0.0625rem solid #ccc",
                  padding: "0.5rem",
                  fontSize: isMobile ? "0.75rem" : "1rem",
                  width: "20%"
                }}># Infected</th>
                <th style={{
                  borderBottom: "0.0625rem solid #ccc",
                  padding: "0.5rem",
                  fontSize: isMobile ? "0.75rem" : "1rem",
                  width: "25%"
                }}>Flock Type</th>
              </tr>
            </thead>
            <tbody>
              {currentDf.date.map((date, index) => (
                <tr key={index}>
                  <td style={{
                    padding: "0.5rem",
                    borderBottom: "0.0625rem solid #eee",
                    fontSize: isMobile ? "0.75rem" : "1rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>{date}</td>
                  <td style={{
                    padding: "0.5rem",
                    borderBottom: "0.0625rem solid #eee",
                    fontSize: isMobile ? "0.75rem" : "1rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>{currentDf.location[index]}</td>
                  <td style={{
                    padding: "0.5rem",
                    borderBottom: "0.0625rem solid #eee",
                    fontSize: isMobile ? "0.75rem" : "1rem",
                    whiteSpace: "nowrap"
                  }}>{currentDf.infected[index].toLocaleString()}</td>
                  <td style={{
                    padding: "0.5rem",
                    borderBottom: "0.0625rem solid #eee",
                    fontSize: isMobile ? "0.75rem" : "1rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>{currentDf.flockType[index]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredIndices.length === 0 && (
            <p style={{ textAlign: "center", marginTop: "0.625rem", fontSize: isMobile ? "0.875rem" : "1rem" }}>
              No data available for the selected state.
            </p>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredIndices.length > 0 && (
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: "0.625rem",
            marginTop: "0.9375rem",
            padding: "0.625rem 0",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            fontSize: isMobile ? "0.75rem" : "0.875rem"
          }}>
            <div>
              Showing {startIndex + 1} to {Math.min(endIndex, filteredIndices.length)} of {filteredIndices.length} entries
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              flexWrap: isMobile ? "wrap" : "nowrap"
            }}>
              <div style={{ display: "flex", gap: "0.1875rem" }}>
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: "0.1875rem 0.375rem",
                    borderRadius: "0.1875rem",
                    border: "0.0625rem solid #ccc",
                    backgroundColor: currentPage === 1 ? "#f0f0f0" : "#ffffff",
                    cursor: currentPage === 1 ? "default" : "pointer",
                    fontSize: "0.75rem",
                    minWidth: "2.5rem",
                    color: "#000000"
                  }}
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: "0.1875rem 0.375rem",
                    borderRadius: "0.1875rem",
                    border: "0.0625rem solid #ccc",
                    backgroundColor: currentPage === 1 ? "#f0f0f0" : "#ffffff",
                    cursor: currentPage === 1 ? "default" : "pointer",
                    fontSize: "0.75rem",
                    minWidth: "2.5rem",
                    color: "#000000"
                  }}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "0.1875rem 0.375rem",
                    borderRadius: "0.1875rem",
                    border: "0.0625rem solid #ccc",
                    backgroundColor: currentPage === totalPages ? "#f0f0f0" : "#ffffff",
                    cursor: currentPage === totalPages ? "default" : "pointer",
                    fontSize: "0.75rem",
                    minWidth: "2.5rem",
                    color: "#000000"
                  }}
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "0.1875rem 0.375rem",
                    borderRadius: "0.1875rem",
                    border: "0.0625rem solid #ccc",
                    backgroundColor: currentPage === totalPages ? "#f0f0f0" : "#ffffff",
                    cursor: currentPage === totalPages ? "default" : "pointer",
                    fontSize: "0.75rem",
                    minWidth: "2.5rem",
                    color: "#000000"
                  }}
                >
                  Last
                </button>
              </div>
              <span style={{
                marginLeft: isMobile ? "0" : "auto",
                fontSize: "0.875rem"
              }}>
                Page {currentPage} of {totalPages}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LatestInfections;

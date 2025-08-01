let data;  // Global variable to store data

export function drawTop100Songs(rawData, updateTop10Chart) {
    // Convert data types
    rawData.forEach(d => {
        d["Spotify Popularity"] = +d["Spotify Popularity"];
        d["Track Score"] = +d["Track Score"];
        d["Release Year"] = new Date(d["Release Date"]).getFullYear();
    });
    let minYear = d3.min(rawData, d => d["Release Year"]);
    let maxYear = d3.max(rawData, d => d["Release Year"]);

    data = rawData; // Store in global variable

    // Create slider after loading data
    // createSlider();

    // Draw the initial visualization with all data
    updateVisualization(minYear, maxYear, updateTop10Chart);
    return updateVisualization
}

function updateVisualization(minYear, maxYear, updateTop10Chart) {
    // Update title with year range
    d3.select("#top_100_songs")
    .node().closest(".vis-container")
    .querySelector(".chart-title").innerHTML = `Track Score Ranges in Top 100 Most Popularity Songs <br> (${minYear} - ${maxYear})`;

    let filteredData = data.filter(d =>
        d["Release Year"] >= minYear && d["Release Year"] <= maxYear
    );

    // Sort by Spotify Popularity and get top 100 songs
    let top100Songs = filteredData.sort((a, b) => b["Spotify Popularity"] - a["Spotify Popularity"]).slice(0, 100);

    // Define bin size (e.g., 50-point intervals)
    let binSize = 50;

    // Group data by Track Score Ranges
    let trackScoreCounts = d3.rollups(
        top100Songs,
        v => v.length, // Count occurrences
        d => Math.floor(d["Track Score"] / binSize) * binSize  // Group into bins
    );

    // Convert to array of objects
    let trackScoreData = trackScoreCounts.map(d => ({
        trackScore: d[0],  // Lower bound of the bin
        count: d[1]        // Count of songs in this range
    }));

    // Sort by Track Score Range
    trackScoreData.sort((a, b) => a.trackScore - b.trackScore);

    // Set margins and dimensions
    const margin = { top: 10, right: 30, bottom: 60, left: 150 };
    let width = document.getElementById("top_100_songs").getBoundingClientRect().width - margin.left - margin.right;
    let height = document.getElementById("top_100_songs").getBoundingClientRect().height - margin.top - margin.bottom;

    // Check if SVG already exists
    const svgExists = d3.select("#top_100_songs svg").size() > 0;
    
    let svg;
    
    // X-axis scale (Track Score Ranges)
    let x = d3.scaleBand()
        .domain(trackScoreData.map(d => `${d.trackScore}-${d.trackScore + binSize - 1}`))  // Labels for bins
        .range([0, width])
        .padding(0.2);

    // Y-axis scale (Number of Songs)
    let y = d3.scaleLinear()
        .domain([0, d3.max(trackScoreData, d => d.count)])
        .nice()
        .range([height, 0]);
        
    // Line generator
    let line = d3.line()
        .x(d => x(`${d.trackScore}-${d.trackScore + binSize - 1}`) + x.bandwidth() / 2)
        .y(d => y(d.count))
        .curve(d3.curveMonotoneX); // Smooth the line

    if (!svgExists) {
        // First-time SVG creation
        d3.select("#top_100_songs").html("");
        
        // Create new SVG
        svg = d3.select("#top_100_songs")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // X-axis
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Y-axis
        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        // Add line path with ID for later updates
        svg.append("path")
            .attr("id", "line-path")
            .attr("fill", "none")
            .attr("stroke", "#1DB954")
            .attr("stroke-width", 2)
            .attr("d", line(trackScoreData));

        // Add dots group with ID for later updates
        svg.append("g")
            .attr("id", "dots-group");
            
        // Add tooltip
        if (!d3.select("body").select("#top100-tooltip").size()) {
            d3.select("body").append("div")
                .attr("id", "top100-tooltip")
                .style("position", "absolute")
                .style("background", "#fff")
                .style("padding", "8px")
                .style("border", "1px solid #ccc")
                .style("border-radius", "5px")
                .style("visibility", "hidden")
                .style("font-size", "14px");
        }

        // Labels
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom)
            .attr("text-anchor", "middle")
            .text("Track Score Range");

        svg.append("text")
            .attr("x", -height / 2)
            .attr("y", -60)
            .attr("transform", "rotate(-90)")
            .attr("text-anchor", "middle")
            .text("Number of Songs");
    } else {
        // Update existing SVG
        svg = d3.select("#top_100_songs svg g");
        
        // Update X and Y axes with transition
        svg.select(".x-axis")
            .transition()
            .duration(750)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
            
        svg.select(".y-axis")
            .transition()
            .duration(750)
            .call(d3.axisLeft(y));
            
        // Update line path with transition
        svg.select("#line-path")
            .datum(trackScoreData)
            .transition()
            .duration(750)
            .attr("d", line);
    }
    
    const tooltip = d3.select("#top100-tooltip");

    // Update dots using D3 data binding for transitions
    const dots = svg.select("#dots-group").selectAll(".dot")
        .data(trackScoreData);
    
    // Remove extra dots
    dots.exit()
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove();
    
    // Add new dots with initial state
    const dotsEnter = dots.enter()
        .append("circle")
        .attr("class", "dot")
        .attr("r", 4)
        .attr("fill", "#004d00")
        .style("opacity", 0) // Initial opacity 0
        .attr("cx", d => x(`${d.trackScore}-${d.trackScore + binSize - 1}`) + x.bandwidth() / 2)
        .attr("cy", d => y(d.count));
    
    // Set hover events and transitions for all dots
    dotsEnter.merge(dots)
        .on("mouseover", function (event, d) {
            d3.select(this)
                .style("fill", "white")
                .style("stroke", "#004d00")
                .style("stroke-width", 2);
            tooltip.html(`<strong>Track Score:</strong> ${d.trackScore}-${d.trackScore + binSize - 1}<br>
                       <strong>Number of Songs:</strong> ${d.count}`)
                .style("visibility", "visible")
                .style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function () {
            d3.select(this)
                .style("fill", "#004d00")
                .style("stroke", "none");
            tooltip.style("visibility", "hidden");
        })
        .transition() // Apply transition
        .duration(750)
        .style("opacity", 1) // Final opacity 1
        .attr("cx", d => x(`${d.trackScore}-${d.trackScore + binSize - 1}`) + x.bandwidth() / 2)
        .attr("cy", d => y(d.count));

    if (updateTop10Chart && typeof updateTop10Chart === 'function') {
        updateTop10Chart(minYear, maxYear);
    }
}


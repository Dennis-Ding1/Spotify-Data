// Load the data from the CSV file
d3.csv("data/Cleaned_Spotify_Data.csv").then(function(data) {
    
    // Convert Spotify Streams to a number and sort in descending order
    data.forEach(d => {
        d["Spotify Streams"] = +d["Spotify Streams"];
    });

    data.sort((a, b) => b["Spotify Streams"] - a["Spotify Streams"]);

    // Get the top 10 most streamed songs
    let top10 = data.slice(0, 10);

    // Set up SVG dimensions
    const margin = {top: 50, right: 30, bottom: 100, left: 150};
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#chart1")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create X scale (Linear for Streams)
    const x = d3.scaleLinear()
        .domain([0, d3.max(top10, d => d["Spotify Streams"])])
        .range([0, width]);

    // Create Y scale (Ordinal for Song Names)
    const y = d3.scaleBand()
        .domain(top10.map(d => d["Track"]))
        .range([0, height])
        .padding(0.2);

    // Add bars
    svg.selectAll(".bar")
        .data(top10)
        .enter()
        .append("rect")
        .attr("class", "bar") // Class added for styling in CSS
        .attr("y", d => y(d["Track"]))
        .attr("width", d => x(d["Spotify Streams"]))
        .attr("height", y.bandwidth());

    // Add X-axis
    svg.append("g")
        .attr("class", "axis x-axis") // Class added for styling in CSS
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(5));

    // Add Y-axis
    svg.append("g")
        .attr("class", "axis y-axis") // Class added for styling in CSS
        .call(d3.axisLeft(y));

    // Add title
    svg.append("text")
        .attr("class", "chart-title") // Class added for styling in CSS
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .text("Top 10 Most Streamed Songs on Spotify");

    // Add labels on bars
    svg.selectAll(".label")
        .data(top10)
        .enter()
        .append("text")
        .attr("class", "bar-label") // Class added for styling in CSS
        .attr("x", d => x(d["Spotify Streams"]) + 5)
        .attr("y", d => y(d["Track"]) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .text(d => d3.format(".2s")(d["Spotify Streams"])); // Shortened numbers
});

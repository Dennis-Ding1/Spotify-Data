let debounceTimer;

export function drawSongCountByYear(data, updateTop100Chart, updateTop10Chart) {
    // Convert release years to numbers
    data.forEach(d => d["Release Year"] = +d["Release Year"]);

    // Count the number of songs per release year
    const songCounts = d3.rollup(data, v => v.length, d => d["Release Year"]);
    const songCountsArray = Array.from(songCounts, ([year, count]) => ({ year, count }))
        .sort((a, b) => a.year - b.year);

    // Set up dimensions
    const margin = { top: 40, right: 30, bottom: 80, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG container
    const svg = d3.select("#chart4")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const xScale = d3.scaleBand()
        .domain(songCountsArray.map(d => d.year))
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(songCountsArray, d => d.count)])
        .range([height, 0]);

    // Add bars
    svg.selectAll(".bar")
        .data(songCountsArray)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.year))
        .attr("y", d => yScale(d.count))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.count))
        .attr("fill", "#1DB954");

    // Add X-axis
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter(year => year % 2 === 0)))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Add Y-axis
    svg.append("g").call(d3.axisLeft(yScale));

    // Add Brush
    const brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("brush end", brushed);

    svg.append("g")
        .attr("class", "brush")
        .call(brush);

    function brushed(event) {
        if (!event.selection) return;

        // Convert brush selection from pixels to actual years
        const [x0, x1] = event.selection;
        const selectedYears = songCountsArray
            .filter(d => xScale(d.year) + xScale.bandwidth() / 2 >= x0 && xScale(d.year) + xScale.bandwidth() / 2 <= x1)
            .map(d => d.year);

        if (selectedYears.length > 0) {
            console.log(`Selected Years: ${d3.min(selectedYears)} - ${d3.max(selectedYears)}`);   
            clearTimeout(debounceTimer);

            debounceTimer = setTimeout(() => {
                if (typeof updateTop100Chart === "function") {
                    updateTop100Chart(Math.round(d3.min(selectedYears)), Math.round(d3.max(selectedYears)), updateTop10Chart); 
                }
            }, 150);
        }
    }
}
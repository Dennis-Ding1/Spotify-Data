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
    const width = 1150 - margin.left - margin.right;
    const height = 330 - margin.top - margin.bottom;

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
        .nice()  // Ensures better tick placement
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
    
        // Add count labels at the top of each bar
    svg.selectAll(".bar-label")
        .data(songCountsArray)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", d => xScale(d.year) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.count) - 5) 
        .attr("text-anchor", "middle") 
        .style("font-size", "12px")
        .style("fill", "black")
        .text(d => d.count);

    // Add X-axis
    svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale)
        .tickValues(songCountsArray.map(d => d.year)) 
    )
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");
    // Add X-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 50)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Release Year");

    // Add Y-axis
    svg.append("g").call(d3.axisLeft(yScale));

    // Add Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2) 
        .attr("y", -50)  
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Number of Songs");

    // Add Brush
    let isBrushing = false;
    const brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("start", () => {
            isBrushing = true;
        })
        .on("brush end", brushed)
        .on("end", () => {
            setTimeout(() => { isBrushing = false; }, 300);
        });
        
    svg.append("g")
        .attr("class", "brush")
        .call(brush);

    function brushed(event) {
        if (!event.selection) return;

        const [x0, x1] = event.selection;
        const selectedYears = songCountsArray
        .map(d => d.year)
        .filter(year => {
            const yearPos = xScale(year) + xScale.bandwidth() / 2;
            return yearPos >= x0 && yearPos <= x1;
        });

        if (selectedYears.length > 0) {
            const minYear = Math.round(d3.min(selectedYears));
            const maxYear = Math.round(d3.max(selectedYears));
            console.log(`Selected Years: ${minYear} - ${maxYear}`);
            clearTimeout(debounceTimer);

            debounceTimer = setTimeout(() => {
                if (typeof updateTop100Chart === "function") {
                    updateTop100Chart(Math.round(d3.min(selectedYears)), Math.round(d3.max(selectedYears)), updateTop10Chart); 
                }
            }, 150);

        // **Fix the Recursive Loop**
        const newSelection = [xScale(minYear), xScale(maxYear) + xScale.bandwidth()];
        const currentSelection = event.selection.map(Math.round);

        // Only move brush if the selection is different
        if (Math.abs(currentSelection[0] - newSelection[0]) > 1 || Math.abs(currentSelection[1] - newSelection[1]) > 1) {
            svg.select(".brush").call(brush.move, newSelection);
        }
    }
}}
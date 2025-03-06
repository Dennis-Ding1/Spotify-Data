function drawTop10Songs(data) {
    data.forEach(d => {
        d["Spotify Streams"] = +d["Spotify Streams"];
        d["Release Year"] = new Date(d["Release Date"]).getFullYear(); // Extract Year
    });

    const margin = {top: 50, right: 30, bottom: 100, left: 250};
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#top_10_songs")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);


    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleBand().range([0, height]).padding(0.2);

    // noUiSlider
    let minYear = 2010  // d3.min(data, d => d["Release Year"]);
    let maxYear = d3.max(data, d => d["Release Year"]);

    let slider = document.getElementById("year-slider");

    noUiSlider.create(slider, {
        start: [minYear, maxYear], 
        connect: true,
        range: {
            "min": minYear,
            "max": maxYear
        },
        step: 1,
        tooltips: [true, true], 
        format: {
            to: value => Math.round(value),
            from: value => Math.round(value)
        }
    });

    function updateChart([selectedMinYear, selectedMaxYear]) {
        selectedMinYear = Math.round(selectedMinYear);
        selectedMaxYear = Math.round(selectedMaxYear);

        // Update displayed year values
        // document.getElementById("minYearLabel").textContent = selectedMinYear;
        // document.getElementById("maxYearLabel").textContent = selectedMaxYear;

        d3.select(".chart-title")
        .text(`Top 10 Most Streamed Songs on Spotify (${selectedMinYear} - ${selectedMaxYear})`);

        let filteredData = data.filter(d => d["Release Year"] >= selectedMinYear && d["Release Year"] <= selectedMaxYear);

        let top10 = filteredData.sort((a, b) => b["Spotify Streams"] - a["Spotify Streams"]).slice(0, 10);

        x.domain([0, d3.max(top10, d => d["Spotify Streams"])]);
        y.domain(top10.map(d => d["Track"]));

        let bars = svg.selectAll(".bar").data(top10);

        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .merge(bars)
            .transition().duration(500)
            .attr("y", d => y(d["Track"]))
            .attr("width", d => x(d["Spotify Streams"]))
            .attr("height", y.bandwidth());

        bars.exit().remove(); 

        svg.select(".x-axis")
            .transition().duration(500)
            .call(d3.axisBottom(x).ticks(5).tickFormat(d => d3.format(".1f")(d / 1e9) + "B"));

        svg.select(".y-axis")
            .transition().duration(500)
            .call(d3.axisLeft(y));

        let labels = svg.selectAll(".bar-label").data(top10);

        labels.enter()
            .append("text")
            .attr("class", "bar-label")
            .merge(labels)
            .transition().duration(500)
            .attr("x", d => x(d["Spotify Streams"]) + 5)
            .attr("y", d => y(d["Track"]) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .text(d => d3.format(".1f")(d["Spotify Streams"] / 1e9) + "B");

        labels.exit().remove();
    }

    svg.append("g").attr("class", "x-axis").attr("transform", `translate(0, ${height})`);
    svg.append("g").attr("class", "y-axis");

    slider.noUiSlider.on("update", values => updateChart(values));

    updateChart([minYear, maxYear]);
}

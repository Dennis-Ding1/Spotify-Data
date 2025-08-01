function drawCorr(data) {
    data.forEach(d => {
        d["Spotify Streams"] = +d["Spotify Streams"];
        d["Spotify Playlist Reach"] = +d["Spotify Playlist Reach"];
    });

    const uniqueArtists = [...new Set(data.map(d => d["Artist"]))].sort();

    const artistSearch = d3.select("#artistSearch");
    const artistSuggestions = d3.select("#artistSuggestions");
    const resetSearch = d3.select("#resetSearch");

    artistSearch.on("input", function () {
        const searchValue = this.value.toLowerCase().trim();
        const filteredArtists = uniqueArtists.filter(artist =>
            artist.toLowerCase().includes(searchValue)
        );

        artistSuggestions.html("");

        if (searchValue === "" || filteredArtists.length === 0) {
            artistSuggestions.style("display", "none");
            return;
        }

        artistSuggestions.style("display", "block");

        filteredArtists.slice(0, 10).forEach(artist => {
            artistSuggestions.append("li")
                .text(artist)
                .on("click", function () {
                    artistSearch.node().value = artist;
                    artistSuggestions.style("display", "none");
                    updateScatterPlot();
                });
        });
    });

    artistSearch.on("blur", function () {
        const currentValue = artistSearch.node().value;
        if (!uniqueArtists.includes(currentValue)) {
            artistSearch.node().value = "";
        }
    });

    d3.select("body").on("click", function (event) {
        if (!event.target.closest("#artistSearch") && !event.target.closest("#artistSuggestions")) {
            artistSuggestions.style("display", "none");
        }
    });

    const margin = { top: 50, right: 50, bottom: 100, left: 100 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#chart3")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d["Spotify Playlist Reach"])])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d["Spotify Streams"])])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format(".2s")));

    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format(".2s")));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Spotify Playlist Reach");

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -60)
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Spotify Streams");

    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("padding", "8px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("visibility", "hidden")
        .style("font-size", "14px");

    const circles = svg.selectAll(".point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", d => xScale(d["Spotify Playlist Reach"]))
        .attr("cy", d => yScale(d["Spotify Streams"]))
        .attr("r", 3)
        .style("fill", "#1DB954")
        .style("opacity", 0.7)
        .on("mouseover", function (event, d) {
            d3.select(this).style("fill", "#004d00");
            tooltip.html(`<strong>${d["Track"]}</strong><br>
                          Artist: ${d["Artist"]}<br>
                          Streams: ${d3.format(",")(d["Spotify Streams"])}<br>
                          Playlist Reach: ${d3.format(",")(d["Spotify Playlist Reach"])}`)
                .style("visibility", "visible")
                .style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function () {
            d3.select(this).style("fill", "#1DB954");
            tooltip.style("visibility", "hidden");
        });

    function updateScatterPlot() {
        const selectedArtist = artistSearch.node().value;
        if (!selectedArtist){
            circles.transition().duration(500)
            .style("opacity", 0.7)
        }
        if (!uniqueArtists.includes(selectedArtist)) return;

        circles.transition().duration(500)
            .style("opacity", d =>
                selectedArtist === "" || d["Artist"] === selectedArtist ? 1 : 0.1)
            .style("fill", d =>
                selectedArtist === "" || d["Artist"] === selectedArtist ? "#1DB954" : "#cccccc"
            ); // Spotify Green for selected, Light Gray for others
    }

    resetSearch.on("click", function () {
        artistSearch.node().value = ""; 
        artistSuggestions.style("display", "none");
        updateScatterPlot(); 
    });

}

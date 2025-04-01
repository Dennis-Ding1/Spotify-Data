export function drawCorr(data) {
    data.forEach(d => {
        d["Spotify Streams"] = +d["Spotify Streams"];
        d["Spotify Playlist Reach"] = +d["Spotify Playlist Reach"];
        d["Release Year"] = +d["Release Year"]; // 确保Release Year是数字类型
    });

    // 获取最小和最大年份
    const minYear = d3.min(data, d => d["Release Year"]);
    const maxYear = d3.max(data, d => d["Release Year"]);

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
    // 获取容器尺寸
    let containerWidth = document.getElementById("chart3").getBoundingClientRect().width;
    let containerHeight = document.getElementById("chart3").getBoundingClientRect().height;
    
    // 使用更大的尺寸，但确保不超过容器
    let width = Math.min(containerWidth * 1.2, containerWidth) - margin.left - margin.right;
    let height = Math.min(containerHeight * 1.2, containerHeight) - margin.top - margin.bottom;

    // 确保SVG至少有最小尺寸
    width = Math.max(width, 600);
    height = Math.max(height, 400);

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
        .each(function (d) { d.originalColor = "#1DB954"; })
        .on("mouseover", function (event, d) {
            const currentColor = d3.color(d3.select(this).style("fill")); 
            const darkerColor = currentColor.darker(1); 

            d3.select(this)
                .attr("previousColor", currentColor)
                .style("fill", darkerColor);
            tooltip.html(`<strong>${d["Track"]}</strong><br>
                          Artist: ${d["Artist"]}<br>
                          Streams: ${d3.format(",")(d["Spotify Streams"])}<br>
                          Playlist Reach: ${d3.format(",")(d["Spotify Playlist Reach"])}`)
                .style("visibility", "visible")
                .style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function () {
            const previousColor = d3.select(this).attr("previousColor") || d.originalColor;
            d3.select(this).style("fill", previousColor);
            tooltip.style("visibility", "hidden");
        });

    // 添加变量保存当前筛选条件
    let currentArtist = "";
    let currentMinYear = 0;
    let currentMaxYear = 3000; // 一个足够大的年份

    function updateScatterPlot() {
        currentArtist = artistSearch.node().value;
        updateVisualization();
    }

    function updateByYearRange(minYear, maxYear) {
        currentMinYear = minYear;
        currentMaxYear = maxYear;
        
        // 更新图表标题，显示选中的年份范围
        d3.select("#corr-chart-title")
            .html(`Correlation Between Playlist Reach and Streams <br> (${minYear} - ${maxYear})`);
            
        updateVisualization();
    }

    // 新的统一更新函数
    function updateVisualization() {
        circles.transition().duration(500)
            .style("opacity", d => {
                const matchesArtist = !currentArtist || d["Artist"] === currentArtist;
                const year = +d["Release Year"];
                const matchesYear = year >= currentMinYear && year <= currentMaxYear;
                
                // 只有在年份范围内的点才会显示
                if (matchesYear) {
                    // 如果有艺术家筛选，只显示匹配的艺术家
                    if (currentArtist) {
                        return d["Artist"] === currentArtist ? 1 : 0.7;
                    } else {
                        return 0.7; // 没有艺术家筛选时，所有年份范围内的点显示
                    }
                } else {
                    return 0; // 不在范围内的点全部隐藏
                }
            })
            .style("fill", d => {
                // 只区分艺术家匹配的点
                if (currentArtist && d["Artist"] === currentArtist) {
                    return "#FF7700"; // 艺术家匹配的点使用橙色高亮
                } else {
                    return "#1DB954"; // 其他点保持绿色
                }
            })
            .attr("r", d => {
                // 艺术家匹配的点稍微大一些
                if (currentArtist && d["Artist"] === currentArtist) {
                    return 4;
                } else {
                    return 3;
                }
            });

        // 将不可见的点移到后面
        circles.filter(d => {
            const year = +d["Release Year"];
            return !(year >= currentMinYear && year <= currentMaxYear);
        }).each(function() {
            this.parentNode.appendChild(this);
        });
            
        // 将可见但非高亮的点移到中间层
        if (currentArtist) {
            circles.filter(d => {
                const year = +d["Release Year"];
                const matchesYear = year >= currentMinYear && year <= currentMaxYear;
                return matchesYear && d["Artist"] !== currentArtist;
            }).each(function() {
                this.parentNode.appendChild(this);
            });
                
            // 将高亮的点移到最前面
            circles.filter(d => {
                const year = +d["Release Year"];
                const matchesYear = year >= currentMinYear && year <= currentMaxYear;
                return matchesYear && d["Artist"] === currentArtist;
            }).each(function() {
                this.parentNode.appendChild(this);
            });
        }
    }

    window.updateCorrChart = updateByYearRange;

    // 初始化标题，显示所有数据的年份范围
    updateByYearRange(minYear, maxYear);

    resetSearch.on("click", function () {
        artistSearch.node().value = "";
        artistSuggestions.style("display", "none");
        
        currentArtist = "";
        updateVisualization();
    });
}
let debounceTimer;
let mainBrush; // 保存主要brush的引用
let miniBrush; // 保存小型brush的引用
let mainSvg; // 保存主要svg的引用
let miniSvg; // 保存小型svg的引用
let mainXScale; // 保存主要x轴比例尺
let miniXScale; // 保存小型x轴比例尺
let songCountsArray; // 保存歌曲计数数据
let globalUpdateTop100Chart; // 保存全局updateTop100Chart引用
let globalUpdateTop10Chart; // 保存全局updateTop10Chart引用
let initialYearRange; // 保存初始年份范围，用于重置

export function drawSongCountByYear(data, updateTop100Chart, updateTop10Chart) {
    // 保存函数引用到全局变量
    globalUpdateTop100Chart = updateTop100Chart;
    globalUpdateTop10Chart = updateTop10Chart;
    
    // Convert release years to numbers
    data.forEach(d => d["Release Year"] = +d["Release Year"]);

    // Count the number of songs per release year
    const songCounts = d3.rollup(data, v => v.length, d => d["Release Year"]);
    songCountsArray = Array.from(songCounts, ([year, count]) => ({ year, count }))
        .sort((a, b) => a.year - b.year);
        
    // 设置初始年份范围
    initialYearRange = [
        Math.min(...songCountsArray.map(d => d.year)), 
        Math.max(...songCountsArray.map(d => d.year))
    ];

    // 绘制主要图表
    drawMainChart(songCountsArray);
    
    // 绘制小型图表
    drawMiniChart(songCountsArray);
    
    // 添加重置按钮
    addResetButton();
    
    // 添加滚动监听，控制小型brush显示/隐藏
    setupScrollListener();
}

function drawMainChart(songCountsArray) {
    // Set up dimensions
    const margin = { top: 40, right: 30, bottom: 80, left: 80 };
    const width = 1150 - margin.left - margin.right;
    const height = 330 - margin.top - margin.bottom;

    // Create SVG container
    mainSvg = d3.select("#chart4")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
        
    // Create scales
    mainXScale = d3.scaleBand()
        .domain(songCountsArray.map(d => d.year))
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(songCountsArray, d => d.count)])
        .nice()  // Ensures better tick placement
        .range([height, 0]);

    // Add bars
    mainSvg.selectAll(".bar")
        .data(songCountsArray)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => mainXScale(d.year))
        .attr("y", d => yScale(d.count))
        .attr("width", mainXScale.bandwidth())
        .attr("height", d => height - yScale(d.count))
        .attr("fill", "#1DB954");
    
    // Add count labels at the top of each bar
    mainSvg.selectAll(".bar-label")
        .data(songCountsArray)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", d => mainXScale(d.year) + mainXScale.bandwidth() / 2)
        .attr("y", d => yScale(d.count) - 5) 
        .attr("text-anchor", "middle") 
        .style("font-size", "12px")
        .style("fill", "black")
        .text(d => d.count);

    // Add X-axis
    mainSvg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(mainXScale)
        .tickValues(songCountsArray.map(d => d.year)) 
    )
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");
    
    // Add X-axis label
    mainSvg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 50)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Release Year");

    // Add Y-axis
    mainSvg.append("g").call(d3.axisLeft(yScale));

    // Add Y-axis label
    mainSvg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2) 
        .attr("y", -50)  
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Number of Songs");

    // Add Brush
    let isBrushing = false;
    mainBrush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("start", () => {
            isBrushing = true;
            console.log("Main brush started");
        })
        .on("brush end", event => {
            // 只在用户操作时响应
            if (event.sourceEvent && (event.sourceEvent.type === "mousemove" || event.sourceEvent.type === "mouseup")) {
                console.log("Main brush event: " + event.type);
                
                // 避免无限循环：先更新mini brush，不触发其brushed
                if (miniBrush && miniSvg && event.selection) {
                    try {
                        // 计算对应小型brush的范围
                        const [x0, x1] = event.selection;
                        const miniWidth = miniXScale.range()[1];
                        const mainWidth = mainXScale.range()[1];
                        
                        const miniX0 = (x0 / mainWidth) * miniWidth;
                        const miniX1 = (x1 / mainWidth) * miniWidth;
                        
                        // 静默更新小型brush位置，不触发事件
                        miniSvg.select(".mini-brush").call(miniBrush.move, [miniX0, miniX1]);
                    } catch (e) {
                        console.error("Error updating mini brush:", e);
                    }
                }
                
                // 然后直接调用brushed，只触发一次
                brushed(event, false);
            }
            
            if (event.type === "end") {
                setTimeout(() => { isBrushing = false; }, 300);
            }
        });
        
    mainSvg.append("g")
        .attr("class", "brush")
        .call(mainBrush);
}

function drawMiniChart(songCountsArray) {
    // 设置更小的图表尺寸，减小边距
    const margin = { top: 3, right: 3, bottom: 12, left: 1 };
    const width = 290 - margin.left - margin.right;
    const height = 50 - margin.top - margin.bottom; // 减小高度
    
    // 保存yScale为函数作用域变量，以便在updateSvgSize中使用
    let yScale;

    // 获取container
    const miniBrushContainer = d3.select("#mini-brush-container");
    
    // 创建标题栏和控制按钮
    const header = miniBrushContainer.append("div")
        .attr("class", "mini-brush-header");
        
    // 删除标题文本，只保留空的div作为占位
    header.append("div")
        .attr("class", "mini-brush-title");
        
    const controls = header.append("div")
        .attr("class", "mini-brush-controls");
    
    // 添加重置按钮
    controls.append("span")
        .attr("class", "mini-brush-control reset")
        .attr("title", "重置选择范围")
        .html("↺") // 使用循环箭头符号表示重置
        .on("click", function(event) {
            event.stopPropagation();
            resetBrushSelection();
        });
        
    // 只保留最小化按钮
    controls.append("span")
        .attr("class", "mini-brush-control minimize")
        .attr("title", "最小化")
        .html("_")
        .on("click", function(event) {
            event.stopPropagation();
            toggleMinimize();
        });

    // 创建SVG容器
    miniSvg = d3.select("#mini-chart4")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // 创建比例尺，减少显示的年份数量以避免重叠
    miniXScale = d3.scaleBand()
        .domain(songCountsArray.map(d => d.year))
        .range([0, width])
        .padding(0.1); // 减小padding使柱子更紧凑

    yScale = d3.scaleLinear()
        .domain([0, d3.max(songCountsArray, d => d.count)])
        .nice()
        .range([height, 0]);

    // 添加柱状图，减小柱子宽度
    miniSvg.selectAll(".mini-bar")
        .data(songCountsArray)
        .enter()
        .append("rect")
        .attr("class", "mini-bar")
        .attr("x", d => miniXScale(d.year))
        .attr("y", d => yScale(d.count))
        .attr("width", miniXScale.bandwidth() * 0.9) // 柱子宽度稍微减小
        .attr("height", d => height - yScale(d.count))
        .attr("fill", "#1DB954");

    // 添加简化的X轴，减少刻度数量
    miniSvg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(miniXScale)
            .tickValues(songCountsArray.filter((d, i) => i % 7 === 0).map(d => d.year)) // 增加刻度间隔
            .tickSize(2)
        )
        .selectAll("text")
        .style("font-size", "6px"); // 减小字体大小

    // 添加小型brush
    miniBrush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("start brush end", event => {
            // 只在用户操作时响应
            if (event.sourceEvent && (event.sourceEvent.type === "mousemove" || event.sourceEvent.type === "mouseup")) {
                // 避免无限循环：先更新main brush，不触发其brushed
                if (mainBrush && mainSvg && event.selection) {
                    // 计算对应主要brush的范围
                    const [x0, x1] = event.selection;
                    const miniWidth = miniXScale.range()[1];
                    const mainWidth = mainXScale.range()[1];
                    
                    const mainX0 = (x0 / miniWidth) * mainWidth;
                    const mainX1 = (x1 / miniWidth) * mainWidth;
                    
                    // 静默更新主要brush位置，不触发事件
                    mainSvg.select(".brush").call(mainBrush.move, [mainX0, mainX1]);
                }
                
                // 然后直接调用brushed，只触发一次
                if (event.type === "end" || event.type === "brush") {
                    console.log("Mini brush event: " + event.type);
                    brushed(event, true);
                }
            }
        });

    miniSvg.append("g")
        .attr("class", "mini-brush")
        .call(miniBrush);
    
    // 保存最后的大小 (只用于最小化功能)
    let lastSize = { width: 300, height: 80 };
    let isMinimized = false;
    
    // 最小化/最大化切换函数
    function toggleMinimize() {
        if (isMinimized) {
            // 恢复
            miniBrushContainer
                .style("height", `${lastSize.height}px`)
                .style("width", `${lastSize.width}px`);
            d3.select("#mini-chart4").style("display", "block");
            d3.select(".minimize").html("_").attr("title", "最小化");
        } else {
            // 最小化
            d3.select("#mini-chart4").style("display", "none");
            miniBrushContainer
                .style("height", "30px")
                .style("width", "120px");
            d3.select(".minimize").html("□").attr("title", "恢复");
        }
        isMinimized = !isMinimized;
    }
}

function addResetButton() {
    // 找到chart-instructions元素
    const instructionsElement = d3.select(".chart-instructions");
    
    // 将说明文本设置为居中
    instructionsElement
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("text-align", "center");
        
    // 添加重置按钮到指令文本下方中间位置
    instructionsElement
        .append("span")
        .attr("class", "main-reset-button")
        .style("cursor", "pointer")
        .style("color", "#333333")  // 使用深灰色替代绿色
        .style("font-weight", "bold")
        .style("margin-top", "10px")
        .text("reset")
        .on("click", resetBrushSelection);
}

function setupScrollListener() {
    const chart4Element = document.getElementById('chart4');
    const miniBrushContainer = document.getElementById('mini-brush-container');
    
    // 只恢复最小化状态
    try {
        const isMinimized = localStorage.getItem('miniBrushMinimized') === 'true';
        
        if (isMinimized) {
            // 如果之前是最小化状态，恢复它
            setTimeout(() => {
                d3.select("#mini-chart4").style("display", "none");
                miniBrushContainer.style.height = "30px";
                miniBrushContainer.style.width = "120px";
                d3.select(".minimize").html("□").attr("title", "恢复");
            }, 100);
        }
    } catch (e) {
        console.error("Error restoring mini brush state:", e);
    }
    
    // 只保存最小化状态
    setInterval(() => {
        if (miniBrushContainer.style.display === 'block') {
            try {
                const isMinimized = miniBrushContainer.offsetHeight <= 35;
                localStorage.setItem('miniBrushMinimized', isMinimized);
            } catch (e) {
                console.error("Error saving mini brush state:", e);
            }
        }
    }, 2000); // 每2秒保存一次
    
    window.addEventListener('scroll', () => {
        // 当主要图表滚出视口时显示小型brush
        const rect = chart4Element.getBoundingClientRect();
        
        // 如果主要图表的底部位于视口上方，显示小型brush
        if (rect.bottom < 0) {
            miniBrushContainer.style.display = 'block';
            
            // 检查主图表是否有选择
            const mainSelection = mainBrush && d3.brushSelection(mainSvg.select(".brush").node());
            
            // 如果主图表有选择但小型brush没有选择，同步选择状态
            if (mainSelection && miniBrush) {
                const miniWidth = miniXScale.range()[1];
                const mainWidth = mainXScale.range()[1];
                
                const miniX0 = (mainSelection[0] / mainWidth) * miniWidth;
                const miniX1 = (mainSelection[1] / mainWidth) * miniWidth;
                
                // 设置小型brush的范围与主brush一致
                miniSvg.select(".mini-brush").call(miniBrush.move, [miniX0, miniX1]);
            }
            // 如果小型brush没有设置选择范围且主图表也没有选择范围，不设置任何选择
            else if (!mainSelection && !d3.brushSelection(miniSvg.select(".mini-brush").node())) {
                // 不设置默认选择，保持无选择状态
            }
        } else {
            miniBrushContainer.style.display = 'none';
        }
    });
}

function brushed(event, isMini) {
    if (!event.selection) {
        console.log("No selection in brushed event, showing all data");
        // 当没有选择时，恢复到显示所有数据
        // 注意：这里不调用updateAllCharts，因为resetBrushSelection会直接调用
        // 否则会导致重复调用
        if (event.type === "end") {
            updateAllCharts(initialYearRange[0], initialYearRange[1], globalUpdateTop100Chart, globalUpdateTop10Chart);
        }
        return;
    }

    try {
        // 根据调用来源选择合适的比例尺
        const xScale = isMini ? miniXScale : mainXScale;
        const selection = event.selection;
    
        const [x0, x1] = selection;
        const selectedYears = songCountsArray
        .map(d => d.year)
        .filter(year => {
            // 使用合适的比例尺
            const yearPos = xScale(year) + xScale.bandwidth() / 2;
            return yearPos >= x0 && yearPos <= x1;
        });
    
        if (selectedYears.length > 0) {
            const minYear = Math.round(d3.min(selectedYears));
            const maxYear = Math.round(d3.max(selectedYears));
            console.log(`Selected Years: ${minYear} - ${maxYear}, from ${isMini ? "mini" : "main"} brush`);
            
            clearTimeout(debounceTimer);
    
            debounceTimer = setTimeout(() => {
                console.log(`Triggering update for years ${minYear}-${maxYear}`);
                // 无论是哪种brush都更新所有图表
                updateAllCharts(minYear, maxYear, globalUpdateTop100Chart, globalUpdateTop10Chart);
            }, 150);
    
            // 如果是从主brush调用，且需要修正brush位置
            if (!isMini && event.type === "end") {
                // **Fix the Recursive Loop**
                const newSelection = [mainXScale(minYear), mainXScale(maxYear) + mainXScale.bandwidth()];
                const currentSelection = selection.map(Math.round);
    
                // Only move brush if the selection is different
                if (Math.abs(currentSelection[0] - newSelection[0]) > 1 || Math.abs(currentSelection[1] - newSelection[1]) > 1) {
                    console.log("Adjusting main brush position");
                    mainSvg.select(".brush").call(mainBrush.move, newSelection);
                }
            }
        } else {
            console.warn("No years selected in brush range");
        }
    } catch (e) {
        console.error("Error in brushed function:", e);
    }
}

// 封装更新所有图表的函数，确保一致性
function updateAllCharts(minYear, maxYear, updateTop100Chart, updateTop10Chart) {
    console.log(`Updating all charts for years: ${minYear} - ${maxYear}`);
    
    // 确保minYear和maxYear总是有效的
    if (!minYear || !maxYear || minYear > maxYear) {
        console.warn("Invalid year range, using initial range");
        minYear = initialYearRange[0];
        maxYear = initialYearRange[1];
    }
    
    // 确保有值且在范围内
    minYear = Math.max(minYear, initialYearRange[0]);
    maxYear = Math.min(maxYear, initialYearRange[1]);
    
    console.log(`Adjusted year range: ${minYear} - ${maxYear}`);
    
    // 更新标题
    try {
        document.querySelectorAll(".chart-title").forEach(title => {
            if (title) {
                const titleText = title.innerText;
                if (titleText.includes("Top 10 Most Streamed Songs")) {
                    title.innerHTML = `Top 10 Most Streamed Songs on Spotify <br> (${minYear} - ${maxYear})`;
                } else if (titleText.includes("Track Score Ranges")) {
                    title.innerHTML = `Track Score Ranges in Top 100 Most Popularity Songs <br> (${minYear} - ${maxYear})`;
                }
            }
        });
    } catch (e) {
        console.error("Error updating chart titles:", e);
    }
    
    // 先尝试单独更新top_10_songs图表，这样即使top_100_songs失败也能正常工作
    try {
        if (typeof updateTop10Chart === "function") {
            console.log("Directly updating top 10 songs chart");
            updateTop10Chart(minYear, maxYear);
        }
    } catch (e) {
        console.error("Error directly updating top 10 chart:", e);
    }
    
    // 更新top_100_songs图表（它内部会调用updateTop10Chart）
    try {
        if (typeof updateTop100Chart === "function") {
            console.log("Updating top 100 songs chart");
            updateTop100Chart(minYear, maxYear, null); // 传入null防止它再次调用updateTop10Chart
        }
    } catch (e) {
        console.error("Error updating top 100 chart:", e);
    }
    
    // 更新corr.js图表
    try {
        if (typeof window.updateCorrChart === "function") {
            console.log("Updating correlation chart");
            window.updateCorrChart(minYear, maxYear);
        } else {
            console.warn("updateCorrChart is not available");
        }
    } catch (e) {
        console.error("Error updating correlation chart:", e);
    }
    
    console.log("Chart updates completed for years:", minYear, "-", maxYear);
}

// 将resetBrushSelection函数移到全局作用域
function resetBrushSelection() {
    console.log("Clearing brush selection");
    
    // 直接调用updateAllCharts显示所有年份的数据
    updateAllCharts(initialYearRange[0], initialYearRange[1], globalUpdateTop100Chart, globalUpdateTop10Chart);
    
    // 清除mini brush选择
    if (miniSvg && miniBrush) {
        try {
            miniSvg.select(".mini-brush").call(miniBrush.move, null);
        } catch (e) {
            console.error("Error clearing mini brush:", e);
        }
    }
    
    // 清除main brush选择
    if (mainSvg && mainBrush) {
        try {
            mainSvg.select(".brush").call(mainBrush.move, null);
        } catch (e) {
            console.error("Error clearing main brush:", e);
        }
    }
}
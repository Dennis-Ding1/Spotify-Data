import { drawTop10Songs } from './top_10_songs.js';
import { drawTop100Songs } from './top_100_songs.js';
import { drawCorr } from './corr.js';
import { drawSongCountByYear } from './song_count.js';

d3.csv("data/Cleaned_Spotify_Data.csv").then(function(data) {
    console.log("Data loaded, total records:", data.length);
    
    try {
        // 筛选有效数据
        data = data.filter(d => !isNaN(+d["Spotify Streams"]) && d["Spotify Streams"] > 0);
        console.log("Valid records after filtering:", data.length);
        
        // 按顺序初始化所有图表，确保引用关系正确
        console.log("Initializing top 10 songs chart");
        const updateTop10Chart = drawTop10Songs(data);
        
        console.log("Initializing top 100 songs chart");
        const updateTop100Chart = drawTop100Songs(data, updateTop10Chart);
        
        console.log("Initializing correlation chart");
        drawCorr(data);
        
        console.log("Initializing song count chart (with brush)");
        drawSongCountByYear(data, updateTop100Chart, updateTop10Chart);
        
        console.log("All charts initialized successfully");
    } catch (error) {
        console.error("Error initializing charts:", error);
    }
}).catch(function(error) {
    console.error("Error loading data:", error);
});



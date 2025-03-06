d3.csv("data/Cleaned_Spotify_Data.csv").then(function(data) {
    drawTop10Songs(data)
    drawCorr(data)
    
});



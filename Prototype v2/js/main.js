d3.csv("data/Cleaned_Spotify_Data.csv").then(function(data) {
    let updateTop10Chart = drawTop10Songs(data);
    drawCorr(data)
    drawTop100Songs(data, updateTop10Chart)
});



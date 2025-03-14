import { drawTop10Songs } from './top_10_songs.js';
import { drawTop100Songs } from './top_100_songs.js';
import { drawCorr } from './corr.js';
import { drawSongCountByYear } from './song_count.js';

d3.csv("data/Cleaned_Spotify_Data.csv").then(function(data) {
    data.filter(d => !Number.isNaN(d["Spotify Streams"]));
    let updateTop10Chart = drawTop10Songs(data);
    let updateTop100Chart = drawTop100Songs(data, updateTop10Chart);drawCorr(data);
    drawSongCountByYear(data, updateTop100Chart, updateTop10Chart);
});



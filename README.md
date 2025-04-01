# Spotify Data Visualization Project

## Project Team
Created by Yinuo Yang, Haochen Ding, Xinyue Li 

## Overview
This project visualizes Spotify streaming data to reveal trends and insights about what makes songs successful on the platform. It explores the relationship between release years, popularity, track scores, playlist reach, and streaming numbers through interactive visualizations.

## Live Demo
- **Project Website**: [https://dennis-ding1.github.io/CSC316-Project/](https://dennis-ding1.github.io/CSC316-Project/)

## Technologies Used

### Libraries
- **D3.js (v7)**: Used for creating all data visualizations and handling data transformations
- **Bootstrap (v5.3.0)**: Used for responsive layout and UI components
- **noUISlider (v15.6.1)**: Implemented for the brush/selection functionality
- **Font Awesome (v6.4.2)**: Used for icons throughout the interface

### Custom Code
The following components were custom developed:
- All data visualization implementations (charts, transitions, interactions)
- Data filtering and transformation logic
- Responsive design adaptations
- Cross-chart filtering and highlighting mechanics

## Features

### 1. Release Year Trends Visualization
This large chart at the top of the page shows the distribution of the most streamed songs by release year.

**Key features:**
- **Brush Selection**: Users can drag to select a range of years, which automatically updates all other visualizations
- **Reset Button**: A "reset" button positioned in the center below the instructions allows users to clear their selection
- **Automatic Updates**: All other charts update in real-time as the user adjusts their year selection

### 2. Top 10 Most Streamed Songs
This bar chart displays the top 10 songs based on streaming numbers.

**Key features:**
- **Dynamic Updates**: Updates automatically based on the year range selection
- **Responsive Title**: The chart title changes to reflect the selected year range
- **Streaming Data**: Shows stream counts in billions for easy readability
- **Smooth Transitions**: Animated transitions when the data changes based on year selection

### 3. Track Score Ranges Visualization
This line and dot chart shows the distribution of track scores among the top 100 most popular songs.

**Key features:**
- **Binned Categories**: Scores are grouped into ranges (50-point intervals) for easier analysis
- **Interactive Dots**: Hover over dots to see detailed information about each score range
- **Animated Transitions**: Smooth transitions between different data states when changing year selections
- **Dynamic Updates**: Updates based on the selected year range in the main chart
- **Responsive Title**: Chart title automatically updates to reflect the current year range

### 4. Correlation Between Playlist Reach and Streams
This scatter plot shows the relationship between a song's playlist reach and its streaming numbers.

**Key features:**
- **Artist Search**: Users can search for specific artists, which highlights their songs in the chart
- **Context Awareness**: The artist search maintains the year range filter context
- **Dynamic Color Coding**: Points are colored differently based on selection state
- **Interactive Tooltips**: Hover over points to see detailed song information
- **Responsive Title**: The chart title updates to reflect the current year range selection

### 5. Global Interface Features
**Cross-filtering system:**
- All visualizations are connected; filtering in one affects the display in others
- The year range selection in the top chart governs the data shown in all other charts
- Artist search in the correlation plot highlights specific artists' songs

**Responsive design:**
- All visualizations are responsive and adapt to different screen sizes
- The interface maintains usability and readability across devices

**Non-obvious features:**
- **Mini-brush controller**: A smaller version of the year selection brush appears fixed at the top when scrolling down, allowing users to adjust their selection from anywhere on the page
- **Tooltips**: Hidden tooltip functionality appears on hover for most chart elements, providing additional context and details
- **Layer management**: When selecting artists, their data points appear on top of other points to ensure visibility
- **Visual hierarchy**: Selected data points are emphasized with larger sizes and brighter colors to draw attention

## Data Structure
The visualization uses Spotify data including:
- Release year of songs
- Streaming counts
- Playlist reach metrics
- Track scores
- Popularity ratings
- Artist information
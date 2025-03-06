import pandas as pd
import re

# Set your actual file path
file_path = "Most Streamed Spotify Songs 2024.csv"  # Change this!

# Try different encodings
encodings = ["utf-8", "ISO-8859-1", "latin1", "utf-16", "utf-16le", "utf-16be"]

for enc in encodings:
    try:
        df = pd.read_csv(file_path, encoding=enc)
        print(f"✅ Successfully loaded file using encoding: {enc}")
        break  # Stop once successful
    except UnicodeDecodeError:
        print(f"❌ Failed with encoding: {enc}, trying next...")

# Check if 'Track' column exists
if 'Track' not in df.columns:
    print("Error: No 'Track' column found in the dataset.")
    exit()

# Define a list of words to exclude (stopwords, unnecessary words)
exclude_words = set([
     "feat", "the", "a", "and", "of", "to", "in", "on", "for", "with", "by", "is", "at", "it", "this", "from", "or", "that"
])

# Function to clean and filter words
def clean_word(word):
    word = re.sub(r"[^\w\s]", "", word)  # Remove punctuation (keep only letters & numbers)
    word = word.lower().strip()  # Convert to lowercase & remove extra spaces
    if word.isdigit():  # Exclude numbers
        return None
    return word

# Split each track name into individual words, clean them, and filter out excluded words
word_list = []
for track in df["Track"].dropna():  # Remove NaN values
    words = track.split()  # Split by space
    for word in words:
        cleaned_word = clean_word(word)  # Remove punctuation
        if cleaned_word and cleaned_word not in exclude_words:  # Exclude empty words & stopwords
            word_list.append(cleaned_word)

# Convert to DataFrame
word_df = pd.DataFrame(word_list, columns=["Word"])

# Save to CSV (Ready for Tableau)
output_path = "D:/Documents/U of T 大三/CSC316/Project/cleaned_filtered_word_data.csv"
word_df.to_csv(output_path, index=False)

print(f"✅ Process completed! The cleaned and filtered data is saved as '{output_path}'.")

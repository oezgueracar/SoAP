import json

embeddings = {}
with open("glove.6B.50d.txt", "r", encoding="utf-8") as f:
    for line in f:
        values = line.split()
        word = values[0]
        vector = list(map(float, values[1:]))
        embeddings[word] = vector

with open("glove_50d.json", "w") as json_file:
    json.dump(embeddings, json_file)
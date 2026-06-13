import os

BASE = "/Users/maximus/IdeaProjects/brewpage-cookbook/recipes/rag-guide/mokups/concepts"
FOLDERS = ["what-rag", "why-rag", "search"]
FILES = [
    "01-route-dot.html",
    "03-sonar-chart.html",
    "04-star-chart.html",
    "07-cartographer-lab.html",
]

for folder in FOLDERS:
    for name in FILES:
        path = os.path.join(BASE, folder, name)
        if os.path.exists(path):
            os.remove(path)
            print("deleted: " + path)
        else:
            print("skip (missing): " + path)

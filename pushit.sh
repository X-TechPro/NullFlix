#!/bin/bash
# NullFlix Git Commit & Push Script (Linux)

# check if .git folder exists
if [ ! -d ".git" ]; then
    echo "Git repo not initialized. Initializing..."
    git init
    git remote add origin https://github.com/X-TechPro/NullFlix.git
fi

# make sure we’re on main
git checkout -q -B main

# add all changes
git add .

# prompt for commit message
read -p "Enter commit message: " msg

# commit
git commit -m "$msg"

# push to origin
git push -u origin main

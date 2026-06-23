#!/bin/bash
echo "Starting MongoDB for Timetable Generator..."
mongod --dbpath ./data/db --logpath ./data/mongodb.log --fork
echo "MongoDB started successfully!"
echo "You can check logs at: ./data/mongodb.log"
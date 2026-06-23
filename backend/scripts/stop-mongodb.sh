#!/bin/bash
echo "Stopping MongoDB..."
mongod --dbpath ./data/db --shutdown
echo "MongoDB stopped successfully!"
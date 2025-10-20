#!/usr/bin/env python3
"""
Script to run the application with different environments
"""
import os
import sys
import uvicorn

def run_local():
    """Run with local environment"""
    os.environ["ENVIRONMENT"] = "development"
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

def run_production():
    """Run with production environment"""
    os.environ["ENVIRONMENT"] = "production"
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "prod":
        run_production()
    else:
        run_local()
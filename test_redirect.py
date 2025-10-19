#!/usr/bin/env python3

import requests
import json

# Test redirect_url functionality
BASE_URL = "http://localhost:8001"

def test_redirect_functionality():
    # First, login to get a token
    login_response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "test@example.com",
        "password": "testpassword"
    })
    
    if login_response.status_code != 200:
        print("Login failed:", login_response.text)
        return
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a test article with redirect_url
    article_data = {
        "title": "Test Redirect Article",
        "slug": "test-redirect",
        "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Test content"}]}],
        "redirect_url": "https://example.com/redirect-target"
    }
    
    create_response = requests.post(f"{BASE_URL}/articles/", 
                                  json=article_data, 
                                  headers=headers)
    
    if create_response.status_code != 200:
        print("Create failed:", create_response.text)
        return
    
    article_id = create_response.json()["article_id"]
    print(f"Created article: {article_id}")
    
    # Get the article by slug to check if redirect_url is saved
    get_response = requests.get(f"{BASE_URL}/articles/slug/test-redirect")
    
    if get_response.status_code == 200:
        article = get_response.json()
        print("Article retrieved successfully:")
        print(f"Title: {article['title']}")
        print(f"Redirect URL: {article.get('redirect_url', 'NOT FOUND')}")
        
        if article.get('redirect_url'):
            print("✅ Redirect URL is working!")
        else:
            print("❌ Redirect URL is missing!")
    else:
        print("Failed to retrieve article:", get_response.text)

if __name__ == "__main__":
    test_redirect_functionality()
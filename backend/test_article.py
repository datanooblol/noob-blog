import requests
import json

BASE_URL = "http://localhost:8001"

def print_response(step, response):
    """Helper to print response details"""
    print(f"\n=== {step} ===")
    print(f"Status: {response.status_code}")
    if response.status_code < 400:
        try:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
        except:
            print(f"Response: {response.text}")
    else:
        print(f"Error: {response.text}")

# 1. Register user
print("1. REGISTER USER")
register_data = {
    "username": "testuser",
    "email": "user@example.com", 
    "password": "string",
    "display_name": "Test User"
}
register_response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
print_response("Register", register_response)

# 2. Login
print("\n2. LOGIN")
login_data = {
    "email": "user@example.com",
    "password": "string"
}
login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
print_response("Login", login_response)

if login_response.status_code != 200:
    print("Login failed, stopping test")
    exit()

token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 3. Read all articles (should be empty initially)
print("\n3. READ ALL ARTICLES")
all_articles_response = requests.get(f"{BASE_URL}/articles/", headers=headers)
print_response("All Articles", all_articles_response)

# 4. Read my articles (should be empty)
print("\n4. READ MY ARTICLES")
my_articles_response = requests.get(f"{BASE_URL}/articles/my", headers=headers)
print_response("My Articles", my_articles_response)

# 5. Create article
print("\n5. CREATE ARTICLE")
article_data = {
    "title": "My Test Article",
    "content": [
        {
            "id": "1",
            "type": "paragraph",
            "children": [],
            "content": [{"type": "text", "text": "This is my test article content."}],
            "props": {"textAlignment": "left"}
        }
    ],
    "tags": ["test", "demo"],
    "seo_description": "A test article for demonstration"
}
create_response = requests.post(f"{BASE_URL}/articles/", json=article_data, headers=headers)
print_response("Create Article", create_response)

if create_response.status_code != 200:
    print("Article creation failed, stopping test")
    exit()

article_id = create_response.json()["article_id"]
print(f"Created article ID: {article_id}")

# 6. Update article
print("\n6. UPDATE ARTICLE")
update_data = {
    "title": "My Updated Test Article",
    "content": [
        {
            "id": "1", 
            "type": "paragraph",
            "children": [],
            "content": [{"type": "text", "text": "This is my updated test article content with more details."}],
            "props": {"textAlignment": "left"}
        }
    ],
    "tags": ["test", "demo", "updated"]
}
update_response = requests.put(f"{BASE_URL}/articles/{article_id}", json=update_data, headers=headers)
print_response("Update Article", update_response)

# 7. Publish article
print("\n7. PUBLISH ARTICLE")
publish_response = requests.patch(f"{BASE_URL}/articles/{article_id}/publish", headers=headers)
print_response("Publish Article", publish_response)

# 8. Read my articles (should show 1 published article)
print("\n8. READ MY ARTICLES AFTER PUBLISH")
my_articles_after_response = requests.get(f"{BASE_URL}/articles/my", headers=headers)
print_response("My Articles After Publish", my_articles_after_response)

# 9. Read all articles (should show 1 published article)
print("\n9. READ ALL ARTICLES AFTER PUBLISH")
all_articles_after_response = requests.get(f"{BASE_URL}/articles/")
print_response("All Articles After Publish", all_articles_after_response)

# 10. Read only published articles (using status filter)
print("\n10. READ ONLY PUBLISHED ARTICLES")
published_articles_response = requests.get(f"{BASE_URL}/articles/my?status=published", headers=headers)
print_response("Published Articles Only", published_articles_response)

# 11. Update article to archived status
print("\n11. UPDATE ARTICLE TO ARCHIVED")
archive_data = {"status": "archived"}
archive_response = requests.put(f"{BASE_URL}/articles/{article_id}", json=archive_data, headers=headers)
print_response("Archive Article", archive_response)

# 12. Read published articles after archiving (should be empty)
print("\n12. READ PUBLISHED ARTICLES AFTER ARCHIVING")
published_after_archive_response = requests.get(f"{BASE_URL}/articles/my?status=published", headers=headers)
print_response("Published Articles After Archive", published_after_archive_response)

# 13. Delete article
print("\n13. DELETE ARTICLE")
delete_response = requests.delete(f"{BASE_URL}/articles/{article_id}", headers=headers)
print_response("Delete Article", delete_response)

# 14. Read all articles after deletion
print("\n14. READ ALL ARTICLES AFTER DELETION")
all_articles_final_response = requests.get(f"{BASE_URL}/articles/")
print_response("All Articles After Deletion", all_articles_final_response)

print("\n=== TEST COMPLETE ===")
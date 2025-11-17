import requests
import sys
import json
from datetime import datetime
import time

class SideconvoAPITester:
    def __init__(self, base_url="https://ai-chat-dashboard.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.assistant_id = None
        self.session_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else f"{self.api_url}/"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_get_assistants_empty(self):
        """Test getting assistants when none exist"""
        return self.run_test("Get Assistants (Empty)", "GET", "assistants", 200)

    def test_create_assistant(self):
        """Test creating a new assistant"""
        assistant_data = {
            "name": "Test Assistant",
            "website_url": "https://example.com",
            "description": "A test assistant for API testing"
        }
        success, response = self.run_test("Create Assistant", "POST", "assistants", 200, assistant_data)
        if success and response.get('id'):
            self.assistant_id = response['id']
            print(f"   Created assistant with ID: {self.assistant_id}")
        return success, response

    def test_get_assistants_with_data(self):
        """Test getting assistants after creating one"""
        return self.run_test("Get Assistants (With Data)", "GET", "assistants", 200)

    def test_get_assistant_by_id(self):
        """Test getting specific assistant by ID"""
        if not self.assistant_id:
            print("❌ Skipped - No assistant ID available")
            return False, {}
        return self.run_test("Get Assistant by ID", "GET", f"assistants/{self.assistant_id}", 200)

    def test_update_assistant(self):
        """Test updating assistant settings"""
        if not self.assistant_id:
            print("❌ Skipped - No assistant ID available")
            return False, {}
        
        update_data = {
            "welcome_message": "Hello! Welcome to our test assistant!",
            "conversation_starters": ["What services do you offer?", "How can I contact you?"],
            "system_prompt": "You are a helpful test assistant."
        }
        return self.run_test("Update Assistant", "PATCH", f"assistants/{self.assistant_id}", 200, update_data)

    def test_trigger_crawl(self):
        """Test triggering website crawl"""
        if not self.assistant_id:
            print("❌ Skipped - No assistant ID available")
            return False, {}
        return self.run_test("Trigger Crawl", "POST", f"assistants/{self.assistant_id}/crawl", 200)

    def test_get_knowledge_base(self):
        """Test getting knowledge base"""
        if not self.assistant_id:
            print("❌ Skipped - No assistant ID available")
            return False, {}
        return self.run_test("Get Knowledge Base", "GET", f"assistants/{self.assistant_id}/knowledge", 200)

    def test_get_embed_code(self):
        """Test getting embed code"""
        if not self.assistant_id:
            print("❌ Skipped - No assistant ID available")
            return False, {}
        return self.run_test("Get Embed Code", "GET", f"assistants/{self.assistant_id}/embed-code", 200)

    def test_chat_functionality(self):
        """Test chat functionality"""
        if not self.assistant_id:
            print("❌ Skipped - No assistant ID available")
            return False, {}
        
        chat_data = {
            "message": "Hello, can you help me?",
            "session_id": f"test_session_{int(time.time())}"
        }
        success, response = self.run_test("Chat Message", "POST", f"assistants/{self.assistant_id}/chat", 200, chat_data)
        if success and response.get('session_id'):
            self.session_id = response['session_id']
        return success, response

    def test_get_conversations(self):
        """Test getting conversations"""
        if not self.assistant_id:
            print("❌ Skipped - No assistant ID available")
            return False, {}
        return self.run_test("Get Conversations", "GET", f"assistants/{self.assistant_id}/conversations", 200)

    def test_get_analytics(self):
        """Test getting analytics"""
        if not self.assistant_id:
            print("❌ Skipped - No assistant ID available")
            return False, {}
        return self.run_test("Get Analytics", "GET", f"assistants/{self.assistant_id}/analytics", 200)

    def test_delete_assistant(self):
        """Test deleting assistant"""
        if not self.assistant_id:
            print("❌ Skipped - No assistant ID available")
            return False, {}
        return self.run_test("Delete Assistant", "DELETE", f"assistants/{self.assistant_id}", 200)

def main():
    print("🚀 Starting Sideconvo API Tests")
    print("=" * 50)
    
    tester = SideconvoAPITester()
    
    # Test sequence
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("Get Assistants (Empty)", tester.test_get_assistants_empty),
        ("Create Assistant", tester.test_create_assistant),
        ("Get Assistants (With Data)", tester.test_get_assistants_with_data),
        ("Get Assistant by ID", tester.test_get_assistant_by_id),
        ("Update Assistant", tester.test_update_assistant),
        ("Trigger Crawl", tester.test_trigger_crawl),
        ("Get Knowledge Base", tester.test_get_knowledge_base),
        ("Get Embed Code", tester.test_get_embed_code),
        ("Chat Functionality", tester.test_chat_functionality),
        ("Get Conversations", tester.test_get_conversations),
        ("Get Analytics", tester.test_get_analytics),
        # Note: Not deleting assistant to keep data for frontend testing
        # ("Delete Assistant", tester.test_delete_assistant),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            success, _ = test_func()
            if not success:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
        
        # Small delay between tests
        time.sleep(1)
    
    # Print results
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {len(failed_tests)}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed tests:")
        for test in failed_tests:
            print(f"   - {test}")
    
    if tester.assistant_id:
        print(f"\n📝 Created assistant ID for frontend testing: {tester.assistant_id}")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
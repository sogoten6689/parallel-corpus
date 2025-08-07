#!/usr/bin/env python3
"""
Run all tests for the Parallel Corpus Backend
"""
import os
import sys
import subprocess
import time
from pathlib import Path

def run_test_file(test_file: str, test_name: str):
    """Run a specific test file"""
    print(f"\n🧪 Running {test_name}...")
    print("=" * 50)
    
    try:
        result = subprocess.run([sys.executable, test_file], 
                              capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print("✅ Test completed successfully")
            if result.stdout:
                print(result.stdout)
        else:
            print("❌ Test failed")
            if result.stderr:
                print(result.stderr)
            if result.stdout:
                print(result.stdout)
        
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print("⏰ Test timed out")
        return False
    except Exception as e:
        print(f"❌ Error running test: {e}")
        return False

def run_pytest_tests():
    """Run tests using pytest if available"""
    try:
        print("\n🧪 Running tests with pytest...")
        print("=" * 50)
        
        # Check if pytest is available
        result = subprocess.run([sys.executable, "-m", "pytest", "--version"], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            # Run pytest on the tests directory
            result = subprocess.run([
                sys.executable, "-m", "pytest", 
                "tests/", 
                "-v", 
                "--tb=short"
            ], capture_output=True, text=True, timeout=120)
            
            if result.returncode == 0:
                print("✅ Pytest tests completed successfully")
                if result.stdout:
                    print(result.stdout)
            else:
                print("❌ Pytest tests failed")
                if result.stderr:
                    print(result.stderr)
                if result.stdout:
                    print(result.stdout)
            
            return result.returncode == 0
        else:
            print("ℹ️ Pytest not available, skipping pytest tests")
            return True
    except Exception as e:
        print(f"❌ Error running pytest: {e}")
        return False

def main():
    """Main function to run all tests"""
    print("🚀 Starting Parallel Corpus Backend Tests")
    print("=" * 60)
    
    # Get the tests directory
    tests_dir = Path(__file__).parent
    os.chdir(tests_dir.parent)  # Change to backend directory
    
    # Define test files and their names
    test_files = [
        ("tests/test_auth_api.py", "Authentication API Tests"),
        ("tests/test_rowword_api.py", "RowWord API Tests"),
        ("tests/test_database.py", "Database Tests"),
        ("tests/test_integration.py", "Integration Tests"),
    ]
    
    # Run individual test files
    passed_tests = 0
    total_tests = len(test_files)
    
    for test_file, test_name in test_files:
        if os.path.exists(test_file):
            if run_test_file(test_file, test_name):
                passed_tests += 1
        else:
            print(f"⚠️ Test file not found: {test_file}")
    
    # Run pytest tests
    pytest_success = run_pytest_tests()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"Individual Tests: {passed_tests}/{total_tests} passed")
    print(f"Pytest Tests: {'✅ Passed' if pytest_success else '❌ Failed'}")
    
    if passed_tests == total_tests and pytest_success:
        print("\n🎉 All tests passed! Backend is working correctly.")
        return 0
    else:
        print("\n⚠️ Some tests failed. Please check the system.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code) 
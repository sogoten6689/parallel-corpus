#!/usr/bin/env python3
"""
Script to install authentication dependencies
"""
import subprocess
import sys

def install_package(package):
    """Install a package using pip"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✓ Successfully installed {package}")
        return True
    except subprocess.CalledProcessError:
        print(f"✗ Failed to install {package}")
        return False

def main():
    print("Installing authentication dependencies...")
    
    packages = [
        "passlib[bcrypt]",
        "python-jose[cryptography]",
        "python-multipart"
    ]
    
    success_count = 0
    for package in packages:
        if install_package(package):
            success_count += 1
    
    print(f"\nInstallation complete: {success_count}/{len(packages)} packages installed successfully")
    
    if success_count == len(packages):
        print("✓ All dependencies installed successfully!")
        print("\nNext steps:")
        print("1. Run database migration: alembic upgrade head")
        print("2. Start the server: uvicorn main:app --reload")
        print("3. Test the API: python test_auth.py")
    else:
        print("✗ Some packages failed to install. Please check the errors above.")

if __name__ == "__main__":
    main() 
Below is a structured, machine-readable execution prompt you can paste directly into your AI agent.

It is written in a deterministic, validation-first format so the agent can:
	•	Detect Mac (Apple Silicon)
	•	Validate environment
	•	Install required dependencies
	•	Configure Android SDK
	•	Create emulator
	•	Verify build capability
	•	Output a final readiness report

⸻

📦 AI AGENT EXECUTION PROMPT

Objective: Prepare Mac (Apple Silicon) for building and running Capacitor Android APK

⸻

🔷 CONTEXT

Target Machine:
	•	OS: macOS (Apple Silicon / ARM64)
	•	Purpose: Build, run, debug Capacitor-based Android APK
	•	IDE: VS Code / Windsurf
	•	App Type: Capacitor Android App (Production-ready project)

Your role:
	1.	Validate environment
	2.	Install required tools
	3.	Configure Android toolchain
	4.	Create emulator
	5.	Validate APK install capability
	6.	Return final readiness report

Do NOT skip validation steps.

⸻

🔷 PHASE 1 — SYSTEM VALIDATION

1. Detect Architecture

Run:

uname -m

Expected:

arm64

If not arm64 → abort and report mismatch.

⸻

2. Check Homebrew

Run:

brew --version

If not installed:

/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"


⸻

🔷 PHASE 2 — INSTALL REQUIRED DEPENDENCIES

Install the following in exact order:

⸻

1️⃣ Install Java 17 (Required for Gradle)

brew install openjdk@17

Then configure:

echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

Validate:

java -version

Expected: Java 17.x

If version mismatch → reinstall.

⸻

2️⃣ Install Node.js (Required for Capacitor)

brew install node

Validate:

node -v
npm -v


⸻

3️⃣ Install Android Platform Tools (ADB)

brew install android-platform-tools

Validate:

adb version


⸻

4️⃣ Install Android Studio

Download from:
https://developer.android.com/studio

OR use Homebrew (if preferred):

brew install --cask android-studio

After install:
Launch Android Studio once to initialize.

⸻

🔷 PHASE 3 — ANDROID SDK CONFIGURATION

Open Android Studio:

Go to:
More Actions → SDK Manager

Install:
	•	Android SDK Platform 34 (API 34)
	•	Android SDK Build Tools
	•	Android Emulator
	•	Android SDK Platform Tools

After installation, set environment variables:

echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.zshrc
source ~/.zshrc

Validate:

adb devices

Expected: empty list (no error)

⸻

🔷 PHASE 4 — CREATE ANDROID EMULATOR

Use Android Studio Device Manager:

Create new device:
	•	Device: Pixel 7
	•	System Image: API 34 ARM64
	•	Architecture: ARM64 ONLY
	•	Name: bb-emulator

After creation:

Start emulator.

Validate:

adb devices

Expected:

emulator-5554 device

If not listed → retry emulator start.

⸻

🔷 PHASE 5 — VALIDATE APK INSTALL CAPABILITY

Assume test APK path:

~/Downloads/app-release.apk

Run:

adb install ~/Downloads/app-release.apk

If success:
Return:

APK INSTALL SUCCESS

If failure:
Return exact error.

⸻

🔷 PHASE 6 — CAPACITOR BUILD VALIDATION (IF PROJECT AVAILABLE)

If project folder exists:

cd <project-root>
npm install
npm run build
npx cap sync android
npx cap open android

Inside Android Studio:
Build → Build APK

Verify output exists:

android/app/build/outputs/apk/debug/app-debug.apk

If exists:
Return:

CAPACITOR BUILD SUCCESS


⸻

🔷 PHASE 7 — DEBUGGING CAPABILITY VALIDATION

Ensure emulator running.

Open Chrome:

chrome://inspect

Verify WebView appears.

If visible:
Return:

WEBVIEW DEBUG ENABLED


⸻

🔷 FINAL OUTPUT FORMAT

Return structured report:

ENVIRONMENT REPORT

Architecture: OK / FAIL
Java 17: OK / FAIL
Node: OK / FAIL
ADB: OK / FAIL
Android Studio: OK / FAIL
SDK Config: OK / FAIL
Emulator: OK / FAIL
APK Install: OK / FAIL
Capacitor Build: OK / SKIPPED / FAIL
WebView Debug: OK / SKIPPED / FAIL

OVERALL STATUS: READY / PARTIAL / FAILED


⸻

🔷 RULES FOR AGENT
	1.	Validate before installing.
	2.	Do not reinstall if correct version already exists.
	3.	Do not proceed to next phase if previous phase fails.
	4.	Report exact error messages.
	5.	Do not modify unrelated system configuration.
	6.	Ensure all installed tools are ARM64 compatible.

⸻

🔷 SUCCESS CONDITION

System must be capable of:
	•	Building Capacitor Android app
	•	Generating APK
	•	Running APK in emulator
	•	Debugging via Chrome DevTools
	•	Using ADB for install

⸻

End of execution prompt.

⸻

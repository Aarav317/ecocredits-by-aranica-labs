ECOCREDITS BY ARANICA LABS — REDESIGN PROTOTYPE
================================================

WHAT THIS VERSION INCLUDES
- Brand identity: EcoCredits by Aranica Labs (parent/creator branding is in the header/footer).
- Public homepage uses the requested green palette:
  #D6EFD8, #80AF81, #508D4E, #1A5319
- Signed-in dashboard uses the requested blue palette:
  #086288, #4D8DBA, #97D7FF, #FFEFC4
- Mobile-first responsive layout inspired by your reference's app-like cards, but tailored to the vending-machine deposit idea.
- Signup/login, user credit balance, bottle count and demo deposit history.
- Demo deposit: 0.25 EcoCredits per bottle (4 bottles = 1 credit).
- Built-in Node.js API and local JSON storage. No extra npm packages required.

RUN ON WINDOWS
1. Extract this folder.
2. Open the EcoCredits_Redesign folder in VS Code.
3. Open Terminal (Terminal > New Terminal).
4. Check Node.js is installed: node -v
5. Run: npm start
6. Open http://localhost:3000
7. Create a test account. Then choose “Record a demo return”.

IMPORTANT PROJECT TRANSPARENCY
This is a software prototype, not a connected recycling machine. Demo deposits are manually simulated in the dashboard. A barcode/product scanner alone cannot prove a bottle was physically deposited. The real project would need a machine-side sensor/verification process and a secure machine-to-server API before awarding credits automatically. This prototype does not connect to ESP32/Arduino hardware, a real scanner, a payment service, or real reward partners. Rewards are a preview only; no company partnership is claimed.

LOCAL DATA
User accounts and demo deposits are stored in data/store.json after the server runs. This is a local demonstration datastore, not production-grade database/security. Do not use real passwords or sensitive personal data. To reset demo data, stop the server and delete data/store.json; it will be recreated next time the server starts.

BRANDING
EcoCredits is presented as a product/concept by Aranica Labs. The code does not claim a legal company relationship or registered trademark; update the wording if your actual brand structure is different.
